// Event system for handling user interactions
import type { Block } from './types';
import { HitTester, type HitTestResult } from './hit-test';
import { Matrix2D } from './transform';

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
  private dragStart: { x: number; y: number } | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.setupEventListeners();
  }

  setScene(scene: Block): void {
    this.currentScene = scene;
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('pointerdown', this.handlePointerDown.bind(this));
    this.canvas.addEventListener('pointerup', this.handlePointerUp.bind(this));
    this.canvas.addEventListener('pointermove', this.handlePointerMove.bind(this));
    this.canvas.addEventListener('click', this.handleClick.bind(this));
    this.canvas.addEventListener('pointerleave', this.handlePointerLeave.bind(this));
  }

  destroy(): void {
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown.bind(this));
    this.canvas.removeEventListener('pointerup', this.handlePointerUp.bind(this));
    this.canvas.removeEventListener('pointermove', this.handlePointerMove.bind(this));
    this.canvas.removeEventListener('click', this.handleClick.bind(this));
    this.canvas.removeEventListener('pointerleave', this.handlePointerLeave.bind(this));
  }

  private getCanvasCoordinates(event: PointerEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  }

  private createEventData(event: PointerEvent): PointerEventData {
    const coords = this.getCanvasCoordinates(event);
    return {
      x: coords.x,
      y: coords.y,
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
    const hit = HitTester.hitTest(this.currentScene, coords.x, coords.y);

    if (hit && hit.block.props.onClick) {
      hit.block.props.onClick(event);
    }
  }

  private handlePointerDown(event: PointerEvent): void {
    if (!this.currentScene) return;

    const coords = this.getCanvasCoordinates(event);
    const hit = HitTester.hitTest(this.currentScene, coords.x, coords.y);

    if (hit) {
      if (hit.block.props.onPointerDown) {
        hit.block.props.onPointerDown(event);
      }

      // Start drag if handler exists
      if (hit.block.props.onDrag) {
        this.draggedBlock = hit.block;
        this.dragStart = coords;
      }
    }
  }

  private handlePointerUp(event: PointerEvent): void {
    if (!this.currentScene) return;

    const coords = this.getCanvasCoordinates(event);
    const hit = HitTester.hitTest(this.currentScene, coords.x, coords.y);

    if (hit && hit.block.props.onPointerUp) {
      hit.block.props.onPointerUp(event);
    }

    // End drag
    this.draggedBlock = null;
    this.dragStart = null;
  }

  private handlePointerMove(event: PointerEvent): void {
    if (!this.currentScene) return;

    const coords = this.getCanvasCoordinates(event);

    // Handle dragging
    if (this.draggedBlock && this.dragStart && this.draggedBlock.props.onDrag) {
      this.draggedBlock.props.onDrag(event);
    }

    // Handle hover
    const hit = HitTester.hitTest(this.currentScene, coords.x, coords.y);
    const newHoveredBlock = hit ? hit.block : null;

    if (newHoveredBlock !== this.hoveredBlock) {
      // Hover state changed
      if (this.hoveredBlock && this.hoveredBlock.props.onHover) {
        // Trigger hover end (could add onHoverEnd if needed)
      }

      this.hoveredBlock = newHoveredBlock;

      if (this.hoveredBlock && this.hoveredBlock.props.onHover) {
        this.hoveredBlock.props.onHover(event);
      }

      // Update cursor
      this.canvas.style.cursor = this.hoveredBlock ? 'pointer' : 'default';
    }

    // Always trigger pointer move if handler exists
    if (hit && hit.block.props.onPointerMove) {
      hit.block.props.onPointerMove(event);
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
    return !!(
      block.props.onClick ||
      block.props.onPointerDown ||
      block.props.onPointerUp ||
      block.props.onPointerMove ||
      block.props.onHover ||
      block.props.onDrag
    );
  }
}
