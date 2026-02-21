// Copyright (c) 2026 François Rouaix

// Rendering context abstraction
import { Matrix2D, TransformStack } from '../transform.ts';
import type { Block, BaseBlockProps, Rc, FillStyle } from './types.ts';

export interface RenderContext {
  transformStack: TransformStack;
  opacity: number;
  visible: boolean;
  
  save(): void;
  restore(): void;
  applyTransform(matrix: Matrix2D): void;
  setOpacity(opacity: number): void;
  
  // Drawing primitives - to be implemented by concrete renderers
  clear(): void;
  drawRectangle(xl: number, yl: number, dxl: number, dyl: number, props: any): void;
  drawCircle(xl: number, yl: number, rl: number, props: any): void;
  drawEllipse(xl: number, yl: number, rxl: number, ryl: number, props: any): void;
  drawPath(pathData: string, props: any): void;
  drawLine(xl1: number, yl1: number, xl2: number, yl2: number, props: any): void;
  drawText(text: string, xl: number, yl: number, props: any): void;
  drawImage(image: HTMLImageElement, xl: number, yl: number, dxl: number, dyl: number, props: any): void;
  drawArc(xl: number, yl: number, rl: number, startAngle: number, endAngle: number, props: any): void;
  measureText?(text: string, props: any): { width: number; height: number; ascent: number; descent: number };
}

export class Canvas2DContext implements RenderContext {
  transformStack: TransformStack;
  opacity: number = 1;
  visible: boolean = true;
  
