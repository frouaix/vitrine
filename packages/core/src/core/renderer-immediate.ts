// Copyright (c) 2026 François Rouaix

// Immediate-mode rendering engine
import type { Block, BlockOfType } from './types.ts';
import { BlockType } from './types.ts';
import type { RenderContext } from './context.ts';
import { Canvas2DContext } from './context.ts';
import { EventManager } from '../events.ts';
import { PerformanceOptimizer, PerformanceMonitor, type Viewport } from '../performance.ts';
import { HitTester, type HitTestLayoutCache, type HitTestResult } from '../hit-test.ts';
import { Matrix2D } from '../transform.ts';
import { getTextBlockBounds } from './text-layout.ts';
import { group, rectangle, text, portal } from './blocks.ts';
import { getBlockTypeHandlers } from './block-registry.ts';

const TOOLTIP_DEFAULTS = {
  colBg: '#1f2937',
  colBorder: '#4b5563',
  colText: '#f9fafb',
  borderWidth: 1,
  borderRadius: 6,
  duPadding: 8,
  duPaddingX: 10,
  fontSize: 13,
  fontFamily: 'system-ui, sans-serif',
  duOffsetY: 16,
  duMaxDistance: 120,
  duMaxWidth: 300
} as const;

export interface RendererConfig {
  canvas?: HTMLCanvasElement;
  dx?: number;
  dy?: number;
  pixelRatio?: number;
  fEnableEvents?: boolean;
  fEnableCulling?: boolean;
  fDebugHoverOutline?: boolean;
  fEnableCameraControls?: boolean;
}

export class ImmediateRenderer {
  private canvas: HTMLCanvasElement;
  private dxc: number;
  private dyc: number;
  private pixelRatio: number;
  private fEnableCulling: boolean;
  private fDebugHoverOutline: boolean;
  private fEnableCameraControls: boolean;

  private context: RenderContext;
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private eventManager: EventManager | null = null;
  private debugHoveredBlock: Block | null = null;
  private viewport: Viewport;
  private perfMonitor: PerformanceMonitor;
  private xsCamera: number = 0;
  private ysCamera: number = 0;
  private sfCamera: number = 1;
  private portalBlocks: Array<{ block: Block; transform: Matrix2D }> = [];
  private hitTestLayoutCache: HitTestLayoutCache = { mpbl_rc: new WeakMap() };

