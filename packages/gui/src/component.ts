// Copyright (c) 2026 François Rouaix

// VitrineComponent — wraps a single Vitrine control in its own canvas,
// enabling componentized embedding in any HTML/React/Vue application.

import type { Block } from 'vitrine';
import type { GUIControl, TransformContext, ThemeDefinition } from './GUI/types.ts';
import { BlockType, ImmediateRenderer, group, Canvas2DContext } from 'vitrine';
import type { RendererConfig, RenderContext } from 'vitrine';
import { transformGUIControl, rsControl } from './GUI/transform.ts';
import { lightTheme } from './GUI/themes.ts';
import { TextSelectionManager } from './selection/TextSelectionManager.ts';
import type { SelectionRenderConfig } from './selection/TextSelectionManager.ts';
import { createCharacterBoundsProviderFromBlockTree } from './selection/character-bounds-adapter.ts';

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
  /** Text selection configuration. Defaults to disabled. */
  selectionConfig?: SelectionRenderConfig;
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
  private selectionManager: TextSelectionManager | null = null;
  private selectionMeasureContext: RenderContext | undefined;
  private selectableTextBlockIds: string[] = [];
  private boundInteractionHandlers: {
    pointerdown: (e: PointerEvent) => void;
    pointerup: (e: PointerEvent) => void;
    pointermove: (e: PointerEvent) => void;
    click: (e: PointerEvent) => void;
    pointerleave: () => void;
    wheel: (e: WheelEvent) => void;
    keydown: (e: KeyboardEvent) => void;
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
      pointerdown: this.handlePointerDown.bind(this),
      pointerup: this.handlePointerUp.bind(this),
      pointermove: this.handlePointerMove.bind(this),
      click: () => this.handleSimpleInvalidate(),
      pointerleave: () => this.handleSimpleInvalidate(),
      wheel: () => this.handleSimpleInvalidate(),
      keydown: this.handleKeyDown.bind(this)
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

    // Initialize selection manager if configured
    if (this.config.selectionConfig?.enabled !== false) {
      this.selectionManager = new TextSelectionManager(this.config.selectionConfig);
      const canvasMeasure = document.createElement('canvas');
      const canvasContext = canvasMeasure.getContext('2d');
      this.selectionMeasureContext = canvasContext ? new Canvas2DContext(canvasContext) : undefined;
    }

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
    this.selectionManager = null;
    this.selectionMeasureContext = undefined;

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
   * Get the text selection manager (if enabled).
   * Returns null if selection is not configured for this component.
   */
  getSelectionManager(): TextSelectionManager | null {
    return this.selectionManager;
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
    this.canvas.addEventListener('pointerdown', this.boundInteractionHandlers.pointerdown as any);
    this.canvas.addEventListener('pointerup', this.boundInteractionHandlers.pointerup as any);
    this.canvas.addEventListener('pointermove', this.boundInteractionHandlers.pointermove as any);
    this.canvas.addEventListener('click', this.boundInteractionHandlers.click as any);
    this.canvas.addEventListener('pointerleave', this.boundInteractionHandlers.pointerleave);
    this.canvas.addEventListener('wheel', this.boundInteractionHandlers.wheel as any, { passive: true });
    
    // Make canvas focusable for keyboard events
    this.canvas.tabIndex = 0;
    this.canvas.addEventListener('keydown', this.boundInteractionHandlers.keydown as any);
  }

  private removeInteractionInvalidation(): void {
    if (!this.canvas) return;
    this.canvas.removeEventListener('pointerdown', this.boundInteractionHandlers.pointerdown as any);
    this.canvas.removeEventListener('pointerup', this.boundInteractionHandlers.pointerup as any);
    this.canvas.removeEventListener('pointermove', this.boundInteractionHandlers.pointermove as any);
    this.canvas.removeEventListener('click', this.boundInteractionHandlers.click as any);
    this.canvas.removeEventListener('pointerleave', this.boundInteractionHandlers.pointerleave);
    this.canvas.removeEventListener('wheel', this.boundInteractionHandlers.wheel as any);
    this.canvas.removeEventListener('keydown', this.boundInteractionHandlers.keydown as any);
  }

  private handleSimpleInvalidate(): void {
    if (!this.invalidateOnInteraction) return;
    if (this.renderMode === 'continuous') return;
    this.invalidate();
  }

  private getCanvasCoordinates(e: PointerEvent): { x: number; y: number } | null {
    if (!this.canvas) return null;
    const { left: xwCanvas, top: ywCanvas } = this.canvas.getBoundingClientRect();
    const { clientX: xwPointer, clientY: ywPointer } = e;

    return {
      x: xwPointer - xwCanvas,
      y: ywPointer - ywCanvas
    };
  }

  private handlePointerDown(e: PointerEvent): void {
    this.handleSimpleInvalidate();
    if (!this.selectionManager) return;
    this.canvas?.focus();
    
    const coords = this.getCanvasCoordinates(e);
    if (!coords) return;
    
    for (const blockId of this.selectableTextBlockIds) {
      const charIndex = this.selectionManager.hitTestBlockCharacter(blockId, coords.x, coords.y);
      if (charIndex !== null) {
        this.selectionManager.handlePointerDown(blockId, charIndex);
        this.invalidate();
        return;
      }
    }
  }

  private handlePointerUp(e: PointerEvent): void {
    this.handleSimpleInvalidate();
    if (!this.selectionManager) return;
    
    this.selectionManager.handlePointerUp();
    this.invalidate();
  }

  private handlePointerMove(e: PointerEvent): void {
    this.handleSimpleInvalidate();
    if (!this.selectionManager) return;
    
    const coords = this.getCanvasCoordinates(e);
    if (!coords) return;
    
    for (const blockId of this.selectableTextBlockIds) {
      const charIndex = this.selectionManager.hitTestBlockCharacter(blockId, coords.x, coords.y);
      if (charIndex !== null) {
        this.selectionManager.handlePointerMove(charIndex);
        this.invalidate();
        return;
      }
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.selectionManager) return;
    
    // Only handle text navigation keys
    const handled = this.selectionManager.handleKeyDown(
      e.key,
      e.shiftKey,
      e.ctrlKey || e.metaKey
    );
    
    if (handled) {
      e.preventDefault();
      this.invalidate();
    }
  }

  private stopRenderLoop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
    }
  }

  private buildBlock(): Block {
    const contentBlock = this.mode === 'gui'
      ? transformGUIControl((this.renderFn as GUIControlBuilder)(), { theme: this.theme })
      : (this.renderFn as BlockBuilder)();
    this.selectableTextBlockIds = this.collectSelectableTextBlockIds(contentBlock);

    // If selection manager is active, wrap content with selection overlay
    if (this.selectionManager && this.selectionManager.isRenderingEnabled()) {
      this.selectionManager.setCharacterBoundsProvider(
        createCharacterBoundsProviderFromBlockTree(contentBlock, {
          context: this.selectionMeasureContext
        })
      );
      const selectionOverlay = this.selectionManager.buildSelectionOverlays();
      if (selectionOverlay) {
        return group({}, [contentBlock, selectionOverlay]);
      }
    }

    return contentBlock;
  }

  private collectSelectableTextBlockIds(root: Block): string[] {
    const ids: string[] = [];
    const stack: Block[] = [root];

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) continue;

      if (
        (current.type === BlockType.Text || current.type === BlockType.Texta) &&
        typeof current.props.id === 'string' &&
        current.props.id.length > 0
      ) {
        ids.push(current.props.id);
      }

      if (current.children) {
        for (let i = current.children.length - 1; i >= 0; i--) {
          const child = current.children[i];
          if (child) {
            stack.push(child);
          }
        }
      }
    }

    return ids;
  }
}
