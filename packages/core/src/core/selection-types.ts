// Copyright (c) 2026 François Rouaix

// Text selection and layout types

import type { TextMetrics } from './types.ts';

/** Represents a single text selection or caret position. */
export interface Selection {
  /** ID of the text/texta block this selection applies to. */
  blockId: string;
  /** Character position for the anchor (start of selection). */
  anchor: number;
  /** Character position for the focus (end of selection). For caret, anchor === focus. */
  focus: number;
  /** Optional user ID for collaborative multi-user selections. */
  userId?: string;
  /** Optional color for rendering this selection (useful for multi-user scenarios). */
  color?: string;
}

/** Bounding box for a character at a specific index. */
export interface CharacterBounds {
  /** Left edge in pixels. */
  x: number;
  /** Top edge in pixels. */
  y: number;
  /** Width in pixels. */
  width: number;
  /** Height in pixels. */
  height: number;
}

/** Layout information for a text block. */
export interface TextLayout {
  /** Character-indexed positions for hit testing. */
  characterBounds: CharacterBounds[];
  /** Overall bounding box. */
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Line information (for multi-line text). */
  lines: TextLine[];
}

/** Information about a single line of text. */
export interface TextLine {
  /** Character index where this line starts. */
  startIndex: number;
  /** Character index where this line ends (exclusive). */
  endIndex: number;
  /** Width of the line in pixels. */
  width: number;
  /** Height of the line in pixels. */
  height: number;
  /** Ascent (baseline to top). */
  ascent: number;
  /** Descent (baseline to bottom). */
  descent: number;
}
