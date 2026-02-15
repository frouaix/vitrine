import { Renderer, RendererOptions, RendererType } from './renderer.js';

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
