// Copyright (c) 2026 François Rouaix

// Text selection manager for VitrineComponent
// Tracks selections across text/texta blocks and manages selection state.

import type { Selection, Block } from 'vitrine';
import { rectangle, portal, group } from 'vitrine';
import type { CharacterBounds } from 'vitrine';

/** Configuration for selection rendering. */
export interface SelectionRenderConfig {
  /** Whether to auto-render selections. Defaults to true. */
  enabled?: boolean;
  /** Caret color. Defaults to '#000'. */
  caretColor?: string;
  /** Selection highlight color. Defaults to 'rgba(0, 0, 255, 0.2)'. */
  selectionColor?: string;
  /** Caret stroke width. Defaults to 2. */
  caretWidth?: number;
  /** Enable internal selection geometry debug logs. Defaults to false. */
  debug?: boolean;
  /** Optional debug logger; defaults to console.debug when debug is enabled. */
  debugLogger?: (...args: unknown[]) => void;
}

/**
 * Provides character bounds in scene/CSS coordinates for a text block.
 *
 * Contract:
 * - `charIndex` refers to a character position in the block's text.
 * - Returned bounds must use the same coordinate space as rendered block positions.
 * - Return `null` when the index is out of range for the block.
 */
export type CharacterBoundsProvider = (blockId: string, charIndex: number) => CharacterBounds | null;

interface InsertionPoint {
  index: number;
  x: number;
  y: number;
  height: number;
}

interface LineGroup {
  y: number;
  height: number;
  points: Array<{ index: number; x: number }>;
}

interface RangeRect {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

interface BlockInsertionGeometry {
  points: InsertionPoint[];
  pointByIndex: Map<number, InsertionPoint>;
}

/** Text selection manager for a VitrineComponent instance. */
export class TextSelectionManager {
  private selections: Map<string, Selection> = new Map();
  private lastLoggedGeometry: Map<string, string> = new Map();
  private preferredXBySelection: Map<string, number> = new Map();
  private renderConfig: SelectionRenderConfig;
  private isDragging: boolean = false;
  private dragStartBlockId: string | null = null;
  private dragStartCharIndex: number | null = null;
  private characterBoundsProvider: CharacterBoundsProvider | null = null;
  private insertionGeometryByBlock: Map<string, BlockInsertionGeometry> = new Map();

  constructor(config: SelectionRenderConfig = {}) {
    this.renderConfig = {
      enabled: config.enabled ?? true,
      caretColor: config.caretColor ?? '#000',
      selectionColor: config.selectionColor ?? 'rgba(0, 0, 255, 0.2)',
      caretWidth: config.caretWidth ?? 2,
      debug: config.debug ?? false,
      debugLogger: config.debugLogger
    };
  }

  private debugLog(...args: unknown[]): void {
    if (!this.renderConfig.debug) {
      return;
    }
    const debugLogger = this.renderConfig.debugLogger ?? console.debug.bind(console);
    debugLogger(...args);
  }

  private getSelectionKey(userId?: string): string {
    return userId ?? 'default';
  }

  /**
   * Set a selection for a specific block and optional user.
   * If userId is not provided, uses a default key.
   */
  setSelection(blockId: string, anchor: number, focus: number, userId?: string): void {
    const key = this.getSelectionKey(userId);
    this.selections.set(key, {
      blockId,
      anchor,
      focus,
      userId
    });
  }

  /**
   * Get selection for a user (or default user if userId not provided).
   */
  getSelection(userId?: string): Selection | undefined {
    const key = this.getSelectionKey(userId);
    return this.selections.get(key);
  }

  /**
   * Get all active selections.
   */
  getAllSelections(): Selection[] {
    return Array.from(this.selections.values());
  }

  /**
   * Clear selection for a user.
   */
  clearSelection(userId?: string): void {
    const key = this.getSelectionKey(userId);
    this.selections.delete(key);
    this.lastLoggedGeometry.delete(key);
    this.preferredXBySelection.delete(key);
  }

  /**
   * Clear all selections.
   */
  clearAllSelections(): void {
    this.selections.clear();
    this.lastLoggedGeometry.clear();
    this.preferredXBySelection.clear();
  }

  /**
   * Get render configuration.
   */
  getRenderConfig(): SelectionRenderConfig {
    return { ...this.renderConfig };
  }

  /**
   * Update render configuration.
   */
  setRenderConfig(config: Partial<SelectionRenderConfig>): void {
    this.renderConfig = { ...this.renderConfig, ...config };
  }

  /**
   * Check if selection rendering is enabled.
   */
  isRenderingEnabled(): boolean {
    return this.renderConfig.enabled ?? true;
  }