  private ctx: CanvasRenderingContext2D;
  private opacityStack: number[] = [];

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.transformStack = new TransformStack();
  }

  /** Apply optional line-style props (lineCap, lineJoin, lineDash, lineDashOffset) to the context. */
  private applyLineStyle(props: any): void {
    if (props.lineCap) this.ctx.lineCap = props.lineCap;
    if (props.lineJoin) this.ctx.lineJoin = props.lineJoin;
    if (props.lineDash) this.ctx.setLineDash(props.lineDash);
    if (props.lineDashOffset !== undefined) this.ctx.lineDashOffset = props.lineDashOffset;
  }

  /** Resolve a FillStyle descriptor to a value accepted by fillStyle/strokeStyle. */
  private resolveFillStyle(style: FillStyle): string | CanvasGradient | CanvasPattern {
    if (typeof style === 'string') return style;

    switch (style.type) {
      case 'linear-gradient': {
        const g = this.ctx.createLinearGradient(style.x0, style.y0, style.x1, style.y1);
        for (const s of style.stops) g.addColorStop(s.offset, s.color);
        return g;
      }
      case 'radial-gradient': {
        const g = this.ctx.createRadialGradient(style.x0, style.y0, style.r0, style.x1, style.y1, style.r1);
        for (const s of style.stops) g.addColorStop(s.offset, s.color);
        return g;
      }
      case 'conic-gradient': {
        const g = this.ctx.createConicGradient(style.startAngle, style.x, style.y);
        for (const s of style.stops) g.addColorStop(s.offset, s.color);
        return g;
      }
      case 'pattern': {
        const p = this.ctx.createPattern(style.image, style.repetition ?? 'repeat');
        return p ?? 'transparent';
      }
    }
  }

  save(): void {
    this.ctx.save();
    this.transformStack.save();
    this.opacityStack.push(this.opacity);
  }

  restore(): void {
    this.ctx.restore();
    this.transformStack.restore();
    const prevOpacity = this.opacityStack.pop();
    if (prevOpacity !== undefined) this.opacity = prevOpacity;
  }

  applyTransform(matrix: Matrix2D): void {
    this.ctx.setTransform(...matrix.toCanvasTransform());
  }

  setOpacity(opacity: number): void {
    this.opacity = opacity;
    this.ctx.globalAlpha = opacity;
  }

  clear(): void {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.restore();
  }

  drawRectangle(xl: number, yl: number, dxl: number, dyl: number, props: any): void {
    const { cornerRadius: duCornerRadius, fill, stroke, strokeWidth } = props;
    if (duCornerRadius) {
      this.roundRect(xl, yl, dxl, dyl, duCornerRadius, props);
    } else {
      if (fill) {
        this.ctx.fillStyle = this.resolveFillStyle(fill);
        this.ctx.fillRect(xl, yl, dxl, dyl);
      }
      if (stroke) {
        this.applyLineStyle(props);
        this.ctx.strokeStyle = this.resolveFillStyle(stroke);
        this.ctx.lineWidth = strokeWidth ?? 1;
        this.ctx.strokeRect(xl, yl, dxl, dyl);
      }
    }
  }

  private roundRect(xl: number, yl: number, dxl: number, dyl: number, rl: number, props: any): void {
    const { fill, stroke, strokeWidth } = props;
    this.ctx.beginPath();
    this.ctx.moveTo(xl + rl, yl);
    this.ctx.lineTo(xl + dxl - rl, yl);
    this.ctx.arcTo(xl + dxl, yl, xl + dxl, yl + rl, rl);
    this.ctx.lineTo(xl + dxl, yl + dyl - rl);
    this.ctx.arcTo(xl + dxl, yl + dyl, xl + dxl - rl, yl + dyl, rl);
    this.ctx.lineTo(xl + rl, yl + dyl);
    this.ctx.arcTo(xl, yl + dyl, xl, yl + dyl - rl, rl);
    this.ctx.lineTo(xl, yl + rl);
    this.ctx.arcTo(xl, yl, xl + rl, yl, rl);
    this.ctx.closePath();
    
    if (fill) {
      this.ctx.fillStyle = this.resolveFillStyle(fill);
      this.ctx.fill();
    }
    if (stroke) {
      this.applyLineStyle(props);
      this.ctx.strokeStyle = this.resolveFillStyle(stroke);
      this.ctx.lineWidth = strokeWidth ?? 1;
      this.ctx.stroke();
    }
  }

  drawCircle(xl: number, yl: number, rl: number, props: any): void {
    const { fill, stroke, strokeWidth, fillRule } = props;
    this.ctx.beginPath();
    this.ctx.arc(xl, yl, rl, 0, Math.PI * 2);
    if (fill) {
      this.ctx.fillStyle = this.resolveFillStyle(fill);
      this.ctx.fill(fillRule ?? 'nonzero');
    }
    if (stroke) {
      this.applyLineStyle(props);
      this.ctx.strokeStyle = this.resolveFillStyle(stroke);
      this.ctx.lineWidth = strokeWidth ?? 1;
      this.ctx.stroke();
    }
  }

  drawEllipse(xl: number, yl: number, rxl: number, ryl: number, props: any): void {
    const { fill, stroke, strokeWidth, fillRule } = props;
    this.ctx.beginPath();
    this.ctx.ellipse(xl, yl, rxl, ryl, 0, 0, Math.PI * 2);
    if (fill) {
      this.ctx.fillStyle = this.resolveFillStyle(fill);
      this.ctx.fill(fillRule ?? 'nonzero');
    }
    if (stroke) {
      this.applyLineStyle(props);
      this.ctx.strokeStyle = this.resolveFillStyle(stroke);
      this.ctx.lineWidth = strokeWidth ?? 1;
      this.ctx.stroke();
    }
  }

  drawPath(pathData: string, props: any): void {
    const { fill, stroke, strokeWidth, fillRule } = props;
    const path = new Path2D(pathData);
    if (fill) {
      this.ctx.fillStyle = this.resolveFillStyle(fill);
      this.ctx.fill(path, fillRule ?? 'nonzero');
    }
    if (stroke) {
      this.applyLineStyle(props);
      this.ctx.strokeStyle = this.resolveFillStyle(stroke);
      this.ctx.lineWidth = strokeWidth ?? 1;
      this.ctx.stroke(path);
    }
  }

  drawLine(xl1: number, yl1: number, xl2: number, yl2: number, props: any): void {
    const { stroke, strokeWidth } = props;
    this.ctx.beginPath();
    this.ctx.moveTo(xl1, yl1);
    this.ctx.lineTo(xl2, yl2);
    this.applyLineStyle(props);
    this.ctx.strokeStyle = this.resolveFillStyle(stroke);
    this.ctx.lineWidth = strokeWidth ?? 1;
    this.ctx.stroke();
  }

  measureText(text: string, props: any): { width: number; height: number; ascent: number; descent: number } {
    const { font, fontSize } = props;
    // Apply font settings
    if (font) this.ctx.font = font;
    else if (fontSize) this.ctx.font = `${fontSize}px sans-serif`;
    
    const metrics = this.ctx.measureText(text);
    
    // Use actualBoundingBox metrics if available (modern browsers)
    // Otherwise fallback to approximation
    const ascent = metrics.actualBoundingBoxAscent ?? (fontSize ?? 16);
    const descent = metrics.actualBoundingBoxDescent ?? 0;
    const width = metrics.width;
    const height = ascent + descent;
    
    return { width, height, ascent, descent };
  }

  drawText(text: string, xl: number, yl: number, props: any): void {
    const { font, fontSize, align, baseline, fill, stroke, strokeWidth } = props;
    if (font) this.ctx.font = font;
    if (fontSize) this.ctx.font = `${fontSize}px sans-serif`;
    if (align) this.ctx.textAlign = align;
    if (baseline) this.ctx.textBaseline = baseline;
    
    if (fill) {
      this.ctx.fillStyle = this.resolveFillStyle(fill);
      this.ctx.fillText(text, xl, yl);
    }
    if (stroke) {
      this.applyLineStyle(props);
      this.ctx.strokeStyle = this.resolveFillStyle(stroke);
      this.ctx.lineWidth = strokeWidth ?? 1;
      this.ctx.strokeText(text, xl, yl);
    }
  }

  drawImage(image: HTMLImageElement, xl: number, yl: number, dxl: number, dyl: number, props: any): void {
    this.ctx.drawImage(image, xl, yl, dxl, dyl);
  }

  drawArc(xl: number, yl: number, rl: number, startAngle: number, endAngle: number, props: any): void {
    const { fill, stroke, strokeWidth, fillRule } = props;
    this.ctx.beginPath();
    this.ctx.arc(xl, yl, rl, startAngle, endAngle);
    if (fill) {
      this.ctx.fillStyle = this.resolveFillStyle(fill);
      this.ctx.fill(fillRule ?? 'nonzero');
    }
    if (stroke) {
      this.applyLineStyle(props);
      this.ctx.strokeStyle = this.resolveFillStyle(stroke);
      this.ctx.lineWidth = strokeWidth ?? 1;
      this.ctx.stroke();
    }
  }
}
