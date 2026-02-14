export enum RendererType {
  Canvas2D = 'canvas2d',
  WebGL = 'webgl'
}

export interface RendererOptions {
  type: RendererType;
  canvas?: HTMLCanvasElement;
  width?: number;
  height?: number;
}

export abstract class Renderer {
  protected canvas: HTMLCanvasElement;
  protected width: number;
  protected height: number;

  constructor(options: RendererOptions) {
    this.canvas = options.canvas || document.createElement('canvas');
    this.width = options.width || 800;
    this.height = options.height || 600;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  abstract clear(): void;
  abstract render(): void;

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
  }
}

export class Canvas2DRenderer extends Renderer {
  private ctx: CanvasRenderingContext2D;

  constructor(options: Omit<RendererOptions, 'type'>) {
    super({ ...options, type: RendererType.Canvas2D });
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');
    this.ctx = ctx;
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  render(): void {
    // Override in subclass
  }

  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }
}

export class WebGLRenderer extends Renderer {
  private gl: WebGLRenderingContext;

  constructor(options: Omit<RendererOptions, 'type'>) {
    super({ ...options, type: RendererType.WebGL });
    const gl = this.canvas.getContext('webgl');
    if (!gl) throw new Error('Failed to get WebGL context');
    this.gl = gl;
  }

  clear(): void {
    this.gl.clearColor(0, 0, 0, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  render(): void {
    // Override in subclass
  }

  getContext(): WebGLRenderingContext {
    return this.gl;
  }
}
