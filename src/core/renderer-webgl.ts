import type { ArcProps, Block, CircleProps, EllipseProps, LineProps, PathProps, RectangleProps, TextProps, ImageProps } from './types.ts';
import { BlockType } from './types.ts';
import { Renderer, RendererOptions, RendererType } from './renderer.ts';
import { EventManager } from '../events.ts';
import { Matrix2D } from '../transform.ts';
import { PerformanceMonitor, PerformanceOptimizer, Viewport } from '../performance.ts';

export interface WebGLRendererOptions extends Omit<RendererOptions, 'type'> {
  pixelRatio?: number;
  enableEvents?: boolean;
  enableCulling?: boolean;
}

type RGBA = [number, number, number, number];

interface TextTextureEntry {
  texture: WebGLTexture;
  width: number;
  height: number;
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
}

export class WebGLRenderer extends Renderer {
  private gl: WebGLRenderingContext;
  private pixelRatio: number;
  private enableCulling: boolean;
  private viewport: Viewport;
  private perfMonitor: PerformanceMonitor;
  private eventManager: EventManager | null = null;

  private colorProgram: WebGLProgram;
  private colorBuffer: WebGLBuffer;
  private texProgram: WebGLProgram;
  private texBuffer: WebGLBuffer;
  private texture: WebGLTexture;

  private fallbackCanvas: HTMLCanvasElement;
  private fallbackCtx: CanvasRenderingContext2D;
  private imageCache: Map<string, HTMLImageElement> = new Map();

  private colorParseCanvas: HTMLCanvasElement;
  private colorParseCtx: CanvasRenderingContext2D;
  private colorCache: Map<string, RGBA> = new Map();
  private textMeasureCanvas: HTMLCanvasElement;
  private textMeasureCtx: CanvasRenderingContext2D;
  private textTextureCache: Map<string, TextTextureEntry> = new Map();

  constructor(options: WebGLRendererOptions) {
    super({ ...options, type: RendererType.WebGL });

    const gl = this.canvas.getContext('webgl');
    if (!gl) throw new Error('Failed to get WebGL context');
    this.gl = gl;

    this.pixelRatio = options.pixelRatio || window.devicePixelRatio || 1;
    this.enableCulling = options.enableCulling ?? true;

    this.viewport = {
      x: 0,
      y: 0,
      width: this.dxc,
      height: this.dyc
    };

    this.perfMonitor = new PerformanceMonitor();

    const colorProgram = this.createColorProgram();
    const colorBuffer = this.createBuffer();
    const texProgram = this.createTextureProgram();
    const texBuffer = this.createBuffer();
    const texture = this.createTexture();

    this.colorProgram = colorProgram;
    this.colorBuffer = colorBuffer;
    this.texProgram = texProgram;
    this.texBuffer = texBuffer;
    this.texture = texture;

    this.fallbackCanvas = document.createElement('canvas');
    const fallbackCtx = this.fallbackCanvas.getContext('2d');
    if (!fallbackCtx) throw new Error('Failed to get fallback 2D context');
    this.fallbackCtx = fallbackCtx;

    this.colorParseCanvas = document.createElement('canvas');
    this.colorParseCanvas.width = 1;
    this.colorParseCanvas.height = 1;
    const colorParseCtx = this.colorParseCanvas.getContext('2d');
    if (!colorParseCtx) throw new Error('Failed to create color parser context');
    this.colorParseCtx = colorParseCtx;

    this.textMeasureCanvas = document.createElement('canvas');
    const textMeasureCtx = this.textMeasureCanvas.getContext('2d');
    if (!textMeasureCtx) throw new Error('Failed to create text measure context');
    this.textMeasureCtx = textMeasureCtx;

    this.setupCanvas();

    if (options.enableEvents !== false) {
      this.eventManager = new EventManager(this.canvas);
    }
  }

  private setupCanvas(): void {
    this.canvas.width = this.dxc * this.pixelRatio;
    this.canvas.height = this.dyc * this.pixelRatio;
    this.canvas.style.width = `${this.dxc}px`;
    this.canvas.style.height = `${this.dyc}px`;

    this.fallbackCanvas.width = this.canvas.width;
    this.fallbackCanvas.height = this.canvas.height;

    this.viewport.width = this.dxc;
    this.viewport.height = this.dyc;

    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
  }

