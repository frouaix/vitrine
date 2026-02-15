// Rendering context abstraction
import { Matrix2D, TransformStack } from '../transform.js';
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
  drawRectangle(xl: number, yl: number, dxl: number, dyl: number, props: any): void;
  drawCircle(xl: number, yl: number, rl: number, props: any): void;
  drawEllipse(xl: number, yl: number, rxl: number, ryl: number, props: any): void;
  drawPath(pathData: string, props: any): void;
  drawLine(xl1: number, yl1: number, xl2: number, yl2: number, props: any): void;
  drawText(text: string, xl: number, yl: number, props: any): void;
  drawImage(image: HTMLImageElement, xl: number, yl: number, dxl: number, dyl: number, props: any): void;
  drawArc(xl: number, yl: number, rl: number, startAngle: number, endAngle: number, props: any): void;
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

  drawRectangle(xl: number, yl: number, dxl: number, dyl: number, props: any): void {
    if (props.cornerRadius) {
      this.roundRect(xl, yl, dxl, dyl, props.cornerRadius, props);
    } else {
      if (props.fill) {
        this.ctx.fillStyle = props.fill;
        this.ctx.fillRect(xl, yl, dxl, dyl);
      }
      if (props.stroke) {
        this.ctx.strokeStyle = props.stroke;
        this.ctx.lineWidth = props.strokeWidth ?? 1;
        this.ctx.strokeRect(xl, yl, dxl, dyl);
      }
    }
  }

  private roundRect(xl: number, yl: number, dxl: number, dyl: number, rl: number, props: any): void {
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

  drawCircle(xl: number, yl: number, rl: number, props: any): void {
    this.ctx.beginPath();
    this.ctx.arc(xl, yl, rl, 0, Math.PI * 2);
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

  drawEllipse(xl: number, yl: number, rxl: number, ryl: number, props: any): void {
    this.ctx.beginPath();
    this.ctx.ellipse(xl, yl, rxl, ryl, 0, 0, Math.PI * 2);
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

  drawLine(xl1: number, yl1: number, xl2: number, yl2: number, props: any): void {
    this.ctx.beginPath();
    this.ctx.moveTo(xl1, yl1);
    this.ctx.lineTo(xl2, yl2);
    this.ctx.strokeStyle = props.stroke;
    this.ctx.lineWidth = props.strokeWidth ?? 1;
    this.ctx.stroke();
  }

  drawText(text: string, xl: number, yl: number, props: any): void {
    if (props.font) this.ctx.font = props.font;
    if (props.fontSize) this.ctx.font = `${props.fontSize}px sans-serif`;
    if (props.align) this.ctx.textAlign = props.align;
    if (props.baseline) this.ctx.textBaseline = props.baseline;
    
    if (props.fill) {
      this.ctx.fillStyle = props.fill;
      this.ctx.fillText(text, xl, yl);
    }
    if (props.stroke) {
      this.ctx.strokeStyle = props.stroke;
      this.ctx.lineWidth = props.strokeWidth ?? 1;
      this.ctx.strokeText(text, xl, yl);
    }
  }

  drawImage(image: HTMLImageElement, xl: number, yl: number, dxl: number, dyl: number, props: any): void {
    this.ctx.drawImage(image, xl, yl, dxl, dyl);
  }

  drawArc(xl: number, yl: number, rl: number, startAngle: number, endAngle: number, props: any): void {
    this.ctx.beginPath();
    this.ctx.arc(xl, yl, rl, startAngle, endAngle);
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
