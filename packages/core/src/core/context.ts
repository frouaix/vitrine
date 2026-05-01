// Copyright (c) 2026 François Rouaix

// Rendering context abstraction
import { Matrix2D, TransformStack } from '../transform.ts';
import type {
  BlendMode,
  DrawArcStyleProps,
  DrawCircleStyleProps,
  DrawImageStyleProps,
  DrawLineStyleProps,
  DrawPathStyleProps,
  DrawRectStyleProps,
  DrawTextStyleProps,
  FillStyle,
  LineStyleProps,
  ShadowProps,
  TextMeasure,
  TextMeasureProps,
} from './types.ts';

export const DU_FONTSIZE_DEFAULT = 16;
export const SF_TEXT_ASCENT_DEFAULT = 0.8;
export const SF_TEXT_DESCENT_DEFAULT = 0.2;
export const SF_TEXT_ADVANCE_APPROX_DEFAULT = 0.6;
export const SF_TEXT_LINE_HEIGHT_DEFAULT = 1.4;

export interface RenderContext {
  transformStack: TransformStack;
  opacity: number;
  fVisible: boolean;
  
  save(): void;
  restore(): void;
  applyTransform(xf: Matrix2D): void;
  setOpacity(opacity: number): void;
  setShadow(shadow: ShadowProps | null): void;
  setFilter(filter: string | undefined): void;
  setBlendMode(blendMode: BlendMode | undefined): void;
  clipRect(xl: number, yl: number, dxl: number, dyl: number): void;
  
  // Drawing primitives - to be implemented by concrete renderers
  clear(): void;
  drawRectangle(xl: number, yl: number, dxl: number, dyl: number, props: DrawRectStyleProps): void;
  drawCircle(xl: number, yl: number, rl: number, props: DrawCircleStyleProps): void;
  drawEllipse(xl: number, yl: number, rxl: number, ryl: number, props: DrawCircleStyleProps): void;
  drawPath(pathData: string, props: DrawPathStyleProps): void;
  drawLine(xl1: number, yl1: number, xl2: number, yl2: number, props: DrawLineStyleProps): void;
  drawText(text: string, xl: number, yl: number, props: DrawTextStyleProps): void;
  drawImage(image: HTMLImageElement, xl: number, yl: number, dxl: number, dyl: number, props: DrawImageStyleProps): void;
  drawArc(xl: number, yl: number, rl: number, startAngle: number, endAngle: number, props: DrawArcStyleProps): void;
  measureText?(text: string, props: TextMeasureProps): TextMeasure;
}

export class Canvas2DContext implements RenderContext {
  transformStack: TransformStack;
  opacity: number = 1;
  fVisible: boolean = true;
  