  private createShader(type: number, source: string): WebGLShader {
    const shader = this.gl.createShader(type);
    if (!shader) throw new Error('Failed to create shader');

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const error = this.gl.getShaderInfoLog(shader) || 'Unknown shader compile error';
      this.gl.deleteShader(shader);
      throw new Error(error);
    }

    return shader;
  }

  private createProgram(vertexSource: string, fragmentSource: string): WebGLProgram {
    const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentSource);

    const program = this.gl.createProgram();
    if (!program) throw new Error('Failed to create WebGL program');

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      const error = this.gl.getProgramInfoLog(program) || 'Unknown program link error';
      throw new Error(error);
    }

    this.gl.deleteShader(vertexShader);
    this.gl.deleteShader(fragmentShader);
    return program;
  }

  private createColorProgram(): WebGLProgram {
    return this.createProgram(
      `
      attribute vec2 a_position;
      uniform vec2 u_resolution;
      void main() {
        vec2 zeroToOne = a_position / u_resolution;
        vec2 zeroToTwo = zeroToOne * 2.0;
        vec2 clipSpace = zeroToTwo - 1.0;
        gl_Position = vec4(clipSpace * vec2(1.0, -1.0), 0.0, 1.0);
      }
      `,
      `
      precision mediump float;
      uniform vec4 u_color;
      void main() {
        gl_FragColor = u_color;
      }
      `
    );
  }

  private createTextureProgram(): WebGLProgram {
    return this.createProgram(
      `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      uniform vec2 u_resolution;
      void main() {
        vec2 zeroToOne = a_position / u_resolution;
        vec2 zeroToTwo = zeroToOne * 2.0;
        vec2 clipSpace = zeroToTwo - 1.0;
        gl_Position = vec4(clipSpace * vec2(1.0, -1.0), 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
      `,
      `
      precision mediump float;
      varying vec2 v_texCoord;
      uniform sampler2D u_texture;
      uniform float u_alpha;
      void main() {
        vec4 color = texture2D(u_texture, v_texCoord);
        color.a *= u_alpha;
        gl_FragColor = color;
      }
      `
    );
  }

  private createBuffer(): WebGLBuffer {
    const buffer = this.gl.createBuffer();
    if (!buffer) throw new Error('Failed to create WebGL buffer');
    return buffer;
  }

  private createTexture(): WebGLTexture {
    const texture = this.gl.createTexture();
    if (!texture) throw new Error('Failed to create WebGL texture');

    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

    return texture;
  }

  private parseColor(color: string | undefined, opacity: number): RGBA {
    if (!color) return [0, 0, 0, 0];

    const key = `${color}|${opacity}`;
    const cached = this.colorCache.get(key);
    if (cached) return cached;

    this.colorParseCtx.clearRect(0, 0, 1, 1);
    this.colorParseCtx.fillStyle = color;
    this.colorParseCtx.fillRect(0, 0, 1, 1);
    const pixel = this.colorParseCtx.getImageData(0, 0, 1, 1).data;
    const rgba: RGBA = [pixel[0] / 255, pixel[1] / 255, pixel[2] / 255, (pixel[3] / 255) * opacity];
    this.colorCache.set(key, rgba);
    return rgba;
  }

  private getBlockTransform(props: any): Matrix2D {
    let transform = Matrix2D.identity();

    if (props.x !== undefined || props.y !== undefined) {
      transform = transform.translate(props.x ?? 0, props.y ?? 0);
    }
    if (props.rotation !== undefined) {
      transform = transform.rotate(props.rotation);
    }
    if (props.scaleX !== undefined || props.scaleY !== undefined) {
      transform = transform.scaleXY(props.scaleX ?? 1, props.scaleY ?? 1);
    }
    if (props.skewX !== undefined || props.skewY !== undefined) {
      transform = transform.skewXY(props.skewX ?? 0, props.skewY ?? 0);
    }

    return transform;
  }

  private toCanvasPixels(matrix: Matrix2D, xl: number, yl: number): [number, number] {
    const p = matrix.transformPoint(xl, yl);
    return [p.x * this.pixelRatio, p.y * this.pixelRatio];
  }

  private drawTriangles(vertices: number[], color: RGBA): void {
    if (vertices.length < 6 || color[3] <= 0) return;

    this.gl.useProgram(this.colorProgram);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STREAM_DRAW);

    const positionLocation = this.gl.getAttribLocation(this.colorProgram, 'a_position');
    const resolutionLocation = this.gl.getUniformLocation(this.colorProgram, 'u_resolution');
    const colorLocation = this.gl.getUniformLocation(this.colorProgram, 'u_color');

    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
    this.gl.uniform2f(resolutionLocation, this.canvas.width, this.canvas.height);
    this.gl.uniform4f(colorLocation, color[0], color[1], color[2], color[3]);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, vertices.length / 2);
  }

  private drawLineSegment(matrix: Matrix2D, x1: number, y1: number, x2: number, y2: number, width: number, color: RGBA): void {
    if (width <= 0) return;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len === 0) return;

    const nx = -dy / len;
    const ny = dx / len;
    const half = width / 2;

    const [ax, ay] = this.toCanvasPixels(matrix, x1 + nx * half, y1 + ny * half);
    const [bx, by] = this.toCanvasPixels(matrix, x2 + nx * half, y2 + ny * half);
    const [cx, cy] = this.toCanvasPixels(matrix, x2 - nx * half, y2 - ny * half);
    const [dx2, dy2] = this.toCanvasPixels(matrix, x1 - nx * half, y1 - ny * half);

    this.drawTriangles([
      ax, ay, bx, by, cx, cy,
      ax, ay, cx, cy, dx2, dy2
    ], color);
  }

  private drawRectangle(props: RectangleProps, matrix: Matrix2D, opacity: number): void {
    const fillColor = this.parseColor(props.fill, opacity);
    if (props.fill) {
      const [x0, y0] = this.toCanvasPixels(matrix, 0, 0);
      const [x1, y1] = this.toCanvasPixels(matrix, props.dx, 0);
      const [x2, y2] = this.toCanvasPixels(matrix, props.dx, props.dy);
      const [x3, y3] = this.toCanvasPixels(matrix, 0, props.dy);
      this.drawTriangles([
        x0, y0, x1, y1, x2, y2,
        x0, y0, x2, y2, x3, y3
      ], fillColor);
    }

    if (props.stroke) {
      const strokeColor = this.parseColor(props.stroke, opacity);
      const sw = props.strokeWidth ?? 1;
      this.drawLineSegment(matrix, 0, 0, props.dx, 0, sw, strokeColor);
      this.drawLineSegment(matrix, props.dx, 0, props.dx, props.dy, sw, strokeColor);
      this.drawLineSegment(matrix, props.dx, props.dy, 0, props.dy, sw, strokeColor);
      this.drawLineSegment(matrix, 0, props.dy, 0, 0, sw, strokeColor);
    }
  }

  private drawCircle(props: CircleProps, matrix: Matrix2D, opacity: number): void {
    const segments = Math.max(20, Math.ceil(props.radius * 0.8));

    if (props.fill) {
      const fillColor = this.parseColor(props.fill, opacity);
      const vertices: number[] = [];
      const [cx, cy] = this.toCanvasPixels(matrix, 0, 0);
      for (let i = 0; i < segments; i++) {
        const a1 = (i / segments) * Math.PI * 2;
        const a2 = ((i + 1) / segments) * Math.PI * 2;
        const [x1, y1] = this.toCanvasPixels(matrix, Math.cos(a1) * props.radius, Math.sin(a1) * props.radius);
        const [x2, y2] = this.toCanvasPixels(matrix, Math.cos(a2) * props.radius, Math.sin(a2) * props.radius);
        vertices.push(cx, cy, x1, y1, x2, y2);
      }
      this.drawTriangles(vertices, fillColor);
    }

    if (props.stroke) {
      const strokeColor = this.parseColor(props.stroke, opacity);
      const sw = props.strokeWidth ?? 1;
      let px = props.radius;
      let py = 0;
      for (let i = 1; i <= segments; i++) {
        const a = (i / segments) * Math.PI * 2;
        const x = Math.cos(a) * props.radius;
        const y = Math.sin(a) * props.radius;
        this.drawLineSegment(matrix, px, py, x, y, sw, strokeColor);
        px = x;
        py = y;
      }
    }
  }

  private drawEllipse(props: EllipseProps, matrix: Matrix2D, opacity: number): void {
    const segments = Math.max(24, Math.ceil(Math.max(props.radiusX, props.radiusY) * 0.8));

    if (props.fill) {
      const fillColor = this.parseColor(props.fill, opacity);
      const vertices: number[] = [];
      const [cx, cy] = this.toCanvasPixels(matrix, 0, 0);
      for (let i = 0; i < segments; i++) {
        const a1 = (i / segments) * Math.PI * 2;
        const a2 = ((i + 1) / segments) * Math.PI * 2;
        const [x1, y1] = this.toCanvasPixels(matrix, Math.cos(a1) * props.radiusX, Math.sin(a1) * props.radiusY);
        const [x2, y2] = this.toCanvasPixels(matrix, Math.cos(a2) * props.radiusX, Math.sin(a2) * props.radiusY);
        vertices.push(cx, cy, x1, y1, x2, y2);
      }
      this.drawTriangles(vertices, fillColor);
    }

    if (props.stroke) {
      const strokeColor = this.parseColor(props.stroke, opacity);
      const sw = props.strokeWidth ?? 1;
      let px = props.radiusX;
      let py = 0;
      for (let i = 1; i <= segments; i++) {
        const a = (i / segments) * Math.PI * 2;
        const x = Math.cos(a) * props.radiusX;
        const y = Math.sin(a) * props.radiusY;
        this.drawLineSegment(matrix, px, py, x, y, sw, strokeColor);
        px = x;
        py = y;
      }
    }
  }

  private drawLine(props: LineProps, matrix: Matrix2D, opacity: number): void {
    const strokeColor = this.parseColor(props.stroke, opacity);
    const sw = props.strokeWidth ?? 1;
    this.drawLineSegment(matrix, props.x1, props.y1, props.x2, props.y2, sw, strokeColor);
  }

  private drawArc(props: ArcProps, matrix: Matrix2D, opacity: number): void {
    const delta = props.endAngle - props.startAngle;
    const segments = Math.max(16, Math.ceil(Math.abs(delta) * props.radius * 0.5));

    if (props.fill) {
      const fillColor = this.parseColor(props.fill, opacity);
      const vertices: number[] = [];
      const [cx, cy] = this.toCanvasPixels(matrix, 0, 0);

      for (let i = 0; i < segments; i++) {
        const a1 = props.startAngle + (delta * i) / segments;
        const a2 = props.startAngle + (delta * (i + 1)) / segments;
        const [x1, y1] = this.toCanvasPixels(matrix, Math.cos(a1) * props.radius, Math.sin(a1) * props.radius);
        const [x2, y2] = this.toCanvasPixels(matrix, Math.cos(a2) * props.radius, Math.sin(a2) * props.radius);
        vertices.push(cx, cy, x1, y1, x2, y2);
      }

      this.drawTriangles(vertices, fillColor);
    }

    if (props.stroke) {
      const strokeColor = this.parseColor(props.stroke, opacity);
      const sw = props.strokeWidth ?? 1;
      let px = Math.cos(props.startAngle) * props.radius;
      let py = Math.sin(props.startAngle) * props.radius;

      for (let i = 1; i <= segments; i++) {
        const a = props.startAngle + (delta * i) / segments;
        const x = Math.cos(a) * props.radius;
        const y = Math.sin(a) * props.radius;
        this.drawLineSegment(matrix, px, py, x, y, sw, strokeColor);
        px = x;
        py = y;
      }
    }
  }

  private drawUnsupportedViaCanvas(block: Block, matrix: Matrix2D, opacity: number): void {
    this.fallbackCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.fallbackCtx.clearRect(0, 0, this.fallbackCanvas.width, this.fallbackCanvas.height);
    this.fallbackCtx.globalAlpha = 1;
    this.fallbackCtx.setTransform(
      matrix.a * this.pixelRatio,
      matrix.b * this.pixelRatio,
      matrix.c * this.pixelRatio,
      matrix.d * this.pixelRatio,
      matrix.e * this.pixelRatio,
      matrix.f * this.pixelRatio
    );

    const props = block.props as any;

    if (block.type === BlockType.Path) {
      const pathProps = props as PathProps;
      const path = new Path2D(pathProps.pathData);
      if (pathProps.fill) {
        this.fallbackCtx.fillStyle = pathProps.fill;
        this.fallbackCtx.fill(path);
      }
      if (pathProps.stroke) {
        this.fallbackCtx.strokeStyle = pathProps.stroke;
        this.fallbackCtx.lineWidth = pathProps.strokeWidth ?? 1;
        this.fallbackCtx.stroke(path);
      }
    } else if (block.type === BlockType.Image) {
      const imageProps = props as ImageProps;
      let img: HTMLImageElement | null = null;

      if (typeof imageProps.src === 'string') {
        const cached = this.imageCache.get(imageProps.src);
        if (cached) {
          img = cached;
        } else {
          const created = new Image();
          created.src = imageProps.src;
          this.imageCache.set(imageProps.src, created);
          img = created;
        }
      } else {
        img = imageProps.src;
      }

      if (img && img.complete) {
        this.fallbackCtx.drawImage(img, 0, 0, imageProps.dx, imageProps.dy);
      }
    }

    this.drawFallbackTexture(opacity);
  }

  private drawTexturedQuad(texture: WebGLTexture, vertices: Float32Array, alpha: number): void {
    this.gl.useProgram(this.texProgram);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STREAM_DRAW);

    const positionLocation = this.gl.getAttribLocation(this.texProgram, 'a_position');
    const texCoordLocation = this.gl.getAttribLocation(this.texProgram, 'a_texCoord');
    const resolutionLocation = this.gl.getUniformLocation(this.texProgram, 'u_resolution');
    const textureLocation = this.gl.getUniformLocation(this.texProgram, 'u_texture');
    const alphaLocation = this.gl.getUniformLocation(this.texProgram, 'u_alpha');

    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 16, 0);
    this.gl.enableVertexAttribArray(texCoordLocation);
    this.gl.vertexAttribPointer(texCoordLocation, 2, this.gl.FLOAT, false, 16, 8);

    this.gl.uniform2f(resolutionLocation, this.canvas.width, this.canvas.height);
    this.gl.uniform1i(textureLocation, 0);
    this.gl.uniform1f(alphaLocation, alpha);

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  }

  private drawFallbackTexture(alpha: number): void {
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, 0);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      this.fallbackCanvas
    );

    const vertices = new Float32Array([
      0, 0, 0, 0,
      this.canvas.width, 0, 1, 0,
      0, this.canvas.height, 0, 1,
      this.canvas.width, this.canvas.height, 1, 1
    ]);
    this.drawTexturedQuad(this.texture, vertices, alpha);
  }

  private createTextureFromCanvas(canvas: HTMLCanvasElement): WebGLTexture {
    const texture = this.gl.createTexture();
    if (!texture) throw new Error('Failed to create text texture');

    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, 0);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, canvas);
    return texture;
  }

  private getTextTextureEntry(props: TextProps): TextTextureEntry {
    const font = props.font || `${props.fontSize ?? 16}px sans-serif`;
    const align = props.align || 'left';
    const baseline = props.baseline || 'alphabetic';
    const strokeWidth = props.strokeWidth ?? 1;
    const key = [props.text, font, props.fill || '', props.stroke || '', strokeWidth, align, baseline].join('|');

    const cached = this.textTextureCache.get(key);
    if (cached) return cached;

    this.textMeasureCtx.font = font;
    const metrics = this.textMeasureCtx.measureText(props.text);
    const textWidth = Math.max(1, Math.ceil(metrics.width));
    const ascent = Math.max(1, Math.ceil(metrics.actualBoundingBoxAscent || (props.fontSize ?? 16) * 0.8));
    const descent = Math.max(1, Math.ceil(metrics.actualBoundingBoxDescent || (props.fontSize ?? 16) * 0.2));
    const textHeight = ascent + descent;

    let xMin = 0;
    let xMax = textWidth;
    if (align === 'center') {
      xMin = -textWidth / 2;
      xMax = textWidth / 2;
    } else if (align === 'right' || align === 'end') {
      xMin = -textWidth;
      xMax = 0;
    }

    let yMin = -ascent;
    let yMax = descent;
    if (baseline === 'top') {
      yMin = 0;
      yMax = textHeight;
    } else if (baseline === 'middle') {
      yMin = -textHeight / 2;
      yMax = textHeight / 2;
    } else if (baseline === 'bottom') {
      yMin = -textHeight;
      yMax = 0;
    } else if (baseline === 'hanging') {
      yMin = -(ascent * 0.8);
      yMax = descent + ascent * 0.2;
    }

    const pad = Math.ceil(strokeWidth + 2);
    const texWidth = Math.max(1, Math.ceil(xMax - xMin + pad * 2));
    const texHeight = Math.max(1, Math.ceil(yMax - yMin + pad * 2));

    const canvas = document.createElement('canvas');
    canvas.width = texWidth;
    canvas.height = texHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to create text texture context');

    ctx.clearRect(0, 0, texWidth, texHeight);
    ctx.font = font;
    ctx.textAlign = align as CanvasTextAlign;
    ctx.textBaseline = baseline as CanvasTextBaseline;
    const anchorX = -xMin + pad;
    const anchorY = -yMin + pad;

    if (props.fill) {
      ctx.fillStyle = props.fill;
      ctx.fillText(props.text, anchorX, anchorY);
    }
    if (props.stroke) {
      ctx.strokeStyle = props.stroke;
      ctx.lineWidth = strokeWidth;
      ctx.strokeText(props.text, anchorX, anchorY);
    }

    const texture = this.createTextureFromCanvas(canvas);
    const entry: TextTextureEntry = {
      texture,
      width: texWidth,
      height: texHeight,
      xMin: xMin - pad,
      yMin: yMin - pad,
      xMax: xMax + pad,
      yMax: yMax + pad
    };
    this.textTextureCache.set(key, entry);
    return entry;
  }

  private drawText(props: TextProps, matrix: Matrix2D, opacity: number): void {
    if (!props.fill && !props.stroke) return;

    const entry = this.getTextTextureEntry(props);

    const [x0, y0] = this.toCanvasPixels(matrix, entry.xMin, entry.yMin);
    const [x1, y1] = this.toCanvasPixels(matrix, entry.xMax, entry.yMin);
    const [x2, y2] = this.toCanvasPixels(matrix, entry.xMin, entry.yMax);
    const [x3, y3] = this.toCanvasPixels(matrix, entry.xMax, entry.yMax);

    const vertices = new Float32Array([
      x0, y0, 0, 0,
      x1, y1, 1, 0,
      x2, y2, 0, 1,
      x3, y3, 1, 1
    ]);

    this.drawTexturedQuad(entry.texture, vertices, opacity);
  }

  private renderBlock(block: Block, parentTransform: Matrix2D, parentOpacity: number): void {
    if (block.props.visible === false) return;

    if (this.enableCulling) {
      const inView = PerformanceOptimizer.cullBlocks(block, this.viewport, parentTransform);
      if (!inView) {
        PerformanceOptimizer.stats.blocksCulled++;
        return;
      }
    }

    PerformanceOptimizer.stats.blocksRendered++;

    const blockTransform = this.getBlockTransform(block.props);
    const worldTransform = parentTransform.multiply(blockTransform);
    const blockOpacity = parentOpacity * (block.props.opacity ?? 1);

    switch (block.type) {
      case BlockType.Rectangle:
        this.drawRectangle(block.props as RectangleProps, worldTransform, blockOpacity);
        break;
      case BlockType.Circle:
        this.drawCircle(block.props as CircleProps, worldTransform, blockOpacity);
        break;
      case BlockType.Ellipse:
        this.drawEllipse(block.props as EllipseProps, worldTransform, blockOpacity);
        break;
      case BlockType.Line:
        this.drawLine(block.props as LineProps, worldTransform, blockOpacity);
        break;
      case BlockType.Arc:
        this.drawArc(block.props as ArcProps, worldTransform, blockOpacity);
        break;
      case BlockType.Text:
        this.drawText(block.props as TextProps, worldTransform, blockOpacity);
        break;
      case BlockType.Image:
      case BlockType.Path:
        this.drawUnsupportedViaCanvas(block, worldTransform, blockOpacity);
        break;
      case BlockType.Group:
      case BlockType.Layer:
        break;
    }

    if (block.children) {
      for (const child of block.children) {
        this.renderBlock(child, worldTransform, blockOpacity);
      }
    }
  }

  clear(): void {
    this.gl.clearColor(0, 0, 0, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  render(block?: Block): void {
    const startTime = performance.now();

    PerformanceOptimizer.resetStats();
    this.clear();

    if (!block) {
      PerformanceOptimizer.stats.renderTime = performance.now() - startTime;
      this.perfMonitor.update();
      return;
    }

    if (this.eventManager) {
      this.eventManager.setScene(block);
    }

    this.renderBlock(block, Matrix2D.identity(), 1);

    PerformanceOptimizer.stats.renderTime = performance.now() - startTime;
    this.perfMonitor.update();
  }

  resize(dxc: number, dyc: number): void {
    super.resize(dxc, dyc);
    this.setupCanvas();
  }

  getPerformanceStats() {
    return this.perfMonitor.getStats();
  }

  destroy(): void {
    if (this.eventManager) {
      this.eventManager.destroy();
    }
  }

  getContext(): WebGLRenderingContext {
    return this.gl;
  }
}
