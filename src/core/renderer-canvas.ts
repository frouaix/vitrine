import { Renderer, RendererOptions, RendererType } from './renderer.ts';

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
