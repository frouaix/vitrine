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
      caretWidth: config.caretWidth ?? 1
    };
  }

  /**
   * Set a selection for a specific block and optional user.
   * If userId is not provided, uses a default key.
   */
  setSelection(blockId: string, anchor: number, focus: number, userId?: string): void {
    const key = userId ?? 'default';
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
    const key = userId ?? 'default';
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
    const key = userId ?? 'default';
    this.selections.delete(key);
  }

  /**
   * Clear all selections.
   */
  clearAllSelections(): void {
    this.selections.clear();
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

    for (const sel of this.selections.values()) {
      const isCaret = sel.anchor === sel.focus;

      if (isCaret) {
        const caretBounds = this.characterBoundsProvider(sel.blockId, sel.anchor);
        if (caretBounds) {
          const caretBlock = rectangle(
            {
              x: caretBounds.x,
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
        const startBounds = this.characterBoundsProvider(sel.blockId, sel.anchor);
        const endBounds = this.characterBoundsProvider(sel.blockId, sel.focus - 1);

        if (startBounds && endBounds) {
          const x1 = startBounds.x;
          const y1 = startBounds.y;
          const x2 = endBounds.x + endBounds.width;
          const y2 = endBounds.y + endBounds.height;

          const highlightBlock = rectangle(
            {
              x: x1,
              y: y1,
              dx: x2 - x1,
              dy: y2 - y1,
              fill: sel.color ?? this.renderConfig.selectionColor ?? 'rgba(0, 0, 255, 0.2)'
            },
            []
          );
          overlayChildren.push(highlightBlock);
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
}


