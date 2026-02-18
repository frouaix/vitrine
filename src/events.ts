// Copyright (c) 2026 François Rouaix

// Event system for handling user interactions
import { BlockType, type Block, type VitrinePointerEvent } from './core/types.ts';
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

export class EventManager {
  private canvas: HTMLCanvasElement;
  private currentScene: Block = EMPTY_SCENE;
  private portalBlocks: Block[] = [];
  private hoveredBlock: Block | null = null;
  private draggedBlock: Block | null = null;
  private ptcDragStart: { xc: number; yc: number } | null = null;
  private ptcLastPointer: { xc: number; yc: number } | null = null;
  private pixelRatio: number = 1;
  private sceneTransform: Matrix2D = Matrix2D.identity();
  
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

  setPortalBlocks(portals: Block[]): void {
    this.portalBlocks = portals;
  }

  setCameraTransform(transform: Matrix2D): void {
    this.sceneTransform = transform;
  }

  setPixelRatio(ratio: number): void {
    this.pixelRatio = ratio;
  }

  getLastPointerCanvasPosition(): { xc: number; yc: number } | null {
    return this.ptcLastPointer;
  }

  /**
   * Convert canvas buffer coordinates to logical coordinates (pixelRatio only).
   * Used for hit testing — the camera group in the scene tree handles camera inverse.
   */
  private convertCanvasToLogicalCoordinates(xc: number, yc: number): { x: number; y: number } {
    return { x: xc / this.pixelRatio, y: yc / this.pixelRatio };
  }

  /**
   * Convert canvas buffer coordinates to scene coordinates (pixelRatio + camera inverse).
   * Used for xs, ys on VitrinePointerEvent — stable coords inside the camera group.
   */
  private convertCanvasToSceneCoordinates(xc: number, yc: number): { x: number; y: number } {
    const inverse = this.sceneTransform.invert();
    return inverse
      ? inverse.transformPoint(xc, yc)
      : { x: xc / this.pixelRatio, y: yc / this.pixelRatio };
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
    const { xc, yc } = this.getCanvasCoordinates(event);
    const logicalCoords = this.convertCanvasToLogicalCoordinates(xc, yc);
    const sceneCoords = this.convertCanvasToSceneCoordinates(xc, yc);
    
    // Test portals first (reverse order = top to bottom z-order)
    for (let i = this.portalBlocks.length - 1; i >= 0; i--) {
      const hit = HitTester.hitTest(
        this.portalBlocks[i],
        logicalCoords.x,
        logicalCoords.y,
        Matrix2D.identity()
      );
      if (hit) {
        hit.xs = sceneCoords.x;
        hit.ys = sceneCoords.y;
        this.decoratePointerEvent(event, hit);
        handler(hit);
        return; // Portal captured event, don't test main scene
      }
    }
    
    // No portal hit, test main scene
    const hit = HitTester.hitTest(
      this.currentScene,
      logicalCoords.x,
      logicalCoords.y,
      Matrix2D.identity()
    );
    if (hit) {
      hit.xs = sceneCoords.x;
      hit.ys = sceneCoords.y;
      this.decoratePointerEvent(event, hit);
      handler(hit);
    }
  }

  private decoratePointerEvent(event: PointerEvent, hit: HitTestResult): void {
    const vitrineEvent = event as VitrinePointerEvent;
    vitrineEvent.xl = hit.xl;
    vitrineEvent.yl = hit.yl;
    vitrineEvent.xs = hit.xs;
    vitrineEvent.ys = hit.ys;
  }

  private decoratePointerEventSceneOnly(event: PointerEvent, xs: number, ys: number): void {
    const vitrineEvent = event as VitrinePointerEvent;
    vitrineEvent.xs = xs;
    vitrineEvent.ys = ys;
  }

  /**
   * Find the nearest block with a given handler, checking the hit block first then ancestors.
   */
  private static findBlockWithHandler(hit: HitTestResult, handlerKey: keyof Block['props']): Block | null {
    if (hit.block.props[handlerKey]) return hit.block;
    for (let i = hit.ancestors.length - 1; i >= 0; i--) {
      if (hit.ancestors[i].props[handlerKey]) return hit.ancestors[i];
    }
    return null;
  }

