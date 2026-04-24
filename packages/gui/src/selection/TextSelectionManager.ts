// Copyright (c) 2026 François Rouaix

// Text selection manager for VitrineComponent
// Tracks selections across text/texta blocks and manages selection state.

import type { Selection } from 'vitrine';

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

/** Text selection manager for a VitrineComponent instance. */
export class TextSelectionManager {
  private selections: Map<string, Selection> = new Map();
  private renderConfig: SelectionRenderConfig;
  private isDragging: boolean = false;
  private dragStartBlockId: string | null = null;
  private dragStartCharIndex: number | null = null;

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

