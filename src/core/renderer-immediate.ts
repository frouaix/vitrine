// Copyright (c) 2026 François Rouaix

// Immediate-mode rendering engine
import type { Block, BlockOfType } from './types.ts';
import { BlockType } from './types.ts';
import type { RenderContext } from './context.ts';
import { Canvas2DContext } from './context.ts';
import { EventManager } from '../events.ts';
import { PerformanceOptimizer, PerformanceMonitor, type Viewport } from '../performance.ts';
import { HitTester, type HitTestResult } from '../hit-test.ts';
import { Matrix2D } from '../transform.ts';
import { group } from './blocks.ts';

export interface RendererConfig {
  canvas?: HTMLCanvasElement;
  width?: number;
  height?: number;
  pixelRatio?: number;
  enableEvents?: boolean;
  enableCulling?: boolean;
  debugHoverOutline?: boolean;
  enableCameraControls?: boolean;
}

export class ImmediateRenderer {
  private canvas: HTMLCanvasElement;
  private context: RenderContext;
  private dxc: number;
  private dyc: number;
  private pixelRatio: number;
  private eventManager: EventManager | null = null;
  private enableCulling: boolean;
  private debugHoverOutline: boolean;
  private debugHoveredBlock: Block | null = null;
  private viewport: Viewport;
  private perfMonitor: PerformanceMonitor;
  private enableCameraControls: boolean;
  private cameraX: number = 0;
  private cameraY: number = 0;
  private cameraZoom: number = 1;
  private portalBlocks: Array<{ block: Block; transform: Matrix2D }> = [];

  constructor(config: RendererConfig = {}) {
    this.canvas = config.canvas || document.createElement('canvas');
    this.dxc = config.width || 800;
    this.dyc = config.height || 600;
    this.pixelRatio = config.pixelRatio || window.devicePixelRatio || 1;
    this.enableCulling = config.enableCulling ?? true;
    this.debugHoverOutline = config.debugHoverOutline ?? false;
    this.enableCameraControls = config.enableCameraControls ?? false;

    this.viewport = {
      x: 0,
      y: 0,
      width: this.dxc,
      height: this.dyc
    };

    this.setupCanvas();
    
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');
    this.context = new Canvas2DContext(ctx);

    // Enable event handling by default
    if (config.enableEvents !== false) {
      this.eventManager = new EventManager(this.canvas);
      
      // Setup camera controls if enabled
      if (this.enableCameraControls) {
        this.setupCameraControls();
      }
    }

    this.perfMonitor = new PerformanceMonitor();
  }

