// Copyright (c) 2026 François Rouaix

// Text layout utilities extracted from renderer for reuse in selection management.
// These functions are used by both the renderer (for display) and selection system (for hit-testing).

import type { Rc, TextMeasure, TextProps } from './types.ts';
import { DU_FONTSIZE_DEFAULT, SF_TEXT_ADVANCE_APPROX_DEFAULT, SF_TEXT_ASCENT_DEFAULT, SF_TEXT_DESCENT_DEFAULT, SF_TEXT_LINE_HEIGHT_DEFAULT, type RenderContext } from './context.ts';

const mpstFont_mpstGlyphWidth = new Map<string, Map<string, number>>();
const mpstFont_mpstTextPrefixAdvance = new Map<string, Map<string, number[]>>();
const mpstFont_mpstTextMeasure = new Map<string, Map<string, TextMeasure>>();

const CACHES_MAX_FONTS = 64;
const CACHES_MAX_GLYPHS_PER_FONT = 512;
const CACHES_MAX_PREFIX_PER_FONT = 256;
const CACHES_MAX_MEASURE_PER_FONT = 512;

function pruneOldestMapEntry<K, V>(map: Map<K, V>): void {
  const firstKey = map.keys().next().value;
  if (firstKey !== undefined) {
    map.delete(firstKey);
  }
}

function setWithLruTouch<K, V>(map: Map<K, V>, key: K, value: V, maxEntries: number): void {
  if (map.has(key)) {
    map.delete(key);
  }
  map.set(key, value);
  while (map.size > maxEntries) {
    pruneOldestMapEntry(map);
  }
}

function touchMapKey<K, V>(map: Map<K, V>, key: K): void {
  const value = map.get(key);
  if (value === undefined) {
    return;
  }
  map.delete(key);
  map.set(key, value);
}

function getOrCreateGlyphCacheByFont(stFont: string): Map<string, number> {
  const existing = mpstFont_mpstGlyphWidth.get(stFont);
  if (existing) {
    touchMapKey(mpstFont_mpstGlyphWidth, stFont);
    return existing;
  }
  const created = new Map<string, number>();
  setWithLruTouch(mpstFont_mpstGlyphWidth, stFont, created, CACHES_MAX_FONTS);
  return created;
}

function getOrCreatePrefixCacheByFont(stFont: string): Map<string, number[]> {
  const existing = mpstFont_mpstTextPrefixAdvance.get(stFont);
  if (existing) {
    touchMapKey(mpstFont_mpstTextPrefixAdvance, stFont);
    return existing;
  }
  const created = new Map<string, number[]>();
  setWithLruTouch(mpstFont_mpstTextPrefixAdvance, stFont, created, CACHES_MAX_FONTS);
  return created;
}

function getOrCreateMeasureCacheByFont(stFont: string): Map<string, TextMeasure> {
  const existing = mpstFont_mpstTextMeasure.get(stFont);
  if (existing) {
    touchMapKey(mpstFont_mpstTextMeasure, stFont);
    return existing;
  }
  const created = new Map<string, TextMeasure>();
  setWithLruTouch(mpstFont_mpstTextMeasure, stFont, created, CACHES_MAX_FONTS);
  return created;
}

export function clearTextLayoutCaches(): void {
  mpstFont_mpstGlyphWidth.clear();
  mpstFont_mpstTextPrefixAdvance.clear();
  mpstFont_mpstTextMeasure.clear();
}

export function getTextLayoutCacheStats(): {
  fontsInGlyphCache: number;
  fontsInPrefixCache: number;
  fontsInMeasureCache: number;
  glyphEntries: number;
  prefixEntries: number;
  measureEntries: number;
} {
  let glyphEntries = 0;
  for (const bucket of mpstFont_mpstGlyphWidth.values()) {
    glyphEntries += bucket.size;
  }

  let prefixEntries = 0;
  for (const bucket of mpstFont_mpstTextPrefixAdvance.values()) {
    prefixEntries += bucket.size;
  }

  let measureEntries = 0;
  for (const bucket of mpstFont_mpstTextMeasure.values()) {
    measureEntries += bucket.size;
  }

  return {
    fontsInGlyphCache: mpstFont_mpstGlyphWidth.size,
    fontsInPrefixCache: mpstFont_mpstTextPrefixAdvance.size,
    fontsInMeasureCache: mpstFont_mpstTextMeasure.size,
    glyphEntries,
    prefixEntries,
    measureEntries
  };
}

function stFontCacheKey(props: Partial<TextProps> & { font?: string }): string {
  return props.font ?? `${props.fontSize ?? DU_FONTSIZE_DEFAULT}px sans-serif`;
}

