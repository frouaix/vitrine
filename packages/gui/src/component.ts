// Copyright (c) 2026 François Rouaix

// VitrineComponent — wraps a single Vitrine control in its own canvas,
// enabling componentized embedding in any HTML/React/Vue application.

import type { Block } from 'vitrine';
import type { GUIControl, TransformContext, ThemeDefinition } from './GUI/types.ts';
import { ImmediateRenderer } from 'vitrine';
import type { RendererConfig } from 'vitrine';
import { transformGUIControl, rsControl } from './GUI/transform.ts';
import { lightTheme } from './GUI/themes.ts';

/** Function that returns a GUI control tree each frame. */
export type GUIControlBuilder = () => GUIControl;

/** Function that returns a low-level Block tree each frame. */
export type BlockBuilder = () => Block;

/** A render function is either a GUIControlBuilder or a BlockBuilder. */
export type RenderFunction = GUIControlBuilder | BlockBuilder;

export interface VitrineComponentConfig {
  /** Width in CSS pixels. If omitted, auto-sized from content. */
  width?: number;
  /** Height in CSS pixels. If omitted, auto-sized from content. */
  height?: number;
  /** Theme for GUI controls. Defaults to lightTheme. */
  theme?: ThemeDefinition;
  /** Device pixel ratio override. */
  pixelRatio?: number;
  /** Additional renderer config overrides. */
  rendererConfig?: Partial<RendererConfig>;
}

export class VitrineComponent {
  private renderer: ImmediateRenderer | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private container: HTMLElement | null = null;
  private animationFrameId: number = 0;
  private renderFn: RenderFunction;
  private config: VitrineComponentConfig;
  private theme: ThemeDefinition;
  private mounted: boolean = false;
  private mode: 'gui' | 'block';

  constructor(
    renderFn: RenderFunction,
    config: VitrineComponentConfig = {},
    mode: 'gui' | 'block' = 'gui'
  ) {
    this.renderFn = renderFn;
    this.config = config;
    this.theme = config.theme ?? lightTheme;
    this.mode = mode;
  }

  /** Create a component that renders GUI controls (high-level DSL). */
  static gui(renderFn: GUIControlBuilder, config: VitrineComponentConfig = {}): VitrineComponent {
    return new VitrineComponent(renderFn, config, 'gui');
  }

  /** Create a component that renders raw blocks (low-level DSL). */
  static block(renderFn: BlockBuilder, config: VitrineComponentConfig = {}): VitrineComponent {
    return new VitrineComponent(renderFn, config, 'block');
  }

  /** Mount the component into a DOM container element. */
  mount(container: HTMLElement): void {
    if (this.mounted) {
      this.unmount();
    }

    this.container = container;
    this.canvas = document.createElement('canvas');
    container.appendChild(this.canvas);

    const { width, height } = this.resolveSize();

    this.renderer = new ImmediateRenderer({
      canvas: this.canvas,
      width,
      height,
      pixelRatio: this.config.pixelRatio,
      enableEvents: true,
      ...this.config.rendererConfig
    });

    this.mounted = true;
    this.startRenderLoop();
  }

  /** Unmount the component, stopping the render loop and cleaning up. */
  unmount(): void {
    if (!this.mounted) return;

    this.stopRenderLoop();

    if (this.renderer) {
      this.renderer.destroy();
      this.renderer = null;
    }

    if (this.canvas && this.container) {
      this.container.removeChild(this.canvas);
    }

    this.canvas = null;
    this.container = null;
    this.mounted = false;
  }

  /** Update the render function. Takes effect on the next frame. */
  setRenderFunction(renderFn: RenderFunction): void {
    this.renderFn = renderFn;
  }

  /** Update the theme. Takes effect on the next frame. */
  setTheme(theme: ThemeDefinition): void {
    this.theme = theme;
  }

  /** Resize the component. */
  resize(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;
    if (this.renderer) {
      this.renderer.resize(width, height);
    }
  }

  /** Returns the underlying canvas element, or null if not mounted. */
  getCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }

  /** Returns true if the component is currently mounted. */
  isMounted(): boolean {
    return this.mounted;
  }

  private resolveSize(): { width: number; height: number } {
    if (this.config.width !== undefined && this.config.height !== undefined) {
      return { width: this.config.width, height: this.config.height };
    }

    // Auto-size from content when in GUI mode
    if (this.mode === 'gui') {
      const control = (this.renderFn as GUIControlBuilder)();
      const rs = rsControl(control);
      return {
        width: this.config.width ?? rs.width,
        height: this.config.height ?? rs.height
      };
    }

    // Default fallback for block mode
    return {
      width: this.config.width ?? 400,
      height: this.config.height ?? 300
    };
  }

  private startRenderLoop(): void {
    const loop = (): void => {
      if (!this.mounted || !this.renderer) return;

      const block = this.buildBlock();
      this.renderer.render(block);
      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  private stopRenderLoop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
    }
  }

  private buildBlock(): Block {
    if (this.mode === 'gui') {
      const control = (this.renderFn as GUIControlBuilder)();
      const context: TransformContext = { theme: this.theme };
      return transformGUIControl(control, context);
    }
    return (this.renderFn as BlockBuilder)();
  }
}
