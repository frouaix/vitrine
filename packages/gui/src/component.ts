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
export type RenderMode = 'continuous' | 'onDemand' | 'auto';

export interface VitrineComponentConfig {
  /** Width in CSS pixels. If omitted, auto-sized from content. */
  width?: number;
  /** Height in CSS pixels. If omitted, auto-sized from content. */
  height?: number;
  /** Theme for GUI controls. Defaults to lightTheme. */
  theme?: ThemeDefinition;
  /** Device pixel ratio override. */
  pixelRatio?: number;
  /** Render scheduling strategy. Defaults to continuous for backward compatibility. */
  renderMode?: RenderMode;
  /** Whether pointer/wheel interactions should invalidate in non-continuous modes. Defaults to true. */
  invalidateOnInteraction?: boolean;
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
  private renderMode: RenderMode;
  private invalidateOnInteraction: boolean;
  private activeAnimationCount: number = 0;
  private hasExplicitAnimationControl: boolean = false;
  private fDirty: boolean = false;
  private boundInteractionHandlers: {
    pointerdown: () => void;
    pointerup: () => void;
    pointermove: () => void;
    click: () => void;
    pointerleave: () => void;
    wheel: () => void;
  };

  constructor(
    renderFn: RenderFunction,
    config: VitrineComponentConfig = {},
    mode: 'gui' | 'block' = 'gui'
  ) {
    this.renderFn = renderFn;
    this.config = config;
    this.theme = config.theme ?? lightTheme;
    this.mode = mode;
    this.renderMode = config.renderMode ?? 'continuous';
    this.invalidateOnInteraction = config.invalidateOnInteraction ?? true;
    this.boundInteractionHandlers = {
      pointerdown: this.handleInteractionInvalidate.bind(this),
      pointerup: this.handleInteractionInvalidate.bind(this),
      pointermove: this.handleInteractionInvalidate.bind(this),
      click: this.handleInteractionInvalidate.bind(this),
      pointerleave: this.handleInteractionInvalidate.bind(this),
      wheel: this.handleInteractionInvalidate.bind(this)
    };
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
    this.setupInteractionInvalidation();
    this.invalidate();
  }

  /** Unmount the component, stopping the render loop and cleaning up. */
  unmount(): void {
    if (!this.mounted) return;

    this.stopRenderLoop();
    this.removeInteractionInvalidation();
    this.fDirty = false;
    this.activeAnimationCount = 0;
    this.hasExplicitAnimationControl = false;

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
    this.invalidate();
  }

  /** Update the theme. Takes effect on the next frame. */
  setTheme(theme: ThemeDefinition): void {
    this.theme = theme;
    this.invalidate();
  }

  /** Resize the component. */
  resize(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;
    if (this.renderer) {
      this.renderer.resize(width, height);
    }
    this.invalidate();
  }

  /** Returns the underlying canvas element, or null if not mounted. */
  getCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }

  /** Returns true if the component is currently mounted. */
  isMounted(): boolean {
    return this.mounted;
  }

  /**
   * Marks the component as dirty and schedules rendering based on renderMode.
   * Call this after external state changes in onDemand/auto modes.
   */
  invalidate(): void {
    this.fDirty = true;
    this.scheduleNextFrame();
  }

  /** Change render mode at runtime. */
  setRenderMode(renderMode: RenderMode): void {
    this.renderMode = renderMode;
    this.invalidate();
  }

  /** Get current render mode. */
  getRenderMode(): RenderMode {
    return this.renderMode;
  }

  /**
   * Signals that an animation has started.
   * In auto mode, this enables continuous RAF until endAnimation() balances it.
   */
  beginAnimation(): void {
    this.hasExplicitAnimationControl = true;
    this.activeAnimationCount += 1;
    this.invalidate();
  }

  /**
   * Signals that an animation has ended.
   * The count is clamped at zero to keep state robust across mismatched calls.
   */
  endAnimation(): void {
    this.hasExplicitAnimationControl = true;
    this.activeAnimationCount = Math.max(0, this.activeAnimationCount - 1);
    this.invalidate();
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

  private shouldRunContinuously(): boolean {
    if (this.renderMode === 'continuous') {
      return true;
    }
    if (this.renderMode === 'auto') {
      if (!this.hasExplicitAnimationControl) {
        return true;
      }
      return this.activeAnimationCount > 0;
    }
    return false;
  }

  private scheduleNextFrame(): void {
    if (!this.mounted || this.animationFrameId !== 0) return;
    this.animationFrameId = requestAnimationFrame(this.onAnimationFrame);
  }

  private onAnimationFrame = (): void => {
    this.animationFrameId = 0;
    if (!this.mounted || !this.renderer) return;

    const fContinuous = this.shouldRunContinuously();
    const fShouldRender = fContinuous || this.fDirty;
    if (fShouldRender) {
      this.fDirty = false;
      const block = this.buildBlock();
      this.renderer.render(block);
    }

    if (this.shouldRunContinuously() || this.fDirty) {
      this.scheduleNextFrame();
    }
  };

  private setupInteractionInvalidation(): void {
    if (!this.canvas) return;
    this.canvas.addEventListener('pointerdown', this.boundInteractionHandlers.pointerdown);
    this.canvas.addEventListener('pointerup', this.boundInteractionHandlers.pointerup);
    this.canvas.addEventListener('pointermove', this.boundInteractionHandlers.pointermove);
    this.canvas.addEventListener('click', this.boundInteractionHandlers.click);
    this.canvas.addEventListener('pointerleave', this.boundInteractionHandlers.pointerleave);
    this.canvas.addEventListener('wheel', this.boundInteractionHandlers.wheel);
  }

  private removeInteractionInvalidation(): void {
    if (!this.canvas) return;
    this.canvas.removeEventListener('pointerdown', this.boundInteractionHandlers.pointerdown);
    this.canvas.removeEventListener('pointerup', this.boundInteractionHandlers.pointerup);
    this.canvas.removeEventListener('pointermove', this.boundInteractionHandlers.pointermove);
    this.canvas.removeEventListener('click', this.boundInteractionHandlers.click);
    this.canvas.removeEventListener('pointerleave', this.boundInteractionHandlers.pointerleave);
    this.canvas.removeEventListener('wheel', this.boundInteractionHandlers.wheel);
  }

  private handleInteractionInvalidate(): void {
    if (!this.invalidateOnInteraction) return;
    if (this.renderMode === 'continuous') return;
    this.invalidate();
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
