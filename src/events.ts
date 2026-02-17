// Copyright (c) 2026 François Rouaix

// Event system for handling user interactions
import { BlockType, type Block } from './core/types.ts';
import { HitTester, type HitTestResult } from './hit-test.ts';
import { Matrix2D } from './transform.ts';

const EMPTY_SCENE: Block = {
  type: BlockType.Group,
  props: {},
  children: []
};

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

type VitrinePointerEvent = PointerEvent & {
  vtrLocalX?: number;
  vtrLocalY?: number;
  vtrWorldX?: number;
  vtrWorldY?: number;
};

export class EventManager {
  private canvas: HTMLCanvasElement;
  private currentScene: Block = EMPTY_SCENE;
  private hoveredBlock: Block | null = null;
  private draggedBlock: Block | null = null;
  private ptcDragStart: { xc: number; yc: number } | null = null;
  private ptcLastPointer: { xc: number; yc: number } | null = null;
  private cameraTransform: Matrix2D = Matrix2D.identity();
  
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

  setCameraTransform(transform: Matrix2D): void {
    this.cameraTransform = transform;
  }

  getLastPointerCanvasPosition(): { xc: number; yc: number } | null {
    return this.ptcLastPointer;
  }

  private convertCanvasToWorldCoordinates(xc: number, yc: number): { x: number; y: number } {
    const inverseCameraTransform = this.cameraTransform.invert();
    const result = inverseCameraTransform 
      ? inverseCameraTransform.transformPoint(xc, yc)
      : { x: xc, y: yc };
    
    // Debug logging
    if (typeof window !== 'undefined' && (window as any).__vitrineDebugHitTest) {
      console.log('Canvas→World:', { canvas: { xc, yc }, world: result, cameraTransform: this.cameraTransform });
    }
    
    return result;
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
    this.currentScene = EMPTY_SCENE;
    this.hoveredBlock = null;
    this.draggedBlock = null;
    this.ptcDragStart = null;
  }

  private getCanvasCoordinates(event: PointerEvent): { xc: number; yc: number } {
    const { canvas } = this;
    const { width: dxcCanvas, height: dycCanvas } = canvas;
    const { left: xwCanvas, top: ywCanvas, width: dxwCanvas, height: dywCanvas } = canvas.getBoundingClientRect();
    const { clientX: xwPointer, clientY: ywPointer } = event;
    const scaleX = dxcCanvas / dxwCanvas;
    const scaleY = dycCanvas / dywCanvas;
    
    return {
      xc: (xwPointer - xwCanvas) * scaleX,
      yc: (ywPointer - ywCanvas) * scaleY
    };
  }

  private createEventData(event: PointerEvent): PointerEventData {
    const { xc, yc } = this.getCanvasCoordinates(event);
    const { button, buttons, ctrlKey, shiftKey, altKey, metaKey } = event;
    return {
      x: xc,
      y: yc,
      button,
      buttons,
      ctrlKey,
      shiftKey,
      altKey,
      metaKey,
      originalEvent: event
    };
  }

  private withPointerHit(
    event: PointerEvent,
    handler: (hit: HitTestResult) => void
  ): void {
    const { currentScene } = this;

    const { xc, yc } = this.getCanvasCoordinates(event);
    const worldCoords = this.convertCanvasToWorldCoordinates(xc, yc);
    const hit = HitTester.hitTest(currentScene, worldCoords.x, worldCoords.y, Matrix2D.identity());
    if (!hit) return;

    this.decoratePointerEvent(event, hit);

    handler(hit);
  }

  private decoratePointerEvent(event: PointerEvent, hit: HitTestResult): void {
    const vitrineEvent = event as VitrinePointerEvent;
    vitrineEvent.vtrLocalX = hit.localX;
    vitrineEvent.vtrLocalY = hit.localY;
    vitrineEvent.vtrWorldX = hit.worldX;
    vitrineEvent.vtrWorldY = hit.worldY;
  }

  private handleClick(event: PointerEvent): void {
    this.withPointerHit(event, (hit) => {
      hit.block.props.onClick?.(event);
    });
  }

  private handlePointerDown(event: PointerEvent): void {
    this.ptcLastPointer = this.getCanvasCoordinates(event);

    this.withPointerHit(event, (hit) => {
      const { block } = hit;
      const { onPointerDown, onDrag } = block.props;
      onPointerDown?.(event);

      // Start drag if handler exists
      if (onDrag) {
        this.draggedBlock = block;
        this.ptcDragStart = { xc: hit.worldX, yc: hit.worldY };
      }
    });
  }

  private handlePointerUp(event: PointerEvent): void {
    this.ptcLastPointer = this.getCanvasCoordinates(event);

    this.withPointerHit(event, (hit) => {
      hit.block.props.onPointerUp?.(event);
    });

    // End drag
    this.draggedBlock = null;
    this.ptcDragStart = null;
  }

  private handlePointerMove(event: PointerEvent): void {
    const { currentScene, draggedBlock, ptcDragStart, canvas } = this;

    const { xc, yc } = this.getCanvasCoordinates(event);
    this.ptcLastPointer = { xc, yc };
    const worldCoords = this.convertCanvasToWorldCoordinates(xc, yc);
    const hit = HitTester.hitTest(currentScene, worldCoords.x, worldCoords.y, Matrix2D.identity());

    if (hit) {
      this.decoratePointerEvent(event, hit);
    }

    // Handle dragging
    if (draggedBlock && ptcDragStart) {
      draggedBlock.props.onDrag?.(event);
    }

    // Handle hover
    const newHoveredBlock = hit ? hit.block : null;
    const { hoveredBlock } = this;

    if (newHoveredBlock !== hoveredBlock) {
      // Hover state changed
      if (hoveredBlock) {
        const { onHover } = hoveredBlock.props;
        if (onHover) {
        // Trigger hover end (could add onHoverEnd if needed)
        }
      }

      this.hoveredBlock = newHoveredBlock;

      if (newHoveredBlock) {
        const { onHover } = newHoveredBlock.props;
        if (onHover) {
          onHover(event);
        }
      }

      // Update cursor
      canvas.style.cursor = newHoveredBlock ? 'pointer' : 'default';
    }

    // Always trigger pointer move if handler exists
    hit?.block.props.onPointerMove?.(event);
  }

  private handlePointerLeave(event: PointerEvent): void {
    this.hoveredBlock = null;
    this.draggedBlock = null;
    this.ptcDragStart = null;
    this.ptcLastPointer = null;
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