  /**
   * Set the function that provides character bounds for rendering/hit-testing.
   * VitrineComponent provides this automatically for standard `text` blocks.
   * Call this to override the default provider or to support custom text rendering.
   */
  setCharacterBoundsProvider(provider: CharacterBoundsProvider): void {
    if (this.characterBoundsProvider !== provider) {
      this.insertionGeometryByBlock.clear();
    }
    this.characterBoundsProvider = provider;
  }

  private queryInsertionBounds(blockId: string, index: number): CharacterBounds | null {
    if (!this.characterBoundsProvider) {
      return null;
    }

    const direct = this.characterBoundsProvider(blockId, index);
    if (direct) {
      return {
        x: direct.x,
        y: direct.y,
        width: 0,
        height: direct.height
      };
    }

    if (index > 0) {
      const prev = this.characterBoundsProvider(blockId, index - 1);
      if (prev) {
        return {
          x: prev.x + prev.width,
          y: prev.y,
          width: 0,
          height: prev.height
        };
      }
    }

    return null;
  }

  private buildBlockInsertionGeometry(blockId: string): BlockInsertionGeometry {
    const points: InsertionPoint[] = [];
    const pointByIndex = new Map<number, InsertionPoint>();
    let missStreak = 0;
    const maxProbe = 20000;

    for (let index = 0; index <= maxProbe; index++) {
      const bounds = this.queryInsertionBounds(blockId, index);
      if (!bounds) {
        missStreak++;
        if (missStreak >= 8) {
          break;
        }
        continue;
      }

      missStreak = 0;
      const point = this.toInsertionPoint(index, bounds);
      points.push(point);
      pointByIndex.set(index, point);
    }

    return { points, pointByIndex };
  }

  private getBlockInsertionGeometry(blockId: string): BlockInsertionGeometry {
    const geometry = this.insertionGeometryByBlock.get(blockId);
    if (geometry) {
      return geometry;
    }
    const nextGeometry = this.buildBlockInsertionGeometry(blockId);
    this.insertionGeometryByBlock.set(blockId, nextGeometry);
    return nextGeometry;
  }

  private getInsertionBounds(blockId: string, index: number): CharacterBounds | null {
    const point = this.getInsertionPoint(blockId, index);
    if (!point) {
      return null;
    }
    return {
      x: point.x,
      y: point.y,
      width: 0,
      height: point.height
    };
  }

  private toInsertionPoint(index: number, bounds: CharacterBounds): InsertionPoint {
    return {
      index,
      x: bounds.x,
      y: bounds.y,
      height: bounds.height
    };
  }

  private getInsertionPoint(blockId: string, index: number): InsertionPoint | null {
    const { pointByIndex } = this.getBlockInsertionGeometry(blockId);
    return pointByIndex.get(index) ?? null;
  }

  private collectInsertionPointsInRange(blockId: string, start: number, end: number): InsertionPoint[] {
    const { points } = this.getBlockInsertionGeometry(blockId);
    return points.filter((point) => point.index >= start && point.index <= end);
  }

  private groupInsertionPointsByLine(points: InsertionPoint[], lineTolerance: number = 0.5): LineGroup[] {
    const lineGroups: LineGroup[] = [];
    for (const point of points) {
      const lineGroup = lineGroups.find((line) =>
        Math.abs(line.y - point.y) <= lineTolerance
        && Math.abs(line.height - point.height) <= lineTolerance
      );
      if (lineGroup) {
        lineGroup.points.push({ index: point.index, x: point.x });
        continue;
      }
      lineGroups.push({
        y: point.y,
        height: point.height,
        points: [{ index: point.index, x: point.x }]
      });
    }
    return lineGroups;
  }

  private createRangeRectsFromLineGroups(lineGroups: LineGroup[]): RangeRect[] {
    return lineGroups
      .filter((lineGroup) => lineGroup.points.length >= 2)
      .map((lineGroup) => {
        const pointsSorted = [...lineGroup.points].sort((a, b) => a.index - b.index);
        const xStart = pointsSorted[0]!.x;
        const xEnd = pointsSorted[pointsSorted.length - 1]!.x;
        return {
          x: Math.min(xStart, xEnd),
          y: lineGroup.y,
          dx: Math.max(1, Math.abs(xEnd - xStart)),
          dy: lineGroup.height
        };
      });
  }