function propsUnwrappedForMeasure(props: Partial<TextProps> & { font?: string }): Partial<TextProps> & { font?: string } {
  return {
    ...props,
    dx: undefined,
    dy: undefined
  };
}

function getCachedGlyphWidth(
  stGlyph: string,
  props: Partial<TextProps> & { font?: string },
  context?: RenderContext
): number {
  const stFont = stFontCacheKey(props);
  const mpstGlyphWidth = getOrCreateGlyphCacheByFont(stFont);

  const widthCached = mpstGlyphWidth.get(stGlyph);
  if (widthCached !== undefined) {
    touchMapKey(mpstGlyphWidth, stGlyph);
    return widthCached;
  }

  const widthMeasured = measureText(stGlyph, propsUnwrappedForMeasure(props), context).width;
  setWithLruTouch(mpstGlyphWidth, stGlyph, widthMeasured, CACHES_MAX_GLYPHS_PER_FONT);
  return widthMeasured;
}

function getCachedPrefixAdvance(
  text: string,
  props: Partial<TextProps> & { font?: string },
  context?: RenderContext
): number[] {
  const stFont = stFontCacheKey(props);
  const mpstTextPrefixAdvance = getOrCreatePrefixCacheByFont(stFont);

  const prefixCached = mpstTextPrefixAdvance.get(text);
  if (prefixCached) {
    touchMapKey(mpstTextPrefixAdvance, text);
    return prefixCached;
  }

  const rgdxPrefix = new Array<number>(text.length + 1).fill(0);
  for (let i = 0; i < text.length; i++) {
    rgdxPrefix[i + 1] = rgdxPrefix[i] + getCachedGlyphWidth(text[i] ?? '', props, context);
  }

  setWithLruTouch(mpstTextPrefixAdvance, text, rgdxPrefix, CACHES_MAX_PREFIX_PER_FONT);
  return rgdxPrefix;
}

function getAdvanceScaleFactor(measuredWidth: number, rgdxPrefix: number[]): number {
  const dxAdvance = rgdxPrefix[rgdxPrefix.length - 1] ?? 0;
  if (dxAdvance <= 0) {
    return 1;
  }
  return measuredWidth / dxAdvance;
}

function findCharIndexByAdvance(rgdxPrefix: number[], xAdvance: number): number {
  let iMin = 0;
  let iMax = Math.max(0, rgdxPrefix.length - 2);
  while (iMin < iMax) {
    const iMid = Math.floor((iMin + iMax) / 2);
    const xMidEnd = rgdxPrefix[iMid + 1] ?? 0;
    if (xMidEnd <= xAdvance) {
      iMin = iMid + 1;
    } else {
      iMax = iMid;
    }
  }
  return iMin;
}

/**
 * Measure text metrics using the provided render context.
 * Falls back to approximation if context doesn't support measureText.
 */
export function measureText(text: string, props: Partial<TextProps> & { font?: string }, context?: RenderContext): TextMeasure {
  if (context?.measureText && text.length > 0) {
    const stFont = stFontCacheKey(props);
    const mpstTextMeasure = getOrCreateMeasureCacheByFont(stFont);
    const tmCached = mpstTextMeasure.get(text);
    if (tmCached) {
      touchMapKey(mpstTextMeasure, text);
      return tmCached;
    }

    const tmMeasured = context.measureText(text, props);
    setWithLruTouch(mpstTextMeasure, text, tmMeasured, CACHES_MAX_MEASURE_PER_FONT);
    return tmMeasured;
  }

  const fontSize = props.fontSize ?? DU_FONTSIZE_DEFAULT;
  return {
    width: text.length * fontSize * SF_TEXT_ADVANCE_APPROX_DEFAULT,
    height: fontSize,
    ascent: fontSize * SF_TEXT_ASCENT_DEFAULT,
    descent: fontSize * SF_TEXT_DESCENT_DEFAULT
  };
}

/**
 * Compute a text block's local bounding box for rendering and hit-test caches.
 * The returned bounds are in block-local coordinates and include alignment/baseline offsets.
 */
