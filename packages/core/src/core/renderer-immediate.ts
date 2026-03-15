// Copyright (c) 2026 François Rouaix

// Immediate-mode rendering engine
import type { Block, BlockOfType } from './types.ts';
import { BlockType } from './types.ts';
import type { RenderContext } from './context.ts';
import { Canvas2DContext } from './context.ts';
import { getRgRenderBridgeRun } from 'texta/browser';
import { EventManager } from '../events.ts';
import { PerformanceOptimizer, PerformanceMonitor, type Viewport } from '../performance.ts';
import { HitTester, type HitTestLayoutCache, type HitTestResult } from '../hit-test.ts';
import { Matrix2D } from '../transform.ts';
import { group, rectangle, text, portal } from './blocks.ts';

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
  private hitTestLayoutCache: HitTestLayoutCache = { boundsByBlock: new WeakMap() };

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
      this.eventManager.setPixelRatio(this.pixelRatio);
      
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
        const bufferX = cssX * (this.canvas.width / rect.width);
        const bufferY = cssY * (this.canvas.height / rect.height);
        const logicalX = bufferX / this.pixelRatio;
        const logicalY = bufferY / this.pixelRatio;
        
        // Camera group uses Translate × Scale convention:
        // screen = world * zoom + translate
        // world = (screen - translate) / zoom
        const worldX = (logicalX - this.cameraX) / this.cameraZoom;
        const worldY = (logicalY - this.cameraY) / this.cameraZoom;
        
        // Keep world point under mouse after zoom change:
        // logicalX = worldX * newZoom + newTranslateX
        // newTranslateX = logicalX - worldX * newZoom
        this.cameraX = logicalX - worldX * newZoom;
        this.cameraY = logicalY - worldY * newZoom;
        this.cameraZoom = newZoom;
      } else if (e.shiftKey) {
        // Shift+MouseWheel: scroll horizontally (translate is in screen units)
        this.cameraX -= e.deltaY * panSpeed;
      } else {
        // MouseWheel: scroll vertically (translate is in screen units)
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

  /**
   * Creates a camera group block from internal camera state and syncs the
   * transform to the EventManager. Wrap your scene children with this method
   * so that camera controls (pan/zoom) are applied as a regular group transform.
   */
  camera(children: Block[]): Block {
    // Build the camera transform matrix (Translate × Scale) and sync to EventManager
    const cameraTransform = Matrix2D.identity()
      .translate(this.cameraX, this.cameraY)
      .scaleXY(this.cameraZoom, this.cameraZoom);
    const fullTransform = Matrix2D.identity()
      .scaleXY(this.pixelRatio, this.pixelRatio)
      .multiply(cameraTransform);
    if (this.eventManager) {
      this.eventManager.setCameraTransform(fullTransform);
    }

    return group({
      x: this.cameraX,
      y: this.cameraY,
      scaleX: this.cameraZoom,
      scaleY: this.cameraZoom
    }, children);
  }

  render(block: Block): void {
    const startTime = performance.now();

    // Layout cache is valid for exactly one rendered frame.
    this.hitTestLayoutCache = { boundsByBlock: new WeakMap() };

    // Clear portal collection
    this.portalBlocks = [];

    this.debugHoveredBlock = null;
    if (this.debugHoverOutline && this.eventManager) {
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
      if (!this.enableCameraControls && this.pixelRatio !== 1) {
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

    // Apply CSS filter if present
    const { filter } = props as any;
    if (filter) {
      const ctx = (this.context as any).ctx;
      if (ctx) {
        ctx.filter = filter;
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
      case BlockType.Texta:
        this.renderTexta(block);
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
    const { props, children } = block;
    if (!children || children.length === 0) {
      return;
    }

    for (const child of children) {
      this.renderBlock(child);
    }

    const localBoundsChildren = children
      .map((child) => {
        const childBoundsLocal = this.hitTestLayoutCache.boundsByBlock.get(child);
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

    this.hitTestLayoutCache.boundsByBlock.set(block, bounds);

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
      case BlockType.Texta: {
        const { texta: attributedText, fontSize, align, baseline } = block.props;
        const textValue = attributedText.strText;

        if (this.context.measureText) {
          const metrics = this.context.measureText(textValue, { fontSize });
          const { width, ascent, descent } = metrics;
          const height = ascent + descent;

          let xOffset = 0;
          if (align === 'center') {
            xOffset = -width / 2;
          } else if (align === 'right' || align === 'end') {
            xOffset = -width;
          }

          let yOffset = -ascent;
          if (baseline === 'top' || baseline === 'hanging') {
            yOffset = 0;
          } else if (baseline === 'middle') {
            yOffset = -height / 2;
          } else if (baseline === 'bottom') {
            yOffset = -height;
          }

          this.context.drawRectangle(xOffset, yOffset, width, height, propsOutline);
        } else {
          const duFont = fontSize ?? 16;
          const textWidth = textValue.length * duFont * 0.6;
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
      case BlockType.Portal:
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
    const { text, fontSize: duFont, align, baseline, dx: dxMax, lineHeight: lineHeightProp } = props;

    let textWidth: number;
    let textHeight: number;
    let ascent: number;

    if (this.context.measureText) {
      const metrics = this.context.measureText(text, props);
      textWidth = metrics.width;
      textHeight = metrics.height;
      ascent = metrics.ascent;
    } else {
      const fontSize = duFont ?? 16;
      const duLineHeight = lineHeightProp ?? fontSize * 1.4;
      if (dxMax !== undefined) {
        const singleLineWidth = text.length * fontSize * 0.6;
        const lineCount = Math.max(1, Math.ceil(singleLineWidth / dxMax));
        textWidth = Math.min(singleLineWidth, dxMax);
        textHeight = lineCount * duLineHeight;
      } else {
        textWidth = text.length * fontSize * 0.6;
        textHeight = fontSize;
      }
      ascent = fontSize;
    }

    let xOffset = 0;
    if (align === 'center') {
      xOffset = -textWidth / 2;
    } else if (align === 'right' || align === 'end') {
      xOffset = -textWidth;
    }

    let yOffset = -ascent;
    if (baseline === 'top' || baseline === 'hanging') {
      yOffset = 0;
    } else if (baseline === 'middle') {
      yOffset = -textHeight / 2;
    } else if (baseline === 'bottom') {
      yOffset = -textHeight;
    }

    this.hitTestLayoutCache.boundsByBlock.set(block, {
      x: xOffset,
      y: yOffset,
      width: textWidth,
      height: textHeight
    });

    this.context.drawText(text, 0, 0, props);
  }

  private renderTexta(block: BlockOfType<BlockType.Texta>): void {
    const { props } = block;
    const {
      texta: attributedText,
      align,
      baseline,
      fill: fillDefault,
      stroke: strokeDefault,
      strokeWidth: duStrokeWidthDefault,
      font: fontDefault,
      fontSize: duFontSizeDefault,
      lineHeight: duLineHeightDefault,
      dx: duDx
    } = props;

    const runs = getRgRenderBridgeRun(attributedText);
    if (runs.length === 0) return;

    type StyleEntryLike = {
      fontFamily?: string;
      fontSize?: number;
      fontWeight?: string;
      fontStyle?: string;
      lineHeight?: number;
      fill?: string;
      background?: string;
      stroke?: string;
      opacity?: number;
    };

    type Segment = {
      text: string;
      style: StyleEntryLike;
    };

    type SegmentMetrics = {
      text: string;
      style: StyleEntryLike;
      font: string | undefined;
      width: number;
      ascent: number;
      descent: number;
      fontSize: number;
      lineHeight: number;
    };

    const mpStyleById = attributedText.mpId_StyleEntry as Record<number, StyleEntryLike>;
    const styleDefault = mpStyleById[attributedText.idStyleDefault] ?? {};

    const getFontSize = (style: StyleEntryLike): number => {
      return style.fontSize ?? duFontSizeDefault ?? styleDefault.fontSize ?? 16;
    };

    const getLineHeight = (style: StyleEntryLike): number => {
      const duFont = getFontSize(style);
      return style.lineHeight ?? duLineHeightDefault ?? styleDefault.lineHeight ?? duFont * 1.4;
    };

    const getFont = (style: StyleEntryLike): string | undefined => {
      if (fontDefault && !style.fontFamily && !style.fontWeight && !style.fontStyle && style.fontSize === undefined) {
        return fontDefault;
      }

      const fontFamily = style.fontFamily ?? styleDefault.fontFamily;
      if (!fontFamily) return undefined;

      const fontStyle = style.fontStyle ?? styleDefault.fontStyle ?? 'normal';
      const fontWeight = style.fontWeight ?? styleDefault.fontWeight ?? 'normal';
      const fontSize = getFontSize(style);
      return `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    };

    const measureSegment = (segment: Segment): SegmentMetrics => {
      const fontSize = getFontSize(segment.style);
      const font = getFont(segment.style);
      const textMeasureProps = font ? { font } : { fontSize };
      const metrics = this.context.measureText
        ? this.context.measureText(segment.text, textMeasureProps)
        : { width: segment.text.length * fontSize * 0.6, height: fontSize, ascent: fontSize, descent: 0 };
      return {
        text: segment.text,
        style: segment.style,
        font,
        width: metrics.width,
        ascent: metrics.ascent,
        descent: metrics.descent,
        fontSize,
        lineHeight: getLineHeight(segment.style)
      };
    };

    // Split runs by explicit newlines while preserving style ids.
    const lineSegments: Segment[][] = [[]];
    for (const run of runs) {
      const style = mpStyleById[run.idStyle] ?? styleDefault;
      const parts = run.strSlice.split('\n');
      for (let i = 0; i < parts.length; i++) {
        if (parts[i].length > 0) {
          lineSegments[lineSegments.length - 1].push({ text: parts[i], style });
        }
        if (i < parts.length - 1) {
          lineSegments.push([]);
        }
      }
    }

    // Word-wrap logical lines if dx is set.
    let lineMetrics: SegmentMetrics[][];
    if (duDx !== undefined) {
      lineMetrics = [];
      for (const segs of lineSegments) {
        // Tokenize each segment into space-delimited atoms (word + trailing space)
        const atoms: SegmentMetrics[] = [];
        for (const seg of segs) {
          const parts = seg.text.split(' ');
          for (let pi = 0; pi < parts.length; pi++) {
            const t = pi < parts.length - 1 ? parts[pi] + ' ' : parts[pi];
            if (t.length > 0) atoms.push(measureSegment({ text: t, style: seg.style }));
          }
        }
        // Greedy pack atoms into visual lines
        const vLines: SegmentMetrics[][] = [[]];
        let xCur = 0;
        for (const atom of atoms) {
          if (xCur + atom.width > duDx && vLines[vLines.length - 1].length > 0) {
            vLines.push([]);
            xCur = 0;
          }
          vLines[vLines.length - 1].push(atom);
          xCur += atom.width;
        }
        for (const vl of vLines) lineMetrics.push(vl);
      }
    } else {
      lineMetrics = lineSegments.map((segments) => segments.map(measureSegment));
    }

    const lineWidths = lineMetrics.map((line) => line.reduce((sum, seg) => sum + seg.width, 0));
    const lineHeights = lineMetrics.map((line) => {
      if (line.length === 0) {
        return duLineHeightDefault ?? duFontSizeDefault ?? styleDefault.fontSize ?? 16;
      }
      return Math.max(...line.map((seg) => seg.lineHeight));
    });

    const lineAscents = lineMetrics.map((line, i) => {
      if (line.length === 0) {
        const fontSize = duFontSizeDefault ?? styleDefault.fontSize ?? 16;
        return fontSize;
      }
      return Math.max(...line.map((seg) => seg.ascent), lineHeights[i] * 0.7);
    });

    const totalHeight = lineHeights.reduce((sum, h) => sum + h, 0);
    const firstAscent = lineAscents[0] ?? (duFontSizeDefault ?? styleDefault.fontSize ?? 16);

    let yLineBaseline = 0;
    if (baseline === 'top') {
      yLineBaseline = firstAscent;
    } else if (baseline === 'middle') {
      yLineBaseline = -totalHeight / 2 + firstAscent;
    } else if (baseline === 'bottom') {
      yLineBaseline = -totalHeight + firstAscent;
    } else if (baseline === 'hanging') {
      yLineBaseline = firstAscent * 0.8;
    }

    const getLineStartX = (lineWidth: number): number => {
      if (align === 'center') {
        return -lineWidth / 2;
      }
      if (align === 'right' || align === 'end') {
        return -lineWidth;
      }
      return 0;
    };

    const yTop = yLineBaseline - firstAscent;
    let xMin = 0;
    let xMax = 0;
    for (let i = 0; i < lineWidths.length; i++) {
      const lineWidth = lineWidths[i] ?? 0;
      const xStart = getLineStartX(lineWidth);
      if (i === 0) {
        xMin = xStart;
        xMax = xStart + lineWidth;
      } else {
        xMin = Math.min(xMin, xStart);
        xMax = Math.max(xMax, xStart + lineWidth);
      }
    }

    this.hitTestLayoutCache.boundsByBlock.set(block, {
      x: xMin,
      y: yTop,
      width: Math.max(0, xMax - xMin),
      height: Math.max(0, totalHeight)
    });

    for (let i = 0; i < lineMetrics.length; i++) {
      const line = lineMetrics[i];
      const lineWidth = lineWidths[i] ?? 0;

      let xRun = getLineStartX(lineWidth);

      for (const seg of line) {
        const { style } = seg;
        const fill = style.fill
          ?? (typeof fillDefault === 'string' ? fillDefault : undefined)
          ?? styleDefault.fill;
        const background = style.background;
        const stroke = style.stroke
          ?? (typeof strokeDefault === 'string' ? strokeDefault : undefined)
          ?? styleDefault.stroke;
        const opacity = style.opacity ?? 1;

        if (!fill && !stroke && !background) {
          xRun += seg.width;
          continue;
        }

        this.context.save();
        this.context.setOpacity(this.context.opacity * opacity);

        if (background) {
          const bgHeight = seg.ascent + seg.descent;
          this.context.drawRectangle(xRun, yLineBaseline - seg.ascent, seg.width, bgHeight, { fill: background });
        }

        this.context.drawText(seg.text, xRun, yLineBaseline, {
          font: seg.font,
          fontSize: seg.fontSize,
          fill,
          stroke,
          strokeWidth: duStrokeWidthDefault,
          align: 'left',
          baseline: 'alphabetic'
        });
        this.context.restore();

        xRun += seg.width;
      }

      yLineBaseline += lineHeights[i] ?? 0;
    }
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
