// Copyright (c) 2026 François Rouaix

// Immediate-mode rendering engine
import type { Block, BlockOfType } from './types.ts';
import { BlockType } from './types.ts';
import type { RenderContext } from './context.ts';
import { Canvas2DContext } from './context.ts';
import { EventManager } from '../events.ts';
import { PerformanceOptimizer, PerformanceMonitor, type Viewport } from '../performance.ts';

export interface RendererConfig {
  canvas?: HTMLCanvasElement;
  width?: number;
  height?: number;
  pixelRatio?: number;
  enableEvents?: boolean;
  enableCulling?: boolean;
}

export class ImmediateRenderer {
  private canvas: HTMLCanvasElement;
  private context: RenderContext;
  private dxc: number;
  private dyc: number;
  private pixelRatio: number;
  private eventManager: EventManager | null = null;
  private enableCulling: boolean;
  private viewport: Viewport;
  private perfMonitor: PerformanceMonitor;

  constructor(config: RendererConfig = {}) {
    this.canvas = config.canvas || document.createElement('canvas');
    this.dxc = config.width || 800;
    this.dyc = config.height || 600;
    this.pixelRatio = config.pixelRatio || window.devicePixelRatio || 1;
    this.enableCulling = config.enableCulling ?? true;

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

  render(block: Block): void {
    const startTime = performance.now();
    
    PerformanceOptimizer.resetStats();
    this.context.clear();
    this.context.save();
    
    // Apply pixel ratio scaling
    if (this.pixelRatio !== 1) {
      const matrix = this.context.transformStack.getCurrent().scaleXY(this.pixelRatio, this.pixelRatio);
      this.context.applyTransform(matrix);
    }
    
    this.renderBlock(block);
    this.context.restore();

    // Update event system with current scene
    if (this.eventManager) {
      this.eventManager.setScene(block);
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
    this.context.applyTransform(this.context.transformStack.getCurrent());

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

    this.context.transformStack.restore();
    this.context.restore();
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
}