export function getTextBlockRc(
  text: string,
  props: Partial<TextProps> & { font?: string },
  context?: RenderContext
): Rc {
  const tm = measureText(text, props, context);
  const duFontSize = props.fontSize ?? DU_FONTSIZE_DEFAULT;
  const duLineHeight = props.dyLineHeight ?? duFontSize * SF_TEXT_LINE_HEIGHT_DEFAULT;

  let dxText = tm.width;
  let dyText = tm.height;
  if (props.dx !== undefined) {
    const lineCount = Math.max(1, Math.ceil(dxText / props.dx));
    dxText = Math.min(dxText, props.dx);
    dyText = lineCount * duLineHeight;
  }

  const { xOffset, yOffset } = calculateTextOffset(
    dxText,
    dyText,
    tm.ascent,
    props.align,
    props.baseline
  );

  return {
    x: xOffset,
    y: yOffset,
    width: dxText,
    height: dyText
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
 * Uses cached per-glyph advances for the active font.
 */
export function getCharacterBounds(
  text: string,
  charIndex: number,
  props: Partial<TextProps> & { font?: string },
  context?: RenderContext
): Rc | null {
  if (text.length === 0) {
    return null;
  }

  if (charIndex < 0 || charIndex >= text.length) {
    return null;
  }

  const tm = measureText(text, props, context);
  const { xOffset, yOffset } = calculateTextOffset(
    tm.width,
    tm.height,
    tm.ascent,
    props.align,
    props.baseline
  );

  const rgdxPrefix = getCachedPrefixAdvance(text, props, context);
  const sfAdvance = getAdvanceScaleFactor(tm.width, rgdxPrefix);
  const xStart = (rgdxPrefix[charIndex] ?? 0) * sfAdvance;
  const xEnd = (rgdxPrefix[charIndex + 1] ?? (rgdxPrefix[charIndex] ?? 0)) * sfAdvance;

  return {
    x: xOffset + xStart,
    y: yOffset,
    width: Math.max(0, xEnd - xStart),
    height: tm.height
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

  const rgdxPrefix = getCachedPrefixAdvance(text, props, context);
  const sfAdvance = getAdvanceScaleFactor(metrics.width, rgdxPrefix);
  const xAdvance = sfAdvance > 0 ? relativeX / sfAdvance : relativeX;
  let charIndex = findCharIndexByAdvance(rgdxPrefix, xAdvance);
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
): Rc[] {
  if (text.length === 0) {
    return [];
  }

  const fontSize = props.fontSize ?? DU_FONTSIZE_DEFAULT;
  const metrics = measureText(text, props, context);
  const lineHeight = props.dyLineHeight ?? fontSize * SF_TEXT_LINE_HEIGHT_DEFAULT;
  const propsUnwrapped = propsUnwrappedForMeasure(props);
  const measureAdvanceWidth = (value: string): number => {
    const rgdxPrefix = getCachedPrefixAdvance(value, propsUnwrapped, context);
    return rgdxPrefix[rgdxPrefix.length - 1] ?? 0;
  };
  const bounds: Array<Rc | null> = new Array(text.length).fill(null);

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
    const rgdxPrefix = getCachedPrefixAdvance(text, propsUnwrapped, context);
    const sfAdvance = getAdvanceScaleFactor(metrics.width, rgdxPrefix);
    const { xOffset, yOffset } = calculateTextOffset(
      metrics.width,
      metrics.height,
      metrics.ascent,
      props.align,
      props.baseline
    );
    for (let i = 0; i < text.length; i++) {
      const widthBefore = (rgdxPrefix[i] ?? 0) * sfAdvance;
      const widthToEnd = (rgdxPrefix[i + 1] ?? (rgdxPrefix[i] ?? 0)) * sfAdvance;
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
      if (measureAdvanceWidth(candidate) > dxMax) {
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
    const rgdxPrefixLine = getCachedPrefixAdvance(lineText, propsUnwrapped, context);
    const lineWidth = rgdxPrefixLine[rgdxPrefixLine.length - 1] ?? 0;
    const xLineStart = getLineStartX(lineWidth);
    const yLine = yOffset + lineIndex * lineHeight;

    for (let lineCharIndex = 0; lineCharIndex < lineText.length; lineCharIndex++) {
      const charIndex = lineStart + lineCharIndex;
      if (charIndex >= text.length) {
        break;
      }
      const widthBefore = rgdxPrefixLine[lineCharIndex] ?? 0;
      const widthToEnd = rgdxPrefixLine[lineCharIndex + 1] ?? (rgdxPrefixLine[lineCharIndex] ?? 0);
      bounds[charIndex] = {
        x: xLineStart + widthBefore,
        y: yLine,
        width: Math.max(0, widthToEnd - widthBefore),
        height: lineHeight
      };
    }

    if (hasNextLine && lineEnd < text.length) {
      const xAtLineEnd = xLineStart + lineWidth;
      const widthSpace = measureAdvanceWidth(' ');
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

  return bounds as Rc[];
}