  private buildRangeRects(
    blockId: string,
    start: number,
    end: number
  ): RangeRect[] {
    const insertionPoints = this.collectInsertionPointsInRange(blockId, start, end);
    if (insertionPoints.length < 2) {
      return [];
    }
    const lineGroups = this.groupInsertionPointsByLine(insertionPoints);
    return this.createRangeRectsFromLineGroups(lineGroups);
  }

  private collectInsertionPoints(blockId: string): InsertionPoint[] {
    const { points } = this.getBlockInsertionGeometry(blockId);
    return points;
  }

  /** Returns the largest known insertion index for a block from current bounds provider data. */
  getTextLengthForBlock(blockId: string): number {
    const points = this.collectInsertionPoints(blockId);
    if (points.length === 0) {
      return 0;
    }
    return Math.max(...points.map((point) => point.index));
  }

  private findCurrentLineIndex(lineGroups: LineGroup[], index: number, currentY: number): number {
    const lineIndex = lineGroups.findIndex((lineGroup) =>
      lineGroup.points.some((point) => point.index === index)
    );
    if (lineIndex >= 0) {
      return lineIndex;
    }
    return lineGroups.reduce((bestIdx, lineGroup, idx) => {
      const bestDistance = Math.abs(lineGroups[bestIdx]!.y - currentY);
      const distance = Math.abs(lineGroup.y - currentY);
      return distance < bestDistance ? idx : bestIdx;
    }, 0);
  }

  private getNearestPointByX(points: Array<{ index: number; x: number }>, desiredX: number): { index: number; x: number } {
    let bestPoint = points[0]!;
    let bestDistance = Math.abs(bestPoint.x - desiredX);
    for (const point of points) {
      const distance = Math.abs(point.x - desiredX);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestPoint = point;
      }
    }
    return bestPoint;
  }

  private moveVerticalInsertion(blockId: string, index: number, direction: -1 | 1, selectionKey: string): number | null {
    const points = this.collectInsertionPoints(blockId);
    const current = points.find((point) => point.index === index);
    if (!current) {
      return null;
    }

    const lineGroups = this.groupInsertionPointsByLine(points)
      .map((lineGroup) => ({
        ...lineGroup,
        points: [...lineGroup.points].sort((a, b) => a.index - b.index)
      }))
      .sort((a, b) => a.y - b.y);
    if (lineGroups.length <= 1) {
      return index;
    }

    const currentLineIndex = this.findCurrentLineIndex(lineGroups, index, current.y);
    const targetLineIndex = currentLineIndex + direction;
    if (targetLineIndex < 0 || targetLineIndex >= lineGroups.length) {
      return index;
    }

    const desiredX = this.preferredXBySelection.get(selectionKey) ?? current.x;
    const targetLine = lineGroups[targetLineIndex]!;
    return this.getNearestPointByX(targetLine.points, desiredX).index;
  }

  private setCaretSelection(blockId: string, position: number, userId?: string): void {
    this.setSelection(blockId, position, position, userId);
  }

  private setFocusSelection(blockId: string, anchor: number, focus: number, userId?: string): void {
    this.setSelection(blockId, anchor, focus, userId);
  }

  /**
   * Build overlay blocks for all active selections.
   * Returns a Portal block containing caret/highlight blocks.
   * Returns null if rendering is disabled or no selections exist.
   */
  buildSelectionOverlays(): Block | null {
    if (!this.isRenderingEnabled() || this.selections.size === 0 || !this.characterBoundsProvider) {
      return null;
    }

    const overlayChildren: Block[] = [];

    for (const [selectionKey, sel] of this.selections.entries()) {
      const isCaret = sel.anchor === sel.focus;

      if (isCaret) {
        const caretBounds = this.getInsertionBounds(sel.blockId, sel.anchor);
        if (caretBounds) {
          const logSignature = `caret:${sel.blockId}:${sel.anchor}:${caretBounds.x}:${caretBounds.y}:${caretBounds.height}`;
          if (this.renderConfig.debug && this.lastLoggedGeometry.get(selectionKey) !== logSignature) {
            this.lastLoggedGeometry.set(selectionKey, logSignature);
            this.debugLog('[TextSelectionManager] Caret geometry', {
              blockId: sel.blockId,
              index: sel.anchor,
              x: caretBounds.x,
              y: caretBounds.y,
              height: caretBounds.height
            });
          }
          const caretBlock = rectangle(
            {
              x: caretBounds.x - (this.renderConfig.caretWidth ?? 1) / 2,
              y: caretBounds.y,
              dx: this.renderConfig.caretWidth ?? 1,
              dy: caretBounds.height,
              fill: sel.color ?? this.renderConfig.caretColor ?? '#000'
            },
            []
          );
          overlayChildren.push(caretBlock);
        }
      } else {
        const start = Math.min(sel.anchor, sel.focus);
        const end = Math.max(sel.anchor, sel.focus);
        const rangeRects = this.buildRangeRects(sel.blockId, start, end);

        if (rangeRects.length > 0) {
          const logSignature = `range:${sel.blockId}:${start}:${end}:${JSON.stringify(rangeRects)}`;
          if (this.renderConfig.debug && this.lastLoggedGeometry.get(selectionKey) !== logSignature) {
            this.lastLoggedGeometry.set(selectionKey, logSignature);
            this.debugLog('[TextSelectionManager] Range geometry', {
              blockId: sel.blockId,
              start,
              end,
              rects: rangeRects
            });
          }

          for (const rangeRect of rangeRects) {
            const highlightBlock = rectangle(
              {
                x: rangeRect.x,
                y: rangeRect.y,
                dx: rangeRect.dx,
                dy: rangeRect.dy,
                fill: sel.color ?? this.renderConfig.selectionColor ?? 'rgba(0, 0, 255, 0.2)'
              },
              []
            );
            overlayChildren.push(highlightBlock);
          }
        }
      }
    }

    if (overlayChildren.length === 0) {
      return null;
    }

    return portal(
      {
        visible: true
      },
      overlayChildren.length === 1
        ? [overlayChildren[0]!]
        : [group({}, overlayChildren)]
    );
  }

