// Copyright (c) 2026 François Rouaix

// Text layout utilities extracted from renderer for reuse in selection management.
// These functions are used by both the renderer (for display) and selection system (for hit-testing).

import type { TextProps } from './types.ts';
import type { RenderContext } from './context.ts';
import type { TextMetrics, CharacterBounds } from './selection-types.ts';

/**
 * Measure text metrics using the provided render context.
 * Falls back to approximation if context doesn't support measureText.
 */
export function measureText(text: string, props: Partial<TextProps> & { font?: string }, context?: RenderContext): TextMetrics {
  if (text.length === 0) {
    const fontSize = props.fontSize ?? 16;
    return {
      width: 0,
      height: fontSize,
      ascent: fontSize * 0.8,
      descent: fontSize * 0.2
    };
  }

  if (context?.measureText) {
    return context.measureText(text, props);
  }

  const fontSize = props.fontSize ?? 16;
  return {
    width: text.length * fontSize * 0.6,
    height: fontSize,
    ascent: fontSize * 0.8,
    descent: fontSize * 0.2
  };
}

/**
 * Compute a text block's local bounding box for rendering and hit-test caches.
 * The returned bounds are in block-local coordinates and include alignment/baseline offsets.
 */
export function getTextBlockBounds(
  text: string,
  props: Partial<TextProps> & { font?: string },
  context?: RenderContext
): CharacterBounds {
  const metrics = measureText(text, props, context);
  const { xOffset, yOffset } = calculateTextOffset(
    metrics.width,
    metrics.height,
    metrics.ascent,
    props.align,
    props.baseline
  );

  return {
    x: xOffset,
    y: yOffset,
    width: metrics.width,
    height: metrics.height
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
  if (text.length === 0) {
    return null;
  }

  if (charIndex < 0 || charIndex >= text.length) {
    return null;
  }

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
  if (text.length === 0) {
    return null;
  }

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

/**
 * Generate per-character bounds for a text block using renderer-compatible wrapping/alignment rules.
 * Bounds are returned in the text block's local coordinates (before block transforms).
 */
export function layoutTextCharacterBounds(
  text: string,
  props: Partial<TextProps> & { font?: string },
  context?: RenderContext
): CharacterBounds[] {
  if (text.length === 0) {
    return [];
  }

  const fontSize = props.fontSize ?? 16;
  const metrics = measureText(text, props, context);
  const lineHeight = props.dyLineHeight ?? fontSize * 1.4;
  const propsUnwrapped: Partial<TextProps> & { font?: string } = {
    ...props,
    dx: undefined,
    dy: undefined
  };
  const measureInlineWidth = (value: string): number => measureText(value, propsUnwrapped, context).width;
  const bounds: Array<CharacterBounds | null> = new Array(text.length).fill(null);

  const getLineStartX = (lineWidth: number): number => {
    if (props.align === 'center') {
      return -lineWidth / 2;
    }
    if (props.align === 'right' || props.align === 'end') {
      return -lineWidth;
    }
    return 0;
  };

  if (props.dx === undefined) {
    const { xOffset, yOffset } = calculateTextOffset(
      metrics.width,
      metrics.height,
      metrics.ascent,
      props.align,
      props.baseline
    );
    for (let i = 0; i < text.length; i++) {
      const widthBefore = measureInlineWidth(text.slice(0, i));
      const widthToEnd = measureInlineWidth(text.slice(0, i + 1));
      bounds[i] = {
        x: xOffset + widthBefore,
        y: yOffset,
        width: Math.max(0, widthToEnd - widthBefore),
        height: metrics.height
      };
    }
    return bounds.map((entry) => entry ?? ({
      x: xOffset + metrics.width,
      y: yOffset,
      width: 0,
      height: metrics.height
    }));
  }

  const dxMax = props.dx;
  const words = text.split(/\s+/);
  const lines: string[] = [];
  if (words.length > 0) {
    let currentLine = words[0] ?? '';
    for (let i = 1; i < words.length; i++) {
      const candidate = `${currentLine} ${words[i]}`;
      if (measureInlineWidth(candidate) > dxMax) {
        lines.push(currentLine);
        currentLine = words[i] ?? '';
      } else {
        currentLine = candidate;
      }
    }
    lines.push(currentLine);
  }

  const { yOffset } = calculateTextOffset(
    metrics.width,
    metrics.height,
    metrics.ascent,
    props.align,
    props.baseline
  );

  let normalizedOffset = 0;
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const lineText = lines[lineIndex] ?? '';
    const lineStart = normalizedOffset;
    const lineEnd = lineStart + lineText.length;
    const hasNextLine = lineIndex < lines.length - 1;
    const lineWidth = measureInlineWidth(lineText);
    const xLineStart = getLineStartX(lineWidth);
    const yLine = yOffset + lineIndex * lineHeight;

    for (let lineCharIndex = 0; lineCharIndex < lineText.length; lineCharIndex++) {
      const charIndex = lineStart + lineCharIndex;
      if (charIndex >= text.length) {
        break;
      }
      const widthBefore = measureInlineWidth(lineText.slice(0, lineCharIndex));
      const widthToEnd = measureInlineWidth(lineText.slice(0, lineCharIndex + 1));
      bounds[charIndex] = {
        x: xLineStart + widthBefore,
        y: yLine,
        width: Math.max(0, widthToEnd - widthBefore),
        height: lineHeight
      };
    }

    if (hasNextLine && lineEnd < text.length) {
      const xAtLineEnd = xLineStart + lineWidth;
      const widthSpace = measureInlineWidth(' ');
      bounds[lineEnd] = {
        x: xAtLineEnd,
        y: yLine,
        width: widthSpace,
        height: lineHeight
      };
    }

    normalizedOffset = lineEnd + (hasNextLine ? 1 : 0);
  }

  let fallbackX = getLineStartX(metrics.width) + metrics.width;
  let fallbackY = yOffset;
  let fallbackHeight = lineHeight;

  for (let i = 0; i < bounds.length; i++) {
    const entry = bounds[i];
    if (entry) {
      fallbackX = entry.x + entry.width;
      fallbackY = entry.y;
      fallbackHeight = entry.height;
      continue;
    }
    bounds[i] = {
      x: fallbackX,
      y: fallbackY,
      width: 0,
      height: fallbackHeight
    };
  }

  return bounds as CharacterBounds[];
}
