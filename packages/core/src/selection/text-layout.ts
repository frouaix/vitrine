// Copyright (c) 2026 François Rouaix

// Text layout utilities extracted from renderer for reuse in selection management.
// These functions are used by both the renderer (for display) and selection system (for hit-testing).

import type { TextProps, TextaProps } from '../core/types.ts';
import type { RenderContext } from '../core/context.ts';
import type { TextMetrics, CharacterBounds, TextLayout, TextLine } from './types.ts';

/**
 * Measure text metrics using the provided render context.
 * Falls back to approximation if context doesn't support measureText.
 */
export function measureText(text: string, props: Partial<TextProps> & { font?: string }, context?: RenderContext): TextMetrics {
  if (context?.measureText) {
    return context.measureText(text, props);
  }

  const fontSize = props.fontSize ?? 16;
  return {
    width: text.length * fontSize * 0.6,
    height: fontSize,
    ascent: fontSize,
    descent: 0
  };
}

/**
 * Calculate text offset based on alignment and baseline.
 */
export function calculateTextOffset(
  textWidth: number,
  textHeight: number,
  ascent: number,
  align?: 'left' | 'center' | 'right' | 'start' | 'end',
  baseline?: 'top' | 'middle' | 'bottom' | 'alphabetic' | 'hanging'
): { xOffset: number; yOffset: number } {
  let xOffset = 0;
  if (align === 'center') {
    xOffset = -textWidth / 2;
  } else if (align === 'right' || align === 'end') {
    xOffset = -textWidth;
  }

  let yOffset = -ascent;
  if (baseline === 'top' || baseline === 'hanging') {
    yOffset = 0;
  } else if (baseline === 'middle') {
    yOffset = -textHeight / 2;
  } else if (baseline === 'bottom') {
    yOffset = -textHeight;
  }

  return { xOffset, yOffset };
}

/**
 * Get character bounds for a single character in a text string.
 * Returns the bounding box for the character at the given index.
 * For now, uses uniform character width approximation.
 * TODO: Implement actual character-level hit-testing for complex fonts.
 */
export function getCharacterBounds(
  text: string,
  charIndex: number,
  props: Partial<TextProps> & { font?: string },
  context?: RenderContext
): CharacterBounds | null {
  if (charIndex < 0 || charIndex > text.length) {
    return null;
  }

  const fontSize = props.fontSize ?? 16;
  const metrics = measureText(text, props, context);
  const { xOffset, yOffset } = calculateTextOffset(
    metrics.width,
    metrics.height,
    metrics.ascent,
    props.align,
    props.baseline
  );

  const charWidth = metrics.width / text.length;

  return {
    x: xOffset + charIndex * charWidth,
    y: yOffset,
    width: charWidth,
    height: metrics.height
  };
}

/**
 * Hit-test to find which character is at the given coordinates.
 * Returns the character index, or null if no hit.
 */
export function hitTestCharacter(
  text: string,
  x: number,
  y: number,
  props: Partial<TextProps> & { font?: string },
  context?: RenderContext
): number | null {
  const fontSize = props.fontSize ?? 16;
  const metrics = measureText(text, props, context);
  const { xOffset, yOffset } = calculateTextOffset(
    metrics.width,
    metrics.height,
    metrics.ascent,
    props.align,
    props.baseline
  );

  // Check if hit is within vertical bounds
  if (y < yOffset || y > yOffset + metrics.height) {
    return null;
  }

  // Find character index based on horizontal position
  const relativeX = x - xOffset;
  if (relativeX < 0) {
    return 0;
  }
  if (relativeX > metrics.width) {
    return text.length;
  }

  const charWidth = metrics.width / text.length;
  let charIndex = Math.floor(relativeX / charWidth);
  charIndex = Math.max(0, Math.min(charIndex, text.length - 1));

  return charIndex;
}