  /**
   * Handle pointer down: start or update selection.
   * charIndex: character index where pointer down occurred (result of hit-testing).
   * blockId: ID of the text block under the pointer.
   */
  handlePointerDown(blockId: string, charIndex: number, userId?: string): void {
    const selectionKey = this.getSelectionKey(userId);
    this.preferredXBySelection.delete(selectionKey);
    this.isDragging = true;
    this.dragStartBlockId = blockId;
    this.dragStartCharIndex = charIndex;

    // Place caret at click position
    this.setCaretSelection(blockId, charIndex, userId);
  }

  /**
   * Handle pointer move: extend selection during drag.
   * charIndex: character index under the pointer.
   * userId: optional user ID.
   */
  handlePointerMove(charIndex: number, userId?: string): void {
    if (!this.isDragging || this.dragStartCharIndex === null || this.dragStartBlockId === null) {
      return;
    }

    const sel = this.getSelection(userId);
    if (!sel || sel.blockId !== this.dragStartBlockId) {
      return;
    }

    // Extend selection from anchor to current position
    const anchor = Math.min(this.dragStartCharIndex, charIndex);
    const focus = Math.max(this.dragStartCharIndex, charIndex);

    this.setFocusSelection(this.dragStartBlockId, anchor, focus, userId);
  }

  /**
   * Handle pointer up: end drag operation.
   */
  handlePointerUp(): void {
    this.isDragging = false;
    this.dragStartBlockId = null;
    this.dragStartCharIndex = null;
  }

  /**
   * Hit-test within a specific block.
   * blockId: the text block to test
   * x, y: screen coordinates
   * maxChars: optional maximum characters in the block.
   * Returns insertion index (caret position) or null if no hit.
   */
  hitTestBlockCharacter(blockId: string, x: number, y: number, maxChars?: number): number | null {
    const points = this.collectInsertionPoints(blockId);
    if (points.length === 0) {
      return null;
    }

    const dxHitPadding = 6;
    const lineGroups = this.groupInsertionPointsByLine(points)
      .map((lineGroup) => ({
        ...lineGroup,
        points: [...lineGroup.points].sort((a, b) => a.index - b.index)
      }))
      .sort((a, b) => a.y - b.y);

    for (const lineGroup of lineGroups) {
      const isInVerticalRange = y >= lineGroup.y && y < lineGroup.y + lineGroup.height;
      if (!isInVerticalRange) {
        continue;
      }
      if (maxChars !== undefined) {
        const pointsWithinLimit = lineGroup.points.filter((point) => point.index <= maxChars);
        if (pointsWithinLimit.length === 0) {
          continue;
        }
        const xMinRow = Math.min(...pointsWithinLimit.map((point) => point.x));
        const xMaxRow = Math.max(...pointsWithinLimit.map((point) => point.x));
        if (x < xMinRow - dxHitPadding || x > xMaxRow + dxHitPadding) {
          return null;
        }
        return this.getNearestPointByX(pointsWithinLimit, x).index;
      }

      const xMinRow = Math.min(...lineGroup.points.map((point) => point.x));
      const xMaxRow = Math.max(...lineGroup.points.map((point) => point.x));
      if (x < xMinRow - dxHitPadding || x > xMaxRow + dxHitPadding) {
        return null;
      }
      return this.getNearestPointByX(lineGroup.points, x).index;
    }

    return null;
  }

