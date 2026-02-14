// Rendering context abstraction
import { Matrix2D, TransformStack } from './transform.js';
import type { Block, BaseBlockProps, Bounds } from './types.js';

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
  drawRectangle(x: number, y: number, width: number, height: number, props: any): void;
  drawCircle(x: number, y: number, radius: number, props: any): void;
  drawEllipse(x: number, y: number, radiusX: number, radiusY: number, props: any): void;
  drawPath(pathData: string, props: any): void;
  drawLine(x1: number, y1: number, x2: number, y2: number, props: any): void;
  drawText(text: string, x: number, y: number, props: any): void;
  drawImage(image: HTMLImageElement, x: number, y: number, width: number, height: number, props: any): void;
  drawArc(x: number, y: number, radius: number, startAngle: number, endAngle: number, props: any): void;
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

  drawRectangle(x: number, y: number, width: number, height: number, props: any): void {
    if (props.cornerRadius) {
      this.roundRect(x, y, width, height, props.cornerRadius);
    } else {
      if (props.fill) {
        this.ctx.fillStyle = props.fill;
        this.ctx.fillRect(x, y, width, height);
      }
      if (props.stroke) {
        this.ctx.strokeStyle = props.stroke;
        this.ctx.lineWidth = props.strokeWidth ?? 1;
        this.ctx.strokeRect(x, y, width, height);
      }
    }
  }

  private roundRect(x: number, y: number, width: number, height: number, radius: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.arcTo(x + width, y, x + width, y + radius, radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.arcTo(x, y + height, x, y + height - radius, radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.arcTo(x, y, x + radius, y, radius);
    this.ctx.closePath();
    
    if (this.ctx.fillStyle) this.ctx.fill();
    if (this.ctx.strokeStyle) this.ctx.stroke();
  }

  drawCircle(x: number, y: number, radius: number, props: any): void {
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    if (props.fill) {
      this.ctx.fillStyle = props.fill;
      this.ctx.fill();
    }
    if (props.stroke) {
      this.ctx.strokeStyle = props.stroke;
      this.ctx.lineWidth = props.strokeWidth ?? 1;
      this.ctx.stroke();
    }
  }

  drawEllipse(x: number, y: number, radiusX: number, radiusY: number, props: any): void {
    this.ctx.beginPath();
    this.ctx.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2);
    if (props.fill) {
      this.ctx.fillStyle = props.fill;
      this.ctx.fill();
    }
    if (props.stroke) {
      this.ctx.strokeStyle = props.stroke;
      this.ctx.lineWidth = props.strokeWidth ?? 1;
      this.ctx.stroke();
    }
  }

  drawPath(pathData: string, props: any): void {
    const path = new Path2D(pathData);
    if (props.fill) {
      this.ctx.fillStyle = props.fill;
      this.ctx.fill(path);
    }
    if (props.stroke) {
      this.ctx.strokeStyle = props.stroke;
      this.ctx.lineWidth = props.strokeWidth ?? 1;
      this.ctx.stroke(path);
    }
  }

  drawLine(x1: number, y1: number, x2: number, y2: number, props: any): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.strokeStyle = props.stroke;
    this.ctx.lineWidth = props.strokeWidth ?? 1;
    this.ctx.stroke();
  }

  drawText(text: string, x: number, y: number, props: any): void {
    if (props.font) this.ctx.font = props.font;
    if (props.fontSize) this.ctx.font = `${props.fontSize}px sans-serif`;
    if (props.align) this.ctx.textAlign = props.align;
    if (props.baseline) this.ctx.textBaseline = props.baseline;
    
    if (props.fill) {
      this.ctx.fillStyle = props.fill;
      this.ctx.fillText(text, x, y);
    }
    if (props.stroke) {
      this.ctx.strokeStyle = props.stroke;
      this.ctx.lineWidth = props.strokeWidth ?? 1;
      this.ctx.strokeText(text, x, y);
    }
  }

  drawImage(image: HTMLImageElement, x: number, y: number, width: number, height: number, props: any): void {
    this.ctx.drawImage(image, x, y, width, height);
  }

  drawArc(x: number, y: number, radius: number, startAngle: number, endAngle: number, props: any): void {
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, startAngle, endAngle);
    if (props.fill) {
      this.ctx.fillStyle = props.fill;
      this.ctx.fill();
    }
    if (props.stroke) {
      this.ctx.strokeStyle = props.stroke;
      this.ctx.lineWidth = props.strokeWidth ?? 1;
      this.ctx.stroke();
    }
  }
}