  constructor(config: RendererConfig = {}) {
    this.canvas = config.canvas || document.createElement('canvas');
    this.dxc = config.dx || 800;
    this.dyc = config.dy || 600;
    this.pixelRatio = config.pixelRatio || window.devicePixelRatio || 1;
    this.fEnableCulling = config.fEnableCulling ?? true;
    this.fDebugHoverOutline = config.fDebugHoverOutline ?? false;
    this.fEnableCameraControls = config.fEnableCameraControls ?? false;

    this.viewport = {
      x: 0,
      y: 0,
      width: this.dxc,
      height: this.dyc
    };

    this.setupCanvas();
    
    const ctx = this.canvas.getContext('2d', {
      alpha: true,
      willReadFrequently: false
    });
    if (!ctx) throw new Error('Failed to get 2D context');
    this.context = new Canvas2DContext(ctx);

    // Enable event handling by default
    if (config.fEnableEvents !== false) {
      this.eventManager = new EventManager(this.canvas);
      this.eventManager.setPixelRatio(this.pixelRatio);
      
      // Setup camera controls if enabled
      if (this.fEnableCameraControls) {
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
    this.fDebugHoverOutline = enabled;
  }

  getDebugHoverOutline(): boolean {
    return this.fDebugHoverOutline;
  }

  private setupCameraControls(): void {
    const handleWheel = (e: WheelEvent): void => {
      e.preventDefault();
      
      const zoomSpeed = 0.001;
      const panSpeed = 1;
      
      if (e.ctrlKey) {
        // Ctrl+MouseWheel: zoom in/out towards mouse pointer
        const zoomDelta = -e.deltaY * zoomSpeed;
        const newZoom = Math.max(0.1, Math.min(10, this.sfCamera + zoomDelta));
        
        // Convert mouse position from CSS pixels to logical canvas coordinates
        const rect = this.canvas.getBoundingClientRect();
        const cssX = e.clientX - rect.left;
        const cssY = e.clientY - rect.top;
        const bufferX = cssX * (this.canvas.width / rect.width);
        const bufferY = cssY * (this.canvas.height / rect.height);
        const logicalX = bufferX / this.pixelRatio;
        const logicalY = bufferY / this.pixelRatio;
        
        // Camera group uses Translate × Scale convention:
        // screen = world * zoom + translate
        // world = (screen - translate) / zoom
        const worldX = (logicalX - this.xsCamera) / this.sfCamera;
        const worldY = (logicalY - this.ysCamera) / this.sfCamera;
        
        // Keep world point under mouse after zoom change:
        // logicalX = worldX * newZoom + newTranslateX
        // newTranslateX = logicalX - worldX * newZoom
        this.xsCamera = logicalX - worldX * newZoom;
        this.ysCamera = logicalY - worldY * newZoom;
        this.sfCamera = newZoom;
      } else if (e.shiftKey) {
        // Shift+MouseWheel: scroll horizontally (translate is in screen units)
        this.xsCamera -= e.deltaY * panSpeed;
      } else {
        // MouseWheel: scroll vertically (translate is in screen units)
        this.ysCamera -= e.deltaY * panSpeed;
      }
    };
    
    this.canvas.addEventListener('wheel', handleWheel, { passive: false });
  }

  getCameraTransform(): { x: number; y: number; zoom: number } {
    return {
      x: this.xsCamera,
      y: this.ysCamera,
      zoom: this.sfCamera
    };
  }

  setCameraTransform(x: number, y: number, zoom: number): void {
    this.xsCamera = x;
    this.ysCamera = y;
    this.sfCamera = zoom;
  }

  /**
   * Creates a camera group block from internal camera state and syncs the
   * transform to the EventManager. Wrap your scene children with this method
   * so that camera controls (pan/zoom) are applied as a regular group transform.
   */
  camera(children: Block[]): Block {
    // Build the camera transform matrix (Translate × Scale) and sync to EventManager
    const cameraTransform = Matrix2D.identity()
      .translate(this.xsCamera, this.ysCamera)
      .scaleXY(this.sfCamera, this.sfCamera);
    const fullTransform = Matrix2D.identity()
      .scaleXY(this.pixelRatio, this.pixelRatio)
      .multiply(cameraTransform);
    if (this.eventManager) {
      this.eventManager.setCameraTransform(fullTransform);
    }

    return group({
      x: this.xsCamera,
      y: this.ysCamera,
      scaleX: this.sfCamera,
      scaleY: this.sfCamera
    }, children);
  }

  render(block: Block): void {
    const startTime = performance.now();

    // Layout cache is valid for exactly one rendered frame.
    this.hitTestLayoutCache = { mpbl_rc: new WeakMap() };

    // Clear portal collection
    this.portalBlocks = [];

    this.debugHoveredBlock = null;
    if (this.fDebugHoverOutline && this.eventManager) {
      const ptcLastPointer = this.eventManager.getLastPointerCanvasPosition();
      if (ptcLastPointer) {
        // Convert canvas buffer coordinates to logical coordinates (remove pixelRatio).
        // The camera transform is now part of the scene tree (camera group),
        // so the hit tester handles it during recursive traversal.
        const logicalX = ptcLastPointer.xc / this.pixelRatio;
        const logicalY = ptcLastPointer.yc / this.pixelRatio;
        
        // Test portals first for debug hover
        let hit: HitTestResult | null = null;
        for (let i = this.portalBlocks.length - 1; i >= 0; i--) {
          hit = HitTester.hitTest(this.portalBlocks[i].block, logicalX, logicalY, Matrix2D.identity(), [], this.hitTestLayoutCache);
          if (hit) break;
        }
        
        // Fall back to main scene
        if (!hit) {
          hit = HitTester.hitTest(block, logicalX, logicalY, Matrix2D.identity(), [], this.hitTestLayoutCache);
        }
        
        this.debugHoveredBlock = hit?.block || null;
      }
    }
    
    PerformanceOptimizer.resetStats();
    this.context.clear();
    this.context.save();

    // Camera transform is now applied via the camera group block in the scene tree.
    // No special camera transform application here.
    
    this.renderBlock(block);
    this.context.restore();
    
    // Render portals on top
    this.renderPortals();

    // Render tooltip on top of everything
    this.renderTooltip();

    // Update event system with current scene
    if (this.eventManager) {
      this.eventManager.setScene(block);
      
      // Pass portal blocks to event manager for layer-aware hit testing
      const portalContainers = this.portalBlocks.map(p => p.block);
      this.eventManager.setPortalBlocks(portalContainers);
      this.eventManager.setHitTestLayoutCache(this.hitTestLayoutCache);
      
      // Camera transform is synced to EventManager via camera() method.
      // For non-camera scenes, still account for pixelRatio.
      if (!this.fEnableCameraControls && this.pixelRatio !== 1) {
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

    this.imageCache.clear();
  }

  private renderBlock(block: Block): void {
    const { props, rgblChildren: children } = block;
    const { fVisible: visible, opacity: fOpacity = 1, shadow } = props;
    if (visible === false) return;

    // Frustum culling
    if (this.fEnableCulling) {
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

    // Apply CSS filter if present
    const { filter } = props as any;
    if (filter) {
      const ctx = (this.context as any).ctx;
      if (ctx) {
        ctx.filter = filter;
      }
    }

    const blockCustom = block as unknown as { type: string; props: Record<string, unknown>; children?: Block[] };

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
      case BlockType.ContentSized:
        this.renderContentSized(block as BlockOfType<BlockType.ContentSized>);
        this.context.transformStack.restore();
        this.context.restore();
        return;
      case BlockType.Group:
      case BlockType.Layer: {
        // Apply blend mode for Layer blocks
        if (block.type === BlockType.Layer) {
          const { blendMode } = props as any;
          if (blendMode) {
            const ctx = (this.context as any).ctx as CanvasRenderingContext2D;
            if (ctx) {
              ctx.globalCompositeOperation = blendMode;
            }
          }
        }

        // Apply clipping if clip is set with dimensions
        const { clip, dx: dxClip, dy: dyClip } = props as any;
        if (clip && dxClip !== undefined && dyClip !== undefined) {
          const ctx = (this.context as any).ctx as CanvasRenderingContext2D;
          if (ctx) {
            ctx.beginPath();
            ctx.rect(0, 0, dxClip, dyClip);
            ctx.clip();
          }
        }
        break;
      }
      default: {
        const handlers = getBlockTypeHandlers(blockCustom.type);
        handlers?.render?.(blockCustom, {
          context: this.context,
          layoutCache: this.hitTestLayoutCache,
          setLayoutBounds: (bounds) => {
            this.hitTestLayoutCache.mpbl_rc.set(block, bounds);
          }
        });
        break;
      }
    }

    // Render children if any
    if (children) {
      for (const child of children) {
        this.renderBlock(child);
      }
    }

    if (this.fDebugHoverOutline && block === this.debugHoveredBlock) {
      this.renderDebugHoverOutline(block);
    }

    this.context.transformStack.restore();
    this.context.restore();
  }

  private getLocalTransformFromProps(props: any): Matrix2D {
    let transform = Matrix2D.identity();
    const { x, y, rotation, scaleX, scaleY, skewX, skewY } = props;

    if (x !== undefined || y !== undefined) {
      transform = transform.translate(x ?? 0, y ?? 0);
    }
    if (rotation !== undefined) {
      transform = transform.rotate(rotation);
    }
    if (scaleX !== undefined || scaleY !== undefined) {
      transform = transform.scaleXY(scaleX ?? 1, scaleY ?? 1);
    }
    if (skewX !== undefined || skewY !== undefined) {
      transform = transform.skewXY(skewX ?? 0, skewY ?? 0);
    }

    return transform;
  }

  private transformBounds(bounds: { x: number; y: number; width: number; height: number }, transform: Matrix2D): { x: number; y: number; width: number; height: number } {
    const corners = [
      transform.transformPoint(bounds.x, bounds.y),
      transform.transformPoint(bounds.x + bounds.width, bounds.y),
      transform.transformPoint(bounds.x, bounds.y + bounds.height),
      transform.transformPoint(bounds.x + bounds.width, bounds.y + bounds.height)
    ];

    const xMin = Math.min(...corners.map((c) => c.x));
    const xMax = Math.max(...corners.map((c) => c.x));
    const yMin = Math.min(...corners.map((c) => c.y));
    const yMax = Math.max(...corners.map((c) => c.y));

    return {
      x: xMin,
      y: yMin,
      width: xMax - xMin,
      height: yMax - yMin
    };
  }

  private renderContentSized(block: BlockOfType<BlockType.ContentSized>): void {
    const { props, rgblChildren: children } = block;
    if (!children || children.length === 0) {
      return;
    }

    for (const child of children) {
      this.renderBlock(child);
    }

    const localBoundsChildren = children
      .map((child) => {
        const childBoundsLocal = this.hitTestLayoutCache.mpbl_rc.get(child);
        if (!childBoundsLocal) {
          return null;
        }
        const childTransform = this.getLocalTransformFromProps(child.props);
        return this.transformBounds(childBoundsLocal, childTransform);
      })
      .filter((bounds): bounds is { x: number; y: number; width: number; height: number } => bounds !== null);

    if (localBoundsChildren.length === 0) {
      return;
    }

    const xMin = Math.min(...localBoundsChildren.map((b) => b.x));
    const yMin = Math.min(...localBoundsChildren.map((b) => b.y));
    const xMax = Math.max(...localBoundsChildren.map((b) => b.x + b.width));
    const yMax = Math.max(...localBoundsChildren.map((b) => b.y + b.height));

    const padding = props.padding ?? 0;
    const paddingX = props.paddingX ?? padding;
    const paddingY = props.paddingY ?? padding;

    const bounds = {
      x: xMin - paddingX,
      y: yMin - paddingY,
      width: xMax - xMin + paddingX * 2,
      height: yMax - yMin + paddingY * 2
    };

    this.hitTestLayoutCache.mpbl_rc.set(block, bounds);

    if (props.fill || props.stroke) {
      this.context.drawRectangle(bounds.x, bounds.y, bounds.width, bounds.height, {
        fill: props.fill,
        stroke: props.stroke,
        strokeWidth: props.strokeWidth,
        lineCap: props.lineCap,
        lineJoin: props.lineJoin,
        lineDash: props.lineDash,
        lineDashOffset: props.lineDashOffset,
        cornerRadius: props.cornerRadius
      });
    }
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
        const bounds = getTextBlockBounds(text, { ...block.props, align, baseline, fontSize }, this.context);
        this.context.drawRectangle(bounds.x, bounds.y, bounds.width, bounds.height, propsOutline);
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
      case BlockType.Portal:
      default:
        {
          const blockCustom = block as unknown as { type: string; props: Record<string, unknown>; children?: Block[] };
          const handlers = getBlockTypeHandlers(blockCustom.type);
          const bounds = handlers?.getDebugOutlineBounds?.(blockCustom, { context: this.context });
          if (bounds) {
            this.context.drawRectangle(bounds.x, bounds.y, bounds.width, bounds.height, propsOutline);
          }
        }
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
    const bounds = getTextBlockBounds(text, props, this.context);
    this.hitTestLayoutCache.mpbl_rc.set(block, bounds);

    this.context.drawText(text, 0, 0, props);
  }

  private renderImage(block: BlockOfType<BlockType.Image>): void {
    const { props } = block;
    const { src, dx, dy } = props;
    const img = typeof src === 'string' ? this.getCachedImage(src) : src;

    if (!img.complete || img.naturalWidth === 0) {
      return;
    }

    this.context.drawImage(img as HTMLImageElement, 0, 0, dx, dy, props);
  }

  private getCachedImage(src: string): HTMLImageElement {
    const cached = this.imageCache.get(src);
    if (cached) {
      return cached;
    }

    const img = new Image();
    img.src = src;
    this.imageCache.set(src, img);
    return img;
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
      if (!block.rgblChildren) continue;
      
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
      for (const child of block.rgblChildren) {
        this.renderBlock(child);
      }
      
      this.context.transformStack.restore();
      this.context.restore();
    }
  }

  private renderTooltip(): void {
    if (!this.eventManager) return;
    const activeTooltip = this.eventManager.getActiveTooltip();
    if (!activeTooltip) return;

    const content = activeTooltip.fn();
    if (!content) return;

    const { xs, ys } = activeTooltip;
    const { duPadding, duPaddingX, fontSize, fontFamily, colBg, colBorder, colText,
            borderWidth, borderRadius, duOffsetY, duMaxDistance, duMaxWidth } = TOOLTIP_DEFAULTS;

    // Normalize: convert string content to a text block
    const lineHeight = fontSize * 1.4;
    let contentBlock: Block;
    let dxContent: number;
    let dyContent: number;

    if (typeof content === 'string') {
      const lines = content.split('\n');
      const textProps = { fontSize, font: `${fontSize}px ${fontFamily}` };

      // Measure each line using the canvas context for exact widths
      const lineWidths = lines.map(line =>
        this.context.measureText
          ? this.context.measureText(line, textProps).width
          : line.length * fontSize * 0.6
      );
      dxContent = Math.min(
        duMaxWidth - duPaddingX * 2,
        Math.max(...lineWidths)
      );
      dyContent = lines.length * lineHeight;

      contentBlock = group({}, lines.map((line, i) =>
        text({
          text: line,
          y: i * lineHeight,
          fill: colText,
          fontSize,
          font: `${fontSize}px ${fontFamily}`,
          baseline: 'top' as const
        })
      ));
    } else {
      contentBlock = content;
      // Estimate block content size via bounding box or fallback
      const bounds = HitTester.getBounds(content);
      dxContent = bounds ? bounds.width : duMaxWidth - duPaddingX * 2;
      dyContent = bounds ? bounds.height : 40;
    }

    // Compute tooltip frame dimensions
    const dxTooltip = dxContent + duPaddingX * 2;
    const dyTooltip = dyContent + duPadding * 2;

    // Position: centered horizontally on pointer, below pointer
    let xTooltip = xs - dxTooltip / 2;
    let yTooltip = ys + duOffsetY;

    // Clamp horizontally
    xTooltip = Math.max(4, Math.min(this.dxc - dxTooltip - 4, xTooltip));

    // Flip above pointer if it would go below canvas
    if (yTooltip + dyTooltip > this.dyc - 4) {
      yTooltip = ys - dyTooltip - duOffsetY;
    }

    // Enforce max distance from pointer
    const dyCenterToPointer = Math.abs((yTooltip + dyTooltip / 2) - ys);
    if (dyCenterToPointer > duMaxDistance) {
      yTooltip = ys > yTooltip
        ? ys - duMaxDistance - dyTooltip / 2
        : ys + duMaxDistance - dyTooltip / 2;
    }

    // Clamp vertically
    yTooltip = Math.max(4, Math.min(this.dyc - dyTooltip - 4, yTooltip));

    const tooltipBlock = group({ x: xTooltip, y: yTooltip }, [
      rectangle({
        dx: dxTooltip,
        dy: dyTooltip,
        fill: colBg,
        stroke: colBorder,
        strokeWidth: borderWidth,
        cornerRadius: borderRadius,
        opacity: 0.95
      }),
      group({ x: duPaddingX, y: duPadding }, [contentBlock])
    ]);

    // Render tooltip as overlay (identity transform + pixelRatio)
    this.context.save();
    this.context.transformStack.save();
    (this.context.transformStack as any).current = Matrix2D.identity();

    if (this.pixelRatio !== 1) {
      this.context.applyTransform(Matrix2D.identity().scaleXY(this.pixelRatio, this.pixelRatio));
    } else {
      this.context.applyTransform(Matrix2D.identity());
    }

    this.renderBlock(tooltipBlock);

    this.context.transformStack.restore();
    this.context.restore();
  }
}
