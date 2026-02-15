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
  protected dxc: number;
  protected dyc: number;

  constructor(options: RendererOptions) {
    this.canvas = options.canvas || document.createElement('canvas');
    this.dxc = options.width || 800;
    this.dyc = options.height || 600;
    this.canvas.width = this.dxc;
    this.canvas.height = this.dyc;
  }

  abstract clear(): void;
  abstract render(): void;

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  resize(dxc: number, dyc: number): void {
    this.dxc = dxc;
    this.dyc = dyc;
    this.canvas.width = dxc;
    this.canvas.height = dyc;
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
    this.ctx.clearRect(0, 0, this.dxc, this.dyc);
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
