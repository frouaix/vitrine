// Copyright (c) 2026 François Rouaix

// Immediate-mode rendering engine
import type { Block, BlockOfType, Rc } from './types.ts';
import { BlockType } from './types.ts';
import type { RenderContext } from './context.ts';
import { Canvas2DContext } from './context.ts';
import { EventManager } from '../events.ts';
import { PerformanceOptimizer, PerformanceMonitor, type Viewport } from '../performance.ts';
import { HitTester, type HitTestLayoutCache, type HitTestResult } from '../hit-test.ts';
import { Matrix2D, transformRc } from '../transform.ts';
import { getBlockBounds, getBlockTransform } from './bounds.ts';
import { getTextBlockRc } from './text-layout.ts';
import { group, rectangle, text, portal } from './blocks.ts';
import { getBlockTypeHandlers, type CustomBlockDescriptor } from './block-registry.ts';

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

const PROPS_OUTLINE_DEBUG_HOVER = {
  fill: 'transparent',
  stroke: '#ff00ff',
  strokeWidth: 2
} as const;

type ClipRectProps = {
  clip?: boolean;
  dx?: number;
  dy?: number;
};

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
  camera(rgbl: Block[]): Block {
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
    }, rgbl);
  }

  render(bl: Block): void {
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
          hit = HitTester.hitTest(bl, logicalX, logicalY, Matrix2D.identity(), [], this.hitTestLayoutCache);
        }
        
        this.debugHoveredBlock = hit?.block || null;
      }
    }
    
    PerformanceOptimizer.resetStats();
    this.context.clear();
    this.context.save();

    // Camera transform is now applied via the camera group block in the scene tree.
    // No special camera transform application here.
    
    this.renderBlock(bl);
    this.context.restore();
    
    // Render portals on top
    this.renderPortals();

    // Render tooltip on top of everything
    this.renderTooltip();

    // Update event system with current scene
    if (this.eventManager) {
      this.eventManager.setScene(bl);
      
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

  private renderBlock(bl: Block): void {
    const { props, rgblChildren } = bl;
    const { fVisible, opacity = 1, shadow } = props;
    if (fVisible === false) return;

    // Frustum culling
    if (this.fEnableCulling) {
      const inView = PerformanceOptimizer.cullBlocks(
        bl,
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
    const xfWorld = this.context.transformStack.getCurrent();
    if (this.pixelRatio !== 1) {
      const xfRender = Matrix2D.identity()
        .scaleXY(this.pixelRatio, this.pixelRatio)
        .multiply(xfWorld);
      this.context.applyTransform(xfRender);
    } else {
      this.context.applyTransform(xfWorld);
    }

    // Apply opacity
    const opacityParent = this.context.opacity;
    this.context.setOpacity(opacityParent * opacity);

    // Apply shadow if present
    this.context.setShadow(shadow ?? null);

    // Apply CSS filter if present
    this.context.setFilter(props.filter);


    // Render based on block type
    switch (bl.type) {
      case BlockType.Rectangle:
        this.renderRectangle(bl);
        break;
      case BlockType.Circle:
        this.renderCircle(bl);
        break;
      case BlockType.Ellipse:
        this.renderEllipse(bl);
        break;
      case BlockType.Path:
        this.renderPath(bl);
        break;
      case BlockType.Line:
        this.renderLine(bl);
        break;
      case BlockType.Text:
        this.renderText(bl);
        break;
      case BlockType.Image:
        this.renderImage(bl);
        break;
      case BlockType.Arc:
        this.renderArc(bl);
        break;
      case BlockType.Portal:
        // Collect portal instead of rendering inline
        this.portalBlocks.push({
          block: bl,
          transform: xfWorld.clone()
        });
        // Don't render children here - they'll be rendered in portal pass
        this.context.transformStack.restore();
        this.context.restore();
        return;
      case BlockType.ContentSized:
        this.renderContentSized(bl as BlockOfType<BlockType.ContentSized>);
        this.context.transformStack.restore();
        this.context.restore();
        return;
      case BlockType.Group:
      case BlockType.Layer: {
        // Apply blend mode for Layer blocks
        if (bl.type === BlockType.Layer) {
          this.context.setBlendMode(bl.props.blendMode);
        }

        // Apply clipping if clip is set with dimensions
        const { clip, dx: dxClip, dy: dyClip } = props as ClipRectProps;
        if (clip && dxClip !== undefined && dyClip !== undefined) {
          this.context.clipRect(0, 0, dxClip, dyClip);
        }
        break;
      }
      default: {
        const blockCustom = bl as unknown as CustomBlockDescriptor;
        const handlers = getBlockTypeHandlers(blockCustom.type);
        handlers?.render?.(blockCustom, {
          context: this.context,
          layoutCache: this.hitTestLayoutCache,
          setLayoutBounds: (bounds) => {
            this.hitTestLayoutCache.mpbl_rc.set(bl, bounds);
          }
        });
        break;
      }
    }

    // Render children if any
    if (rgblChildren) {
      for (const blChild of rgblChildren) {
        this.renderBlock(blChild);
      }
    }

    if (this.fDebugHoverOutline && bl === this.debugHoveredBlock) {
      this.renderDebugHoverOutline(bl);
    }

    this.context.transformStack.restore();
    this.context.restore();
  }

  private renderContentSized(bl: BlockOfType<BlockType.ContentSized>): void {
    const { props, rgblChildren } = bl;
    if (!rgblChildren || rgblChildren.length === 0) {
      return;
    }

    for (const blChild of rgblChildren) {
      this.renderBlock(blChild);
    }

    const rgrclChildren = rgblChildren
      .map((blChild) => {
        const rclChild = this.hitTestLayoutCache.mpbl_rc.get(blChild);
        if (!rclChild) {
          return null;
        }
        const xfChild = getBlockTransform(blChild.props);
        return transformRc(rclChild, xfChild);
      })
      .filter((rc): rc is Rc => rc !== null);

    if (rgrclChildren.length === 0) {
      return;
    }

    const xMin = Math.min(...rgrclChildren.map((b) => b.x));
    const yMin = Math.min(...rgrclChildren.map((b) => b.y));
    const xMax = Math.max(...rgrclChildren.map((b) => b.x + b.width));
    const yMax = Math.max(...rgrclChildren.map((b) => b.y + b.height));

    const padding = props.padding ?? 0;
    const paddingX = props.paddingX ?? padding;
    const paddingY = props.paddingY ?? padding;

    const rc = {
      x: xMin - paddingX,
      y: yMin - paddingY,
      width: xMax - xMin + paddingX * 2,
      height: yMax - yMin + paddingY * 2
    };

    this.hitTestLayoutCache.mpbl_rc.set(bl, rc);

    if (props.fill || props.stroke) {
      this.context.drawRectangle(rc.x, rc.y, rc.width, rc.height, props);
    }
  }
  
  private renderDebugHoverOutline(bl: Block): void {
    switch (bl.type) {
      case BlockType.Rectangle: {
        const { dx, dy } = bl.props;
        this.context.drawRectangle(0, 0, dx, dy, PROPS_OUTLINE_DEBUG_HOVER);
        return;
      }
      case BlockType.Circle: {
        const { radius } = bl.props;
        this.context.drawCircle(0, 0, radius, PROPS_OUTLINE_DEBUG_HOVER);
        return;
      }
      case BlockType.Ellipse: {
        const { radiusX, radiusY } = bl.props;
        this.context.drawEllipse(0, 0, radiusX, radiusY, PROPS_OUTLINE_DEBUG_HOVER);
        return;
      }
      case BlockType.Line: {
        const { x1, y1, x2, y2 } = bl.props;
        this.context.drawLine(x1, y1, x2, y2, { stroke: PROPS_OUTLINE_DEBUG_HOVER.stroke, strokeWidth: PROPS_OUTLINE_DEBUG_HOVER.strokeWidth });
        return;
      }
      case BlockType.Text: {
        const { text, fontSize, align, baseline } = bl.props;
        const rc = getTextBlockRc(text, { ...bl.props, align, baseline, fontSize }, this.context);
        this.context.drawRectangle(rc.x, rc.y, rc.width, rc.height, PROPS_OUTLINE_DEBUG_HOVER);
        return;
      }
      case BlockType.Image: {
        const { dx, dy } = bl.props;
        this.context.drawRectangle(0, 0, dx, dy, PROPS_OUTLINE_DEBUG_HOVER);
        return;
      }
      case BlockType.Arc: {
        const { radius, startAngle, endAngle } = bl.props;
        this.context.drawArc(0, 0, radius, startAngle, endAngle, { stroke: PROPS_OUTLINE_DEBUG_HOVER.stroke, strokeWidth: PROPS_OUTLINE_DEBUG_HOVER.strokeWidth });
        return;
      }
      case BlockType.Path: {
        const { pathData } = bl.props;
        this.context.drawPath(pathData, PROPS_OUTLINE_DEBUG_HOVER);
        return;
      }
      case BlockType.Group:
      case BlockType.Layer:
      case BlockType.Portal:
      case BlockType.ContentSized: {
        const cachedRc = this.hitTestLayoutCache.mpbl_rc.get(bl);
        if (cachedRc) {
          this.context.drawRectangle(cachedRc.x, cachedRc.y, cachedRc.width, cachedRc.height, PROPS_OUTLINE_DEBUG_HOVER);
        }
        return;
      }
      default: {
        const blockCustom = bl as unknown as CustomBlockDescriptor;
        const handlers = getBlockTypeHandlers(blockCustom.type);
        const rc = handlers?.getDebugOutlineBounds?.(blockCustom, { context: this.context });
        if (rc) {
          this.context.drawRectangle(rc.x, rc.y, rc.width, rc.height, PROPS_OUTLINE_DEBUG_HOVER);
        }
      }
    }
  }

  private renderRectangle(bl: BlockOfType<BlockType.Rectangle>): void {
    const { props } = bl;
    const { dx, dy } = props;
    this.context.drawRectangle(0, 0, dx, dy, props);
  }

  private renderCircle(bl: BlockOfType<BlockType.Circle>): void {
    const { props } = bl;
    const { radius } = props;
    this.context.drawCircle(0, 0, radius, props);
  }

  private renderEllipse(bl: BlockOfType<BlockType.Ellipse>): void {
    const { props } = bl;
    const { radiusX, radiusY } = props;
    this.context.drawEllipse(0, 0, radiusX, radiusY, props);
  }

  private renderPath(bl: BlockOfType<BlockType.Path>): void {
    const { props } = bl;
    const { pathData } = props;
    this.context.drawPath(pathData, props);
  }

  private renderLine(bl: BlockOfType<BlockType.Line>): void {
    const { props } = bl;
    const { x1, y1, x2, y2 } = props;
    this.context.drawLine(x1, y1, x2, y2, props);
  }

  private renderText(bl: BlockOfType<BlockType.Text>): void {
    const { props } = bl;
    const { text } = props;
    const rc = getTextBlockRc(text, props, this.context);
    this.hitTestLayoutCache.mpbl_rc.set(bl, rc);

    this.context.drawText(text, 0, 0, props);
  }

  private renderImage(bl: BlockOfType<BlockType.Image>): void {
    const { props } = bl;
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

  private renderArc(bl: BlockOfType<BlockType.Arc>): void {
    const { props } = bl;
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
      this.context.transformStack.setCurrent(transform.clone());
      
      // Apply to canvas context (with pixelRatio)
      if (this.pixelRatio !== 1) {
        const xfRender = Matrix2D.identity()
          .scaleXY(this.pixelRatio, this.pixelRatio)
          .multiply(transform);
        this.context.applyTransform(xfRender);
      } else {
        this.context.applyTransform(transform);
      }
      
      // Now render portal children - they will apply their own transforms relative to this
      for (const blChild of block.rgblChildren) {
        this.renderBlock(blChild);
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

    let contentBlock: Block;
    let dxContent: number;
    let dyContent: number;
            
    if (typeof content === 'string') {
      // Normalize: convert string content to a text block
      const rgtextLines = content.split('\n');
      const textProps = {
        fill: colText,
        fontSize,
        font: `${fontSize}px ${fontFamily}`,
        baseline: 'top' as const
      };
      const rgrcLines = rgtextLines.map((line) => getTextBlockRc(line, textProps, this.context));
      let yCursor = 0;
      const rgblLines = rgtextLines.map((line, i) => {
        const rcLine = rgrcLines[i]!;
        const blLine = text({
          text: line,
          y: yCursor,
          ...textProps
        });
        yCursor += rcLine.height;
        return blLine;
      });

      dxContent = Math.min(
        duMaxWidth - duPaddingX * 2,
        Math.max(...rgrcLines.map((rcLine) => rcLine.width))
      );
      dyContent = yCursor;

      contentBlock = group({}, rgblLines);
    } else {
      contentBlock = content;
      // Estimate block content size via bounding box or fallback
      const rc = getBlockBounds(content);
      dxContent = rc ? rc.width : duMaxWidth - duPaddingX * 2;
      dyContent = rc ? rc.height : 40;
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
    this.context.transformStack.setCurrent(Matrix2D.identity());

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