  private ctx: CanvasRenderingContext2D;
  private rgOpacity: number[] = [];

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.transformStack = new TransformStack();
  }

  /** Apply optional line-style props (lineCap, lineJoin, lineDash, lineDashOffset) to the context. */
  private applyLineStyle(props: LineStyleProps): void {
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
    this.rgOpacity.push(this.opacity);
  }

  restore(): void {
    this.ctx.restore();
    this.transformStack.restore();
    const prevOpacity = this.rgOpacity.pop();
    if (prevOpacity !== undefined) this.opacity = prevOpacity;
  }

  applyTransform(matrix: Matrix2D): void {
    this.ctx.setTransform(...matrix.toCanvasTransform());
  }

  setOpacity(opacity: number): void {
    this.opacity = opacity;
    this.ctx.globalAlpha = opacity;
  }

  setShadow(shadow: ShadowProps | null): void {
    if (!shadow) {
      this.ctx.shadowOffsetX = 0;
      this.ctx.shadowOffsetY = 0;
      this.ctx.shadowBlur = 0;
      this.ctx.shadowColor = 'transparent';
      return;
    }

    const { offsetX, offsetY, blur, color } = shadow;
    this.ctx.shadowOffsetX = offsetX;
    this.ctx.shadowOffsetY = offsetY;
    this.ctx.shadowBlur = blur;
    this.ctx.shadowColor = color;
  }

  setFilter(filter: string | undefined): void {
    this.ctx.filter = filter ?? 'none';
  }

  setBlendMode(blendMode: BlendMode | undefined): void {
    const compositeOperation: GlobalCompositeOperation = blendMode && blendMode !== 'normal'
      ? blendMode
      : 'source-over';
    this.ctx.globalCompositeOperation = compositeOperation;
  }

  clipRect(xl: number, yl: number, dxl: number, dyl: number): void {
    this.ctx.beginPath();
    this.ctx.rect(xl, yl, dxl, dyl);
    this.ctx.clip();
  }

  clear(): void {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.restore();
  }

  drawRectangle(xl: number, yl: number, dxl: number, dyl: number, props: DrawRectStyleProps): void {
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

  private roundRect(xl: number, yl: number, dxl: number, dyl: number, rl: number, props: DrawRectStyleProps): void {
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

  drawCircle(xl: number, yl: number, rl: number, props: DrawCircleStyleProps): void {
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

  drawEllipse(xl: number, yl: number, rxl: number, ryl: number, props: DrawCircleStyleProps): void {
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

  drawPath(pathData: string, props: DrawPathStyleProps): void {
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

  drawLine(xl1: number, yl1: number, xl2: number, yl2: number, props: DrawLineStyleProps): void {
    const { stroke, strokeWidth } = props;
    this.ctx.beginPath();
    this.ctx.moveTo(xl1, yl1);
    this.ctx.lineTo(xl2, yl2);
    this.applyLineStyle(props);
    this.ctx.strokeStyle = this.resolveFillStyle(stroke);
    this.ctx.lineWidth = strokeWidth ?? 1;
    this.ctx.stroke();
  }

  /** Word-wrap text into lines that fit within dxMax pixels. */
  // TODO: this is a very naive implementation  that only breaks on whitespace and doesn't consider breaking long words. 
  // It also doesn't cache results, which could be expensive for large blocks of text or frequent re-rendering.
  private rgtextWrapped(text: string, dxMax: number): string[] {
    const rgwords = text.split(/\s+/);
    if (rgwords.length === 0) return [''];
    const rglines: string[] = [];
    let lineCur = rgwords[0];
    for (let i = 1; i < rgwords.length; i++) {
      const lineCandidate = lineCur + ' ' + rgwords[i];
      if (this.ctx.measureText(lineCandidate).width > dxMax) {
        rglines.push(lineCur);
        lineCur = rgwords[i];
      } else {
        lineCur = lineCandidate;
      }
    }
    rglines.push(lineCur);
    return rglines;
  }

  measureText(text: string, props: TextMeasureProps): TextMeasure {
    const { font, fontSize = DU_FONTSIZE_DEFAULT, dx: dxMax, dyLineHeight } = props;
    if (text.length === 0) {
      return {
        width: 0,
        height: fontSize,
        ascent: fontSize * SF_TEXT_ASCENT_DEFAULT,
        descent: fontSize * SF_TEXT_DESCENT_DEFAULT
      };
    }

    // Apply font settings for ctx.measureText
    if (font) this.ctx.font = font;
    else if (fontSize) this.ctx.font = `${fontSize}px sans-serif`;

    let tm: TextMetrics;
    let width: number, height: number;


    if (dxMax === undefined) {
      tm = this.ctx.measureText(text);
      width = tm.width;
    } else {
      const rglines = this.rgtextWrapped(text, dxMax);
      const duLineHeight = dyLineHeight ?? fontSize * SF_TEXT_LINE_HEIGHT_DEFAULT;
      const rgtm = rglines.map(l => this.ctx.measureText(l));
      const dxLineWidthMax = Math.min(dxMax, Math.max(...rgtm.map(tm => tm.width)));
      const dyTotal = rglines.length * duLineHeight;
      // Extract ascent/descent from first line measurement
      tm = rgtm[0] ?? { fontBoundingBoxAscent: 0, fontBoundingBoxDescent: 0, actualBoundingBoxAscent: 0, actualBoundingBoxDescent: 0 };
      width = dxLineWidthMax;
      height = dyTotal;
    }

    const ascent = tm.fontBoundingBoxAscent
      ?? tm.actualBoundingBoxAscent
      ?? fontSize * SF_TEXT_ASCENT_DEFAULT;
    const descent = tm.fontBoundingBoxDescent
      ?? tm.actualBoundingBoxDescent
      ?? fontSize * SF_TEXT_DESCENT_DEFAULT;
    height ??= ascent + descent;
    return { width, height, ascent, descent };
  }

  drawText(text: string, xl: number, yl: number, props: DrawTextStyleProps): void {
    const { font, fontSize = DU_FONTSIZE_DEFAULT, align, baseline, fill, stroke, strokeWidth,
            dx: dxMax, dy: dyMax, dyLineHeight } = props;
    if (font) this.ctx.font = font;
    else if (fontSize) this.ctx.font = `${fontSize}px sans-serif`;
    if (align) this.ctx.textAlign = align;
    if (baseline) this.ctx.textBaseline = baseline;

    // Single-line fast path
    if (dxMax === undefined) {
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
      return;
    }

    // Multi-line wrapping
    const rglines = this.rgtextWrapped(text, dxMax);
    const duLineHeight = dyLineHeight ?? fontSize * SF_TEXT_LINE_HEIGHT_DEFAULT;

    // Clip vertically when dy is set
    const fShouldClip = dyMax !== undefined;
    if (fShouldClip) {
      this.ctx.save();
      this.ctx.beginPath();
      // Clip region depends on alignment
      let xClip = xl;
      if (align === 'center') xClip = xl - dxMax / 2;
      else if (align === 'right' || align === 'end') xClip = xl - dxMax;
      // Clip region depends on baseline
      let yClip = yl;
      if (baseline === 'alphabetic' || !baseline) yClip = yl - fontSize;
      else if (baseline === 'middle') yClip = yl - duLineHeight / 2;
      else if (baseline === 'bottom') yClip = yl - dyMax;
      this.ctx.rect(xClip, yClip, dxMax, dyMax);
      this.ctx.clip();
    }

    for (let i = 0; i < rglines.length; i++) {
      const yLine = yl + i * duLineHeight;
      if (fill) {
        this.ctx.fillStyle = this.resolveFillStyle(fill);
        this.ctx.fillText(rglines[i], xl, yLine);
      }
      if (stroke) {
        this.applyLineStyle(props);
        this.ctx.strokeStyle = this.resolveFillStyle(stroke);
        this.ctx.lineWidth = strokeWidth ?? 1;
        this.ctx.strokeText(rglines[i], xl, yLine);
      }
    }

    if (fShouldClip) {
      this.ctx.restore();
    }
  }

  drawImage(image: HTMLImageElement, xl: number, yl: number, dxl: number, dyl: number, props: DrawImageStyleProps): void {
    const { sx, sy, sw, sh } = props;
    if (sx !== undefined && sy !== undefined && sw !== undefined && sh !== undefined) {
      this.ctx.drawImage(image, sx, sy, sw, sh, xl, yl, dxl, dyl);
    } else {
      this.ctx.drawImage(image, xl, yl, dxl, dyl);
    }
  }

  drawArc(xl: number, yl: number, rl: number, startAngle: number, endAngle: number, props: DrawArcStyleProps): void {
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