  private handleClick(event: PointerEvent): void {
    this.withPointerHit(event, (hit) => {
      const target = EventManager.findBlockWithHandler(hit, 'onClick');
      target?.props.onClick?.(event as VitrinePointerEvent);
    });
  }

  private handlePointerDown(event: PointerEvent): void {
    this.ptcLastPointer = this.getCanvasCoordinates(event);

    this.withPointerHit(event, (hit) => {
      const downTarget = EventManager.findBlockWithHandler(hit, 'onPointerDown');
      downTarget?.props.onPointerDown?.(event as VitrinePointerEvent);

      // Start drag — find nearest ancestor with onDrag
      const dragTarget = EventManager.findBlockWithHandler(hit, 'onDrag');
      if (dragTarget) {
        this.draggedBlock = dragTarget;
        this.ptcDragStart = { xc: hit.xs, yc: hit.ys };
      }
    });
  }

  private handlePointerUp(event: PointerEvent): void {
    this.ptcLastPointer = this.getCanvasCoordinates(event);

    this.withPointerHit(event, (hit) => {
      const target = EventManager.findBlockWithHandler(hit, 'onPointerUp');
      target?.props.onPointerUp?.(event as VitrinePointerEvent);
    });

    // End drag
    this.draggedBlock = null;
    this.ptcDragStart = null;
  }

  private handlePointerMove(event: PointerEvent): void {
    const { draggedBlock, ptcDragStart, canvas } = this;

    const { xc, yc } = this.getCanvasCoordinates(event);
    this.ptcLastPointer = { xc, yc };
    const logicalCoords = this.convertCanvasToLogicalCoordinates(xc, yc);
    const sceneCoords = this.convertCanvasToSceneCoordinates(xc, yc);
    
    // Layer-aware hit testing (portals first, then main scene)
    let hit: HitTestResult | null = null;
    for (let i = this.portalBlocks.length - 1; i >= 0; i--) {
      hit = HitTester.hitTest(
        this.portalBlocks[i],
        logicalCoords.x,
        logicalCoords.y,
        Matrix2D.identity()
      );
      if (hit) break;
    }
    
    if (!hit) {
      hit = HitTester.hitTest(
        this.currentScene,
        logicalCoords.x,
        logicalCoords.y,
        Matrix2D.identity()
      );
    }

    if (hit) {
      hit.xs = sceneCoords.x;
      hit.ys = sceneCoords.y;
      this.decoratePointerEvent(event, hit);
    }

    // Handle dragging — always set scene coordinates even if hit block differs
    if (draggedBlock && ptcDragStart) {
      this.decoratePointerEventSceneOnly(event, sceneCoords.x, sceneCoords.y);
      draggedBlock.props.onDrag?.(event as VitrinePointerEvent);
    }

    // Handle hover — bubble to nearest ancestor with onHover
    const hoverTarget = hit ? EventManager.findBlockWithHandler(hit, 'onHover') : null;
    const { hoveredBlock } = this;

    if (hoverTarget !== hoveredBlock) {
      this.hoveredBlock = hoverTarget;

      if (hoverTarget) {
        hoverTarget.props.onHover?.(event as VitrinePointerEvent);
      }

      // Update cursor — show pointer if any ancestor has interactive handlers
      const fInteractive = hit ? (
        EventManager.findBlockWithHandler(hit, 'onClick') !== null ||
        EventManager.findBlockWithHandler(hit, 'onDrag') !== null ||
        hoverTarget !== null
      ) : false;
      canvas.style.cursor = fInteractive ? 'pointer' : 'default';
    }

    // Bubble pointer move to nearest ancestor with handler
    if (hit) {
      const moveTarget = EventManager.findBlockWithHandler(hit, 'onPointerMove');
      moveTarget?.props.onPointerMove?.(event as VitrinePointerEvent);
    }
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