  /**
   * Handle keyboard event for selection navigation and editing.
   * Returns whether the key was handled.
   */
  private handleHorizontalArrowKey(
    key: 'ArrowLeft' | 'ArrowRight',
    selection: Selection,
    shiftKey: boolean,
    textLength: number,
    userId?: string
  ): boolean {
    if (shiftKey) {
      if (key === 'ArrowLeft') {
        const focus = selection.focus > 0 ? selection.focus - 1 : selection.focus;
        this.setFocusSelection(selection.blockId, selection.anchor, focus, userId);
        return true;
      }
      const focus = selection.focus < textLength ? selection.focus + 1 : selection.focus;
      this.setFocusSelection(selection.blockId, selection.anchor, focus, userId);
      return true;
    }

    if (key === 'ArrowLeft') {
      const newPos = selection.focus < selection.anchor ? selection.anchor - 1 : selection.focus - 1;
      if (newPos >= 0) {
        this.setCaretSelection(selection.blockId, newPos, userId);
      }
      return true;
    }

    const newPos = selection.focus > selection.anchor ? selection.focus + 1 : selection.anchor + 1;
    if (newPos <= textLength) {
      this.setCaretSelection(selection.blockId, newPos, userId);
    }
    return true;
  }

  private getVerticalSourceIndex(selection: Selection, direction: -1 | 1, shiftKey: boolean): number {
    if (shiftKey || selection.anchor === selection.focus) {
      return selection.focus;
    }
    return direction < 0
      ? Math.min(selection.anchor, selection.focus)
      : Math.max(selection.anchor, selection.focus);
  }

  private ensurePreferredX(selection: Selection, sourceIndex: number, selectionKey: string): void {
    const sourceBounds = this.getInsertionBounds(selection.blockId, sourceIndex);
    if (sourceBounds && !this.preferredXBySelection.has(selectionKey)) {
      this.preferredXBySelection.set(selectionKey, sourceBounds.x);
    }
  }

  private handleVerticalArrowKey(
    key: 'ArrowUp' | 'ArrowDown',
    selection: Selection,
    shiftKey: boolean,
    selectionKey: string,
    userId?: string
  ): boolean {
    const direction: -1 | 1 = key === 'ArrowUp' ? -1 : 1;
    const sourceIndex = this.getVerticalSourceIndex(selection, direction, shiftKey);
    this.ensurePreferredX(selection, sourceIndex, selectionKey);

    const targetIndex = this.moveVerticalInsertion(selection.blockId, sourceIndex, direction, selectionKey);
    if (targetIndex === null) {
      return true;
    }

    if (shiftKey) {
      this.setFocusSelection(selection.blockId, selection.anchor, targetIndex, userId);
      return true;
    }

    this.setCaretSelection(selection.blockId, targetIndex, userId);
    return true;
  }

  private handleBoundaryNavigationKey(
    key: 'Home' | 'End',
    selection: Selection,
    shiftKey: boolean,
    textLength: number,
    userId?: string
  ): boolean {
    const target = key === 'Home' ? 0 : textLength;
    if (shiftKey) {
      this.setFocusSelection(selection.blockId, selection.anchor, target, userId);
      return true;
    }
    this.setCaretSelection(selection.blockId, target, userId);
    return true;
  }

  handleKeyDown(key: string, shiftKey: boolean, ctrlKey: boolean, userId?: string): boolean {
    const selection = this.getSelection(userId);
    if (!selection) {
      return false;
    }

    const selectionKey = this.getSelectionKey(userId);
    const textLength = this.getTextLengthForBlock(selection.blockId);

    switch (key) {
      case 'ArrowLeft':
      case 'ArrowRight': {
        this.preferredXBySelection.delete(selectionKey);
        return this.handleHorizontalArrowKey(key, selection, shiftKey, textLength, userId);
      }
      case 'ArrowUp':
      case 'ArrowDown': {
        return this.handleVerticalArrowKey(key, selection, shiftKey, selectionKey, userId);
      }
      case 'Home':
      case 'End': {
        this.preferredXBySelection.delete(selectionKey);
        return this.handleBoundaryNavigationKey(key, selection, shiftKey, textLength, userId);
      }
      case 'a': {
        this.preferredXBySelection.delete(selectionKey);
        if (ctrlKey) {
          this.setSelection(selection.blockId, 0, textLength, userId);
          return true;
        }
        return false;
      }
      default:
        return false;
    }
  }
}