  private setupCanvas(): void {
    this.canvas.width = this.dxc * this.pixelRatio;
    this.canvas.height = this.dyc * this.pixelRatio;
    this.canvas.style.width = `${this.dxc}px`;
    this.canvas.style.height = `${this.dyc}px`;
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  resize(dxc: number, dyc: number): void {
    this.dxc = dxc;
    this.dyc = dyc;
    this.viewport.width = dxc;
    this.viewport.height = dyc;
    this.setupCanvas();
  }

  setDebugHoverOutline(enabled: boolean): void {
    this.debugHoverOutline = enabled;
  }

  getDebugHoverOutline(): boolean {
    return this.debugHoverOutline;
  }

  private setupCameraControls(): void {
    const handleWheel = (e: WheelEvent): void => {
      e.preventDefault();
      
      const zoomSpeed = 0.001;
      const panSpeed = 1;
      
      if (e.ctrlKey) {
        // Ctrl+MouseWheel: zoom in/out towards mouse pointer
        const zoomDelta = -e.deltaY * zoomSpeed;
        const newZoom = Math.max(0.1, Math.min(10, this.cameraZoom + zoomDelta));
        
        // Convert mouse position from CSS pixels to logical canvas coordinates
        const rect = this.canvas.getBoundingClientRect();
        const cssX = e.clientX - rect.left;
        const cssY = e.clientY - rect.top;
        
        // Convert CSS pixels to canvas buffer coordinates (account for display scaling)
        // rect.width is CSS pixels, canvas.width is buffer pixels (dxc * pixelRatio)
        const bufferX = cssX * (this.canvas.width / rect.width);
        const bufferY = cssY * (this.canvas.height / rect.height);
        
        // Convert buffer coordinates to logical canvas coordinates (remove pixelRatio)
        const logicalX = bufferX / this.pixelRatio;
        const logicalY = bufferY / this.pixelRatio;
        
        // Calculate world position under mouse (before zoom)
        // The camera transform is: scale(zoom) then translate(camera)
        // In canvas 2D, this means: screen = world * zoom + camera * zoom
        // Inverse: world = screen / zoom - camera
        const worldX = logicalX / this.cameraZoom - this.cameraX;
        const worldY = logicalY / this.cameraZoom - this.cameraY;
        
        // Calculate new camera position to keep world point under mouse
        // After zoom: screen = world * newZoom + newCamera * newZoom
        // So: newCamera = screen / newZoom - world
        const newCameraX = logicalX / newZoom - worldX;
        const newCameraY = logicalY / newZoom - worldY;
        
        this.cameraX = newCameraX;
        this.cameraY = newCameraY;
        this.cameraZoom = newZoom;
      } else if (e.shiftKey) {
        // Shift+MouseWheel: scroll horizontally
        this.cameraX -= e.deltaY * panSpeed;
      } else {
        // MouseWheel: scroll vertically
        this.cameraY -= e.deltaY * panSpeed;
      }
    };
    
    this.canvas.addEventListener('wheel', handleWheel, { passive: false });
  }

  getCameraTransform(): { x: number; y: number; zoom: number } {
    return {
      x: this.cameraX,
      y: this.cameraY,
      zoom: this.cameraZoom
    };
  }

  setCameraTransform(x: number, y: number, zoom: number): void {
    this.cameraX = x;
    this.cameraY = y;
    this.cameraZoom = zoom;
  }

  render(block: Block): void {
    const startTime = performance.now();

    // Clear portal collection
    this.portalBlocks = [];

    this.debugHoveredBlock = null;
    if (this.debugHoverOutline && this.eventManager) {
      const ptcLastPointer = this.eventManager.getLastPointerCanvasPosition();
      if (ptcLastPointer) {
        // Convert canvas coordinates to world coordinates using inverse camera transform
        if (this.enableCameraControls) {
          // Camera transform: scale first, then translate
          // Full transform includes pixelRatio: Scale(pixelRatio) * Camera
          const cameraTransform = Matrix2D.identity()
            .scaleXY(this.cameraZoom, this.cameraZoom)
            .translate(this.cameraX, this.cameraY);
          const fullTransform = Matrix2D.identity()
            .scaleXY(this.pixelRatio, this.pixelRatio)
            .multiply(cameraTransform);
          const inverseCameraTransform = fullTransform.invert();
          if (inverseCameraTransform) {
            const worldCoords = inverseCameraTransform.transformPoint(ptcLastPointer.xc, ptcLastPointer.yc);
            
            // Test portals first for debug hover
            let hit: HitTestResult | null = null;
            for (let i = this.portalBlocks.length - 1; i >= 0; i--) {
              hit = HitTester.hitTest(this.portalBlocks[i].block, worldCoords.x, worldCoords.y, Matrix2D.identity());
              if (hit) break;
            }
            
            // Fall back to main scene
            if (!hit) {
              hit = HitTester.hitTest(block, worldCoords.x, worldCoords.y, Matrix2D.identity());
            }
            
            this.debugHoveredBlock = hit?.block || null;
          } else {
            // Matrix inversion failed, keep debugHoveredBlock as null
            this.debugHoveredBlock = null;
          }
        } else {
          // No camera controls, but still account for pixelRatio
          const pixelRatioTransform = Matrix2D.identity()
            .scaleXY(this.pixelRatio, this.pixelRatio);
          const inverseTransform = pixelRatioTransform.invert();
          if (inverseTransform) {
            const worldCoords = inverseTransform.transformPoint(ptcLastPointer.xc, ptcLastPointer.yc);
            
            // Test portals first for debug hover
            let hit: HitTestResult | null = null;
            for (let i = this.portalBlocks.length - 1; i >= 0; i--) {
              hit = HitTester.hitTest(this.portalBlocks[i].block, worldCoords.x, worldCoords.y, Matrix2D.identity());
              if (hit) break;
            }
            
            // Fall back to main scene
            if (!hit) {
              hit = HitTester.hitTest(block, worldCoords.x, worldCoords.y, Matrix2D.identity());
            }
            
            this.debugHoveredBlock = hit?.block || null;
          }
        }
      }
    }
    
    PerformanceOptimizer.resetStats();
    this.context.clear();
    this.context.save();

    // Apply camera transform (pan and zoom) to root transform stack
    // Note: Scale first, then translate (for correct camera behavior)
    if (this.enableCameraControls) {
      this.context.transformStack.apply({
        scaleX: this.cameraZoom,
        scaleY: this.cameraZoom
      });
      this.context.transformStack.apply({
        x: this.cameraX,
        y: this.cameraY
      });
    }
    
    this.renderBlock(block);
    this.context.restore();
    
    // Render portals on top
    this.renderPortals();

    // Update event system with current scene and camera transform
    if (this.eventManager) {
      this.eventManager.setScene(block);
      
      // Pass portal blocks to event manager for layer-aware hit testing
      const portalContainers = this.portalBlocks.map(p => p.block);
      this.eventManager.setPortalBlocks(portalContainers);
      
      if (this.enableCameraControls) {
        // Camera transform: scale first, then translate
        // For hit testing, we need the full transform from canvas buffer to world:
        // CanvasBuffer → Logical Canvas → World
        // The camera transform is in logical space, so we need to account for pixelRatio
        const cameraTransform = Matrix2D.identity()
          .scaleXY(this.cameraZoom, this.cameraZoom)
          .translate(this.cameraX, this.cameraY);
        
        // Full transform: Scale(pixelRatio) * Camera
        const fullTransform = Matrix2D.identity()
          .scaleXY(this.pixelRatio, this.pixelRatio)
          .multiply(cameraTransform);
        
        this.eventManager.setCameraTransform(fullTransform);
      } else if (this.pixelRatio !== 1) {
        // No camera controls, but still need to account for pixelRatio
        const pixelRatioTransform = Matrix2D.identity()
          .scaleXY(this.pixelRatio, this.pixelRatio);
        this.eventManager.setCameraTransform(pixelRatioTransform);
      }
    }

    // Update performance stats
    PerformanceOptimizer.stats.renderTime = performance.now() - startTime;
    this.perfMonitor.update();
  }

  getPerformanceStats() {
    return this.perfMonitor.getStats();
  }

  destroy(): void {
    if (this.eventManager) {
      this.eventManager.destroy();
    }
  }

  private renderBlock(block: Block): void {
    const { props, children } = block;
    const { visible, opacity: fOpacity = 1, shadow } = props;
    if (visible === false) return;

    // Frustum culling
    if (this.enableCulling) {
      const inView = PerformanceOptimizer.cullBlocks(
        block,
        this.viewport,
        this.context.transformStack.getCurrent()
      );
      if (!inView) {
        PerformanceOptimizer.stats.blocksCulled++;
        return;
      }
    }

    PerformanceOptimizer.stats.blocksRendered++;

    this.context.save();
    
    // Apply transform
    this.context.transformStack.save();
    this.context.transformStack.apply(props);
    const worldTransform = this.context.transformStack.getCurrent();
    if (this.pixelRatio !== 1) {
      const renderTransform = Matrix2D.identity()
        .scaleXY(this.pixelRatio, this.pixelRatio)
        .multiply(worldTransform);
      this.context.applyTransform(renderTransform);
    } else {
      this.context.applyTransform(worldTransform);
    }

    // Apply opacity
    const parentOpacity = this.context.opacity;
    this.context.setOpacity(parentOpacity * fOpacity);

    // Apply shadow if present
    if (shadow) {
      const { offsetX, offsetY, blur, color } = shadow;
      const ctx = (this.context as any).ctx;
      if (ctx) {
        ctx.shadowOffsetX = offsetX;
        ctx.shadowOffsetY = offsetY;
        ctx.shadowBlur = blur;
        ctx.shadowColor = color;
      }
    }

    // Render based on block type
    switch (block.type) {
      case BlockType.Rectangle:
        this.renderRectangle(block);
        break;
      case BlockType.Circle:
        this.renderCircle(block);
        break;
      case BlockType.Ellipse:
        this.renderEllipse(block);
        break;
      case BlockType.Path:
        this.renderPath(block);
        break;
      case BlockType.Line:
        this.renderLine(block);
        break;
      case BlockType.Text:
        this.renderText(block);
        break;
      case BlockType.Image:
        this.renderImage(block);
        break;
      case BlockType.Arc:
        this.renderArc(block);
        break;
      case BlockType.Portal:
        // Collect portal instead of rendering inline
        this.portalBlocks.push({
          block,
          transform: worldTransform.clone()
        });
        // Don't render children here - they'll be rendered in portal pass
        this.context.transformStack.restore();
        this.context.restore();
        return;
      case BlockType.Group:
      case BlockType.Layer:
        // Container blocks - just render children
        break;
    }

    // Render children if any
    if (children) {
      for (const child of children) {
        this.renderBlock(child);
      }
    }

    if (this.debugHoverOutline && block === this.debugHoveredBlock) {
      this.renderDebugHoverOutline(block);
    }

    this.context.transformStack.restore();
    this.context.restore();
  }

  private renderDebugHoverOutline(block: Block): void {
    const propsOutline = {
      fill: 'transparent',
      stroke: '#ff00ff',
      strokeWidth: 2
    };

    switch (block.type) {
      case BlockType.Rectangle: {
        const { dx, dy } = block.props;
        this.context.drawRectangle(0, 0, dx, dy, propsOutline);
        return;
      }
      case BlockType.Circle: {
        const { radius } = block.props;
        this.context.drawCircle(0, 0, radius, propsOutline);
        return;
      }
      case BlockType.Ellipse: {
        const { radiusX, radiusY } = block.props;
        this.context.drawEllipse(0, 0, radiusX, radiusY, propsOutline);
        return;
      }
      case BlockType.Line: {
        const { x1, y1, x2, y2 } = block.props;
        this.context.drawLine(x1, y1, x2, y2, { stroke: '#ff00ff', strokeWidth: 3 });
        return;
      }
      case BlockType.Text: {
        const { text, fontSize, align, baseline } = block.props;
        
        // Get actual text metrics
        if (this.context.measureText) {
          const metrics = this.context.measureText(text, block.props);
          const { width, ascent, descent } = metrics;
          const height = ascent + descent;
          
          // Calculate x offset based on alignment
          let xOffset = 0;
          if (align === 'center') {
            xOffset = -width / 2;
          } else if (align === 'right' || align === 'end') {
            xOffset = -width;
          }
          
          // Calculate y offset based on baseline
          let yOffset = -ascent; // Default for 'alphabetic' baseline
          if (baseline === 'top' || baseline === 'hanging') {
            yOffset = 0;
          } else if (baseline === 'middle') {
            yOffset = -height / 2;
          } else if (baseline === 'bottom') {
            yOffset = -height;
          }
          
          this.context.drawRectangle(xOffset, yOffset, width, height, propsOutline);
        } else {
          // Fallback to approximation if measureText not available
          const duFont = fontSize ?? 16;
          const textWidth = text.length * duFont * 0.6;
          this.context.drawRectangle(0, 0, textWidth, duFont, propsOutline);
        }
        return;
      }
      case BlockType.Image: {
        const { dx, dy } = block.props;
        this.context.drawRectangle(0, 0, dx, dy, propsOutline);
        return;
      }
      case BlockType.Arc: {
        const { radius, startAngle, endAngle } = block.props;
        this.context.drawArc(0, 0, radius, startAngle, endAngle, { stroke: '#ff00ff', strokeWidth: 3 });
        return;
      }
      case BlockType.Path: {
        const { pathData } = block.props;
        this.context.drawPath(pathData, propsOutline);
        return;
      }
      case BlockType.Group:
      case BlockType.Layer:
      default:
        return;
    }
  }

  private renderRectangle(block: BlockOfType<BlockType.Rectangle>): void {
    const { props } = block;
    const { dx, dy } = props;
    this.context.drawRectangle(0, 0, dx, dy, props);
  }

  private renderCircle(block: BlockOfType<BlockType.Circle>): void {
    const { props } = block;
    const { radius } = props;
    this.context.drawCircle(0, 0, radius, props);
  }

  private renderEllipse(block: BlockOfType<BlockType.Ellipse>): void {
    const { props } = block;
    const { radiusX, radiusY } = props;
    this.context.drawEllipse(0, 0, radiusX, radiusY, props);
  }

  private renderPath(block: BlockOfType<BlockType.Path>): void {
    const { props } = block;
    const { pathData } = props;
    this.context.drawPath(pathData, props);
  }

  private renderLine(block: BlockOfType<BlockType.Line>): void {
    const { props } = block;
    const { x1, y1, x2, y2 } = props;
    this.context.drawLine(x1, y1, x2, y2, props);
  }

  private renderText(block: BlockOfType<BlockType.Text>): void {
    const { props } = block;
    const { text } = props;
    this.context.drawText(text, 0, 0, props);
  }

  private renderImage(block: BlockOfType<BlockType.Image>): void {
    const { props } = block;
    const { src, dx, dy } = props;
    const img = typeof src === 'string' ? new Image() : src;
    if (typeof src === 'string' && img instanceof HTMLImageElement) {
      img.src = src;
    }
    this.context.drawImage(img as HTMLImageElement, 0, 0, dx, dy, props);
  }

  private renderArc(block: BlockOfType<BlockType.Arc>): void {
    const { props } = block;
    const { radius, startAngle, endAngle } = props;
    this.context.drawArc(0, 0, radius, startAngle, endAngle, props);
  }

  private renderPortals(): void {
    if (this.portalBlocks.length === 0) return;

    // Render portals in collection order (first collected = bottom, last = top)
    for (const { block, transform } of this.portalBlocks) {
      if (!block.children) continue;
      
      this.context.save();
      this.context.transformStack.save();
      
      // The stored transform already includes:
      // - Camera transform (if enabled)
      // - All parent transforms up to the portal
      // - The portal's own transform (x, y, etc.)
      // We need to set this as the current transform for rendering children
      
      // Directly set the transform stack's current to the stored transform
      (this.context.transformStack as any).current = transform.clone();
      
      // Apply to canvas context (with pixelRatio)
      if (this.pixelRatio !== 1) {
        const renderTransform = Matrix2D.identity()
          .scaleXY(this.pixelRatio, this.pixelRatio)
          .multiply(transform);
        this.context.applyTransform(renderTransform);
      } else {
        this.context.applyTransform(transform);
      }
      
      // Now render portal children - they will apply their own transforms relative to this
      for (const child of block.children) {
        this.renderBlock(child);
      }
      
      this.context.transformStack.restore();
      this.context.restore();
    }
  }
}
