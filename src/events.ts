// Event system for handling user interactions
import type { Block } from './core/types.ts';
import { HitTester, type HitTestResult } from './hit-test.ts';
import { Matrix2D } from './transform.ts';

export interface PointerEventData {
  x: number;
  y: number;
  button: number;
  buttons: number;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  originalEvent: PointerEvent;
}

export class EventManager {
  private canvas: HTMLCanvasElement;
  private currentScene: Block | null = null;
  private hoveredBlock: Block | null = null;
  private draggedBlock: Block | null = null;
  private dragStart: { xc: number; yc: number } | null = null;
  
  // Store bound event handlers so they can be properly removed
  private boundHandlers: {
    pointerdown: (e: PointerEvent) => void;
    pointerup: (e: PointerEvent) => void;
    pointermove: (e: PointerEvent) => void;
    click: (e: PointerEvent) => void;
    pointerleave: (e: PointerEvent) => void;
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    
    // Bind event handlers once and store them
    this.boundHandlers = {
      pointerdown: this.handlePointerDown.bind(this),
      pointerup: this.handlePointerUp.bind(this),
      pointermove: this.handlePointerMove.bind(this),
      click: this.handleClick.bind(this),
      pointerleave: this.handlePointerLeave.bind(this)
    };
    
    this.setupEventListeners();
  }

  setScene(scene: Block): void {
    this.currentScene = scene;
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('pointerdown', this.boundHandlers.pointerdown);
    this.canvas.addEventListener('pointerup', this.boundHandlers.pointerup);
    this.canvas.addEventListener('pointermove', this.boundHandlers.pointermove);
    this.canvas.addEventListener('click', this.boundHandlers.click);
    this.canvas.addEventListener('pointerleave', this.boundHandlers.pointerleave);
  }

  destroy(): void {
    this.canvas.removeEventListener('pointerdown', this.boundHandlers.pointerdown);
    this.canvas.removeEventListener('pointerup', this.boundHandlers.pointerup);
    this.canvas.removeEventListener('pointermove', this.boundHandlers.pointermove);
    this.canvas.removeEventListener('click', this.boundHandlers.click);
    this.canvas.removeEventListener('pointerleave', this.boundHandlers.pointerleave);
    
    // Clear state
    this.currentScene = null;
    this.hoveredBlock = null;
    this.draggedBlock = null;
    this.dragStart = null;
  }

  private getCanvasCoordinates(event: PointerEvent): { xc: number; yc: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    
    return {
      xc: (event.clientX - rect.left) * scaleX,
      yc: (event.clientY - rect.top) * scaleY
    };
  }

  private createEventData(event: PointerEvent): PointerEventData {
    const coords = this.getCanvasCoordinates(event);
    return {
      x: coords.xc,
      y: coords.yc,
      button: event.button,
      buttons: event.buttons,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      originalEvent: event
    };
  }

  private handleClick(event: PointerEvent): void {
    if (!this.currentScene) return;

    const coords = this.getCanvasCoordinates(event);
    const hit = HitTester.hitTest(this.currentScene, coords.xc, coords.yc);

    if (hit) {
      const { props } = hit.block;
      const { onClick } = props;
      if (onClick) {
        onClick(event);
      }
    }
  }

  private handlePointerDown(event: PointerEvent): void {
    if (!this.currentScene) return;

    const coords = this.getCanvasCoordinates(event);
    const hit = HitTester.hitTest(this.currentScene, coords.xc, coords.yc);

    if (hit) {
      const { block } = hit;
      const { props } = block;
      const { onPointerDown, onDrag } = props;

      if (onPointerDown) {
        onPointerDown(event);
      }

      // Start drag if handler exists
      if (onDrag) {
        this.draggedBlock = block;
        this.dragStart = coords;
      }
    }
  }

  private handlePointerUp(event: PointerEvent): void {
    if (!this.currentScene) return;

    const coords = this.getCanvasCoordinates(event);
    const hit = HitTester.hitTest(this.currentScene, coords.xc, coords.yc);

    if (hit) {
      const { props } = hit.block;
      const { onPointerUp } = props;
      if (onPointerUp) {
        onPointerUp(event);
      }
    }

    // End drag
    this.draggedBlock = null;
    this.dragStart = null;
  }

  private handlePointerMove(event: PointerEvent): void {
    if (!this.currentScene) return;

    const coords = this.getCanvasCoordinates(event);

    // Handle dragging
    if (this.draggedBlock && this.dragStart) {
      const { props } = this.draggedBlock;
      const { onDrag } = props;
      if (onDrag) {
        onDrag(event);
      }
    }

    // Handle hover
    const hit = HitTester.hitTest(this.currentScene, coords.xc, coords.yc);
    const newHoveredBlock = hit ? hit.block : null;

    if (newHoveredBlock !== this.hoveredBlock) {
      // Hover state changed
      if (this.hoveredBlock) {
        const { props } = this.hoveredBlock;
        const { onHover } = props;
        if (onHover) {
        // Trigger hover end (could add onHoverEnd if needed)
        }
      }

      this.hoveredBlock = newHoveredBlock;

      if (this.hoveredBlock) {
        const { props } = this.hoveredBlock;
        const { onHover } = props;
        if (onHover) {
          onHover(event);
        }
      }

      // Update cursor
      this.canvas.style.cursor = this.hoveredBlock ? 'pointer' : 'default';
    }

    // Always trigger pointer move if handler exists
    if (hit) {
      const { props } = hit.block;
      const { onPointerMove } = props;
      if (onPointerMove) {
        onPointerMove(event);
      }
    }
  }

  private handlePointerLeave(event: PointerEvent): void {
    this.hoveredBlock = null;
    this.draggedBlock = null;
    this.dragStart = null;
    this.canvas.style.cursor = 'default';
  }

  // Utility to check if a block has any event handlers
  static hasEventHandlers(block: Block): boolean {
    const { props } = block;
    const { onClick, onPointerDown, onPointerUp, onPointerMove, onHover, onDrag } = props;
    return !!(
      onClick ||
      onPointerDown ||
      onPointerUp ||
      onPointerMove ||
      onHover ||
      onDrag
    );
  }
}
