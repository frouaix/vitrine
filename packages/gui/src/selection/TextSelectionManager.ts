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
  /** Caret stroke width. Defaults to 1. */
  caretWidth?: number;
}

/** Function that provides character bounds for hit-testing and rendering. */
export type CharacterBoundsProvider = (blockId: string, charIndex: number) => CharacterBounds | null;

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

  constructor(config: SelectionRenderConfig = {}) {
    this.renderConfig = {
      enabled: config.enabled ?? true,
      caretColor: config.caretColor ?? '#000',
      selectionColor: config.selectionColor ?? 'rgba(0, 0, 255, 0.2)',
      caretWidth: config.caretWidth ?? 2
    };
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
   * This is called by VitrineComponent to provide layout information.
   */
  setCharacterBoundsProvider(provider: CharacterBoundsProvider): void {
    this.characterBoundsProvider = provider;
  }

  private getInsertionBounds(blockId: string, index: number): CharacterBounds | null {
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

  private buildRangeRects(
    blockId: string,
    start: number,
    end: number
  ): Array<{ x: number; y: number; dx: number; dy: number }> {
    const insertionPoints: Array<{ index: number; x: number; y: number; height: number }> = [];
    for (let i = start; i <= end; i++) {
      const bounds = this.getInsertionBounds(blockId, i);
      if (!bounds) {
        continue;
      }
      insertionPoints.push({
        index: i,
        x: bounds.x,
        y: bounds.y,
        height: bounds.height
      });
    }

    if (insertionPoints.length < 2) {
      return [];
    }

    const duLineTolerance = 0.5;
    const lineGroups: Array<{ y: number; height: number; points: Array<{ index: number; x: number }> }> = [];
    for (const point of insertionPoints) {
      const group = lineGroups.find((lineGroup) =>
        Math.abs(lineGroup.y - point.y) <= duLineTolerance
        && Math.abs(lineGroup.height - point.height) <= duLineTolerance
      );
      if (group) {
        group.points.push({ index: point.index, x: point.x });
      } else {
        lineGroups.push({
          y: point.y,
          height: point.height,
          points: [{ index: point.index, x: point.x }]
        });
      }
    }

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

  private collectInsertionPoints(blockId: string): Array<{ index: number; x: number; y: number; height: number }> {
    const points: Array<{ index: number; x: number; y: number; height: number }> = [];
    let missStreak = 0;
    const maxProbe = 20000;

    for (let i = 0; i <= maxProbe; i++) {
      const bounds = this.getInsertionBounds(blockId, i);
      if (!bounds) {
        missStreak++;
        if (missStreak >= 8) {
          break;
        }
        continue;
      }

      missStreak = 0;
      points.push({
        index: i,
        x: bounds.x,
        y: bounds.y,
        height: bounds.height
      });
    }

    return points;
  }

  private getTextLength(blockId: string): number {
    const points = this.collectInsertionPoints(blockId);
    if (points.length === 0) {
      return 0;
    }
    return Math.max(...points.map((point) => point.index));
  }

  private moveVerticalInsertion(
    blockId: string,
    index: number,
    direction: -1 | 1,
    selectionKey: string
  ): number | null {
    const points = this.collectInsertionPoints(blockId);
    if (points.length === 0) {
      return null;
    }

    const current = points.find((point) => point.index === index);
    if (!current) {
      return null;
    }

    const lineTolerance = 0.5;
    const lineGroups: Array<{ y: number; height: number; points: Array<{ index: number; x: number }> }> = [];
    for (const point of points) {
      const lineGroup = lineGroups.find((line) =>
        Math.abs(line.y - point.y) <= lineTolerance
        && Math.abs(line.height - point.height) <= lineTolerance
      );
      if (lineGroup) {
        lineGroup.points.push({ index: point.index, x: point.x });
      } else {
        lineGroups.push({
          y: point.y,
          height: point.height,
          points: [{ index: point.index, x: point.x }]
        });
      }
    }

    if (lineGroups.length <= 1) {
      return index;
    }

    lineGroups.sort((a, b) => a.y - b.y);
    for (const lineGroup of lineGroups) {
      lineGroup.points.sort((a, b) => a.index - b.index);
    }

    let currentLineIndex = lineGroups.findIndex((lineGroup) =>
      lineGroup.points.some((point) => point.index === index)
    );
    if (currentLineIndex < 0) {
      currentLineIndex = lineGroups.reduce((bestIdx, lineGroup, idx) => {
        const bestDistance = Math.abs(lineGroups[bestIdx]!.y - current.y);
        const distance = Math.abs(lineGroup.y - current.y);
        return distance < bestDistance ? idx : bestIdx;
      }, 0);
    }

    const targetLineIndex = currentLineIndex + direction;
    if (targetLineIndex < 0 || targetLineIndex >= lineGroups.length) {
      return index;
    }

    const desiredX = this.preferredXBySelection.get(selectionKey) ?? current.x;
    const targetLine = lineGroups[targetLineIndex]!;
    let bestPoint = targetLine.points[0]!;
    let bestDistance = Math.abs(bestPoint.x - desiredX);

    for (const point of targetLine.points) {
      const distance = Math.abs(point.x - desiredX);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestPoint = point;
      }
    }

    return bestPoint.index;
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
          if (this.lastLoggedGeometry.get(selectionKey) !== logSignature) {
            this.lastLoggedGeometry.set(selectionKey, logSignature);
            console.debug('[TextSelectionManager] Caret geometry', {
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
          if (this.lastLoggedGeometry.get(selectionKey) !== logSignature) {
            this.lastLoggedGeometry.set(selectionKey, logSignature);
            console.debug('[TextSelectionManager] Range geometry', {
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
    this.setSelection(blockId, charIndex, charIndex, userId);
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

    this.setSelection(this.dragStartBlockId, anchor, focus, userId);
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
   * Hit-test to find character at given coordinates.
   * Uses CharacterBoundsProvider to find the closest character.
   * Returns { blockId, charIndex } or null if no hit.
   */
  hitTestCharacter(x: number, y: number): { blockId: string; charIndex: number } | null {
    if (!this.characterBoundsProvider) {
      return null;
    }

    // Try to find which character this position belongs to
    // We iterate through possible character indices and use CharacterBoundsProvider
    // This is a brute-force approach; production could optimize with spatial indexing
    
    // For now, we need to know which block to test
    // Since we don't have block geometry here, we rely on the caller to provide blockId
    // This method should typically be called per-block
    return null;
  }

  /**
   * Hit-test within a specific block.
   * blockId: the text block to test
   * x, y: screen coordinates
   * maxChars: maximum characters in the block (for bounds checking)
   * Returns insertion index (caret position) or null if no hit.
   */
  hitTestBlockCharacter(blockId: string, x: number, y: number, maxChars: number): number | null {
    if (!this.characterBoundsProvider) {
      return null;
    }

    const dxHitPadding = 6;
    let lastCharIndexInRow: number | null = null;
    let xMinRow = Infinity;
    let xMaxRow = -Infinity;

    for (let i = 0; i < maxChars; i++) {
      const bounds = this.characterBoundsProvider(blockId, i);
      if (!bounds) continue;

      const isInVerticalRange = y >= bounds.y && y < bounds.y + bounds.height;
      if (!isInVerticalRange) continue;

      xMinRow = Math.min(xMinRow, bounds.x);
      xMaxRow = Math.max(xMaxRow, bounds.x + bounds.width);

      const midpointX = bounds.x + bounds.width / 2;
      if (x < midpointX) {
        if (x < xMinRow - dxHitPadding || x > xMaxRow + dxHitPadding) {
          return null;
        }
        return i;
      }

      lastCharIndexInRow = i;
    }

    if (lastCharIndexInRow !== null) {
      if (x < xMinRow - dxHitPadding || x > xMaxRow + dxHitPadding) {
        return null;
      }
      return lastCharIndexInRow + 1;
    }

    return null;
  }

  /**
   * Handle keyboard event for selection navigation and editing.
   * Returns whether the key was handled.
   */
  handleKeyDown(key: string, shiftKey: boolean, ctrlKey: boolean, userId?: string): boolean {
    const sel = this.getSelection(userId);
    if (!sel) {
      return false;
    }

    const selectionKey = this.getSelectionKey(userId);
    const textLength = this.getTextLength(sel.blockId);

    switch (key) {
      case 'ArrowLeft': {
        this.preferredXBySelection.delete(selectionKey);
        if (shiftKey) {
          // Shift+Left: extend selection left
          if (sel.focus > 0) {
            sel.focus--;
          }
        } else {
          // Left: move caret to start of selection or left
          const newPos = sel.focus < sel.anchor ? sel.anchor - 1 : sel.focus - 1;
          if (newPos >= 0) {
            this.setSelection(sel.blockId, newPos, newPos, userId);
          }
        }
        return true;
      }

      case 'ArrowRight': {
        this.preferredXBySelection.delete(selectionKey);
        if (shiftKey) {
          // Shift+Right: extend selection right
          if (sel.focus < textLength) {
            sel.focus++;
          }
        } else {
          // Right: move caret to end of selection or right
          const newPos = sel.focus > sel.anchor ? sel.focus + 1 : sel.anchor + 1;
          if (newPos <= textLength) {
            this.setSelection(sel.blockId, newPos, newPos, userId);
          }
        }
        return true;
      }

      case 'ArrowUp':
      case 'ArrowDown': {
        const direction: -1 | 1 = key === 'ArrowUp' ? -1 : 1;
        const sourceIndex = shiftKey
          ? sel.focus
          : sel.anchor === sel.focus
            ? sel.focus
            : direction < 0
              ? Math.min(sel.anchor, sel.focus)
              : Math.max(sel.anchor, sel.focus);

        const sourceBounds = this.getInsertionBounds(sel.blockId, sourceIndex);
        if (sourceBounds && !this.preferredXBySelection.has(selectionKey)) {
          this.preferredXBySelection.set(selectionKey, sourceBounds.x);
        }

        const targetIndex = this.moveVerticalInsertion(sel.blockId, sourceIndex, direction, selectionKey);
        if (targetIndex === null) {
          return true;
        }

        if (shiftKey) {
          this.setSelection(sel.blockId, sel.anchor, targetIndex, userId);
        } else {
          this.setSelection(sel.blockId, targetIndex, targetIndex, userId);
        }
        return true;
      }

      case 'Home': {
        this.preferredXBySelection.delete(selectionKey);
        if (shiftKey) {
          // Shift+Home: select from current position to start
          sel.focus = 0;
        } else {
          // Home: move to start
          this.setSelection(sel.blockId, 0, 0, userId);
        }
        return true;
      }

      case 'End': {
        this.preferredXBySelection.delete(selectionKey);
        if (shiftKey) {
          // Shift+End: select from current position to end
          sel.focus = textLength;
        } else {
          // End: move to end
          this.setSelection(sel.blockId, textLength, textLength, userId);
        }
        return true;
      }

      case 'a': {
        this.preferredXBySelection.delete(selectionKey);
        if (ctrlKey) {
          // Ctrl+A: select all
          this.setSelection(sel.blockId, 0, textLength, userId);
          return true;
        }
        break;
      }
    }

    return false;
  }
}
