// Copyright (c) 2026 François Rouaix

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

