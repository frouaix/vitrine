import type {
  AttributedTextValueSemantic,
  SemanticStyleEntry,
  StyleEntry
} from "./types.ts";
import { detectRgStorageMode, getRgGraphemeBoundaryUtf16 } from "./segmentation.ts";
import {
  transformSemanticToRender,
  createThemingCache,
  transformSemanticToRenderWithCache,
  type ThemingTransformConfig,
  type ThemingCache,
  type ThemingTransformWithCacheResult
} from "./theming.ts";
import type { AttributedTextValueRender } from "./types.ts";

// ─── Semantic token constants ────────────────────────────────────────────────

export type MarkdownToken =
  | 'h1' | 'h2' | 'h3'
  | 'bold' | 'italic' | 'bold-italic'
  | 'code-inline' | 'code-block'
  | 'strikethrough'
  | 'blockquote'
  | 'list-item' | 'list-item-ordered'
  | 'hr';

// ─── Default markdown theme ──────────────────────────────────────────────────

export const markdownThemeDefault: ThemingTransformConfig = {
  mpToken_StylePatch: {
    h1:                  { fontSize: 32, fontWeight: '700', lineHeight: 44 },
    h2:                  { fontSize: 26, fontWeight: '700', lineHeight: 36 },
    h3:                  { fontSize: 21, fontWeight: '600', lineHeight: 30 },
    bold:                { fontWeight: '700' },
    italic:              { fontStyle: 'italic' },
    'bold-italic':       { fontWeight: '700', fontStyle: 'italic' },
    'code-inline':       { fontFamily: 'ui-monospace, monospace', background: '#f1f5f9', fill: '#0f172a' },
    strikethrough:       { strikethrough: true },
    blockquote:          { fill: '#64748b', fontStyle: 'italic' },
    'code-block':        { fontFamily: 'ui-monospace, monospace', fontSize: 14, lineHeight: 22, fill: '#0f172a', background: '#f8fafc' },
    'list-item':         {},
    'list-item-ordered': {},
    hr:                  {},
  }
};

// ─── Span type used during parsing ──────────────────────────────────────────

interface ParseSpan {
  text: string;
  token: MarkdownToken | null;
}

const LIST_INDENT = '  ';

function computeVersionFromContent(markdown: string): number {
  // FNV-1a 32-bit hash to produce a stable per-content version id.
  let hash = 0x811c9dc5;
  for (let i = 0; i < markdown.length; i++) {
    hash ^= markdown.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

// ─── Inline scanner ──────────────────────────────────────────────────────────

/**
 * Scan a single line of text for inline markdown spans.
 * Returns a flat list of { text, token } spans.
 * Block-level token (if any) has already been stripped from `line` by the
 * caller and is applied via `blockToken`.
 */
function parseInlineSpans(line: string, blockToken: MarkdownToken | null): ParseSpan[] {
  const spans: ParseSpan[] = [];
  let i = 0;
  const n = line.length;

  while (i < n) {
    // Bold-italic: ***
    if (line.startsWith('***', i)) {
      const end = line.indexOf('***', i + 3);
      if (end !== -1) {
        spans.push({ text: line.slice(i + 3, end), token: 'bold-italic' });
        i = end + 3;
        continue;
      }
    }
    // Bold: **  or  __
    if (line.startsWith('**', i) || line.startsWith('__', i)) {
      const delim = line.slice(i, i + 2);
      const end = line.indexOf(delim, i + 2);
      if (end !== -1) {
        spans.push({ text: line.slice(i + 2, end), token: 'bold' });
        i = end + 2;
        continue;
      }
    }
    // Italic: *  or  _
    if ((line[i] === '*' || line[i] === '_') && line[i + 1] !== line[i]) {
      const delim = line[i];
      const end = line.indexOf(delim, i + 1);
      if (end !== -1) {
        spans.push({ text: line.slice(i + 1, end), token: 'italic' });
        i = end + 1;
        continue;
      }
    }
    // Strikethrough: ~~
    if (line.startsWith('~~', i)) {
      const end = line.indexOf('~~', i + 2);
      if (end !== -1) {
        spans.push({ text: line.slice(i + 2, end), token: 'strikethrough' });
        i = end + 2;
        continue;
      }
    }
    // Inline code: `
    if (line[i] === '`') {
      const end = line.indexOf('`', i + 1);
      if (end !== -1) {
        spans.push({ text: line.slice(i + 1, end), token: 'code-inline' });
        i = end + 1;
        continue;
      }
    }
    // Plain character — extend or start a plain run
    const last = spans[spans.length - 1];
    if (last && last.token === blockToken) {
      last.text += line[i];
    } else {
      spans.push({ text: line[i], token: blockToken });
    }
    i++;
  }

  return spans.filter(s => s.text.length > 0);
}

// ─── Block-level line scanner ────────────────────────────────────────────────

interface LineResult {
  spans: ParseSpan[];
  isHr: boolean;
  isCodeBlockFence: boolean;
  isBlankLine: boolean;
}

function parseLine(rawLine: string, insideCodeBlock: boolean): LineResult {
  // Code block fence
  if (rawLine.trimStart().startsWith('```')) {
    return { spans: [], isHr: false, isCodeBlockFence: true, isBlankLine: false };
  }

  // Inside a code block, content is literal
  if (insideCodeBlock) {
    return {
      spans: [{ text: rawLine, token: 'code-block' }],
      isHr: false,
      isCodeBlockFence: false,
      isBlankLine: false
    };
  }

  const trimmed = rawLine.trim();

  // Blank line
  if (trimmed === '') {
    return { spans: [], isHr: false, isCodeBlockFence: false, isBlankLine: true };
  }

  // Horizontal rule
  if (/^(---+|___+|\*\*\*+)$/.test(trimmed)) {
    return { spans: [{ text: '───────────────', token: 'hr' }], isHr: true, isCodeBlockFence: false, isBlankLine: false };
  }

  // Headings
  const hMatch = rawLine.match(/^(#{1,3})\s+(.*)/);
  if (hMatch) {
    const level = hMatch[1].length as 1 | 2 | 3;
    const token: MarkdownToken = level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3';
    const inlineSpans = parseInlineSpans(hMatch[2], token);
    return { spans: inlineSpans, isHr: false, isCodeBlockFence: false, isBlankLine: false };
  }

  // Blockquote
  if (rawLine.startsWith('> ')) {
    const inlineSpans = parseInlineSpans(rawLine.slice(2), 'blockquote');
    return { spans: inlineSpans, isHr: false, isCodeBlockFence: false, isBlankLine: false };
  }

  // Unordered list item
  const ulMatch = rawLine.match(/^[\s]*[-*]\s+(.*)/);
  if (ulMatch) {
    const bullet: ParseSpan = { text: `${LIST_INDENT}• `, token: null };
    const inlineSpans = parseInlineSpans(ulMatch[1], 'list-item');
    return { spans: [bullet, ...inlineSpans], isHr: false, isCodeBlockFence: false, isBlankLine: false };
  }

  // Ordered list item
  const olMatch = rawLine.match(/^[\s]*(\d+)\.\s+(.*)/);
  if (olMatch) {
    const bullet: ParseSpan = { text: `${LIST_INDENT}${olMatch[1]}. `, token: null };
    const inlineSpans = parseInlineSpans(olMatch[2], 'list-item-ordered');
    return { spans: [bullet, ...inlineSpans], isHr: false, isCodeBlockFence: false, isBlankLine: false };
  }

  // Default paragraph
  const inlineSpans = parseInlineSpans(rawLine, null);
  return { spans: inlineSpans, isHr: false, isCodeBlockFence: false, isBlankLine: false };
}

// ─── Top-level parser ────────────────────────────────────────────────────────

/**
 * Parse a markdown string into an `AttributedTextValueSemantic`.
 * Supports: H1–H3, bold, italic, bold-italic, inline code, strikethrough,
 * blockquote, code block, unordered/ordered list items, horizontal rule.
 */
export function parseMarkdown(markdown: string): AttributedTextValueSemantic {
  const iVersion = computeVersionFromContent(markdown);
  const lines = markdown.split('\n');

  // Build all (text, token) pairs for the full document
  const allSpans: ParseSpan[] = [];
  let insideCodeBlock = false;
  let orderedListNextNumber: number | null = null;

  for (let li = 0; li < lines.length; li++) {
    const result = parseLine(lines[li], insideCodeBlock);

    if (result.isCodeBlockFence) {
      insideCodeBlock = !insideCodeBlock;
      orderedListNextNumber = null;
      // Emit a separator newline so code fences preserve vertical rhythm.
      allSpans.push({ text: '\n', token: null });
      continue;
    }

    if (result.isBlankLine) {
      orderedListNextNumber = null;
      // Preserve explicit blank lines from markdown source.
      allSpans.push({ text: '\n', token: null });
      continue;
    }

    const orderedListMatch = lines[li].match(/^[\s]*(\d+)\.\s+/);
    if (orderedListMatch) {
      const startNumber = Number(orderedListMatch[1]);
      orderedListNextNumber = orderedListNextNumber === null ? startNumber : orderedListNextNumber + 1;

      if (result.spans.length > 0 && result.spans[0].token === null) {
        result.spans[0] = {
          ...result.spans[0],
          text: `${LIST_INDENT}${orderedListNextNumber}. `
        };
      }
    } else {
      orderedListNextNumber = null;
    }

    allSpans.push(...result.spans);

    // Add newline between lines (not after the very last line)
    if (li < lines.length - 1) {
      allSpans.push({ text: '\n', token: null });
    }
  }

  // Concatenate all span texts into a single string
  const strText = allSpans.map(s => s.text).join('');

  if (strText.length === 0) {
    // Return a minimal valid empty value.
    return {
      iVersion,
      rgUnits: 'grapheme',
      rgStorageMode: 'fastCodeUnit',
      strText: '',
      rgSegGraphemeToUtf16: [],
      rgIdStyleRef: [],
      mpId_StyleEntry: { 1: {} },
      idStyleDefault: 1
    };
  }

  // Build the default style entry (no token)
  const styleDefault: SemanticStyleEntry = {
    fontFamily: 'ui-sans-serif, sans-serif',
    fontSize: 16,
    lineHeight: 26,
    fill: '#1e293b'
  };
  const mpId_StyleEntry: Record<number, SemanticStyleEntry> = { 1: styleDefault };
  const mpStyleKey_IdStyle = new Map<string, number>();
  mpStyleKey_IdStyle.set(JSON.stringify(styleDefault), 1);
  let idStyleNext = 2;

  // Build rgIdStyleRef: iterate over span characters, assigning a style id per
  // UTF-16 code unit (fastCodeUnit mode for ASCII/BMP, full segmentation otherwise)
  const storageMode = detectRgStorageMode(strText);
  let unitCount: number;
  let rgSegGraphemeToUtf16: number[];

  if (storageMode === 'fastCodeUnit') {
    unitCount = strText.length;
    rgSegGraphemeToUtf16 = [];
  } else if (storageMode === 'fastCodePoint') {
    // Each code point is one unit; count via surrogates
    unitCount = 0;
    for (let i = 0; i < strText.length; ) {
      const code = strText.codePointAt(i)!;
      i += code > 0xffff ? 2 : 1;
      unitCount++;
    }
    rgSegGraphemeToUtf16 = [];
  } else {
    const boundaries = getRgGraphemeBoundaryUtf16(strText);
    unitCount = boundaries.length - 1;
    rgSegGraphemeToUtf16 = boundaries.slice(1);
  }

  const rgIdStyleRef = new Array<number>(unitCount).fill(1);

  // Map each span to its UTF-16 character range and assign style ids
  let iUtf16Cur = 0;
  for (const span of allSpans) {
    const spanUtf16Len = span.text.length; // JS string length = UTF-16 length
    if (spanUtf16Len === 0) {
      continue;
    }

    const idStyle = (() => {
      if (span.token === null) {
        return 1;
      }

      const styleEntry: SemanticStyleEntry = { mpSemantic: { token: span.token } };
      const sStyleKey = JSON.stringify(styleEntry);
      const idExisting = mpStyleKey_IdStyle.get(sStyleKey);
      if (idExisting !== undefined) {
        return idExisting;
      }

      const idNew = idStyleNext;
      idStyleNext += 1;
      mpStyleKey_IdStyle.set(sStyleKey, idNew);
      mpId_StyleEntry[idNew] = styleEntry;
      return idNew;
    })();

    // Map UTF-16 range to unit range
    if (storageMode === 'fastCodeUnit') {
      for (let i = iUtf16Cur; i < iUtf16Cur + spanUtf16Len; i++) {
        if (i < rgIdStyleRef.length) rgIdStyleRef[i] = idStyle;
      }
    } else {
      // Walk unit by unit within the UTF-16 range
      let iUnit = utf16ToUnit(strText, storageMode, iUtf16Cur, rgSegGraphemeToUtf16);
      const iUtf16End = iUtf16Cur + spanUtf16Len;
      let iUtf16Walk = iUtf16Cur;
      while (iUtf16Walk < iUtf16End && iUnit < rgIdStyleRef.length) {
        rgIdStyleRef[iUnit] = idStyle;
        iUnit++;
        iUtf16Walk = unitToUtf16(strText, storageMode, iUnit, rgSegGraphemeToUtf16);
      }
    }

    iUtf16Cur += spanUtf16Len;
  }

  return {
    iVersion,
    rgUnits: 'grapheme',
    rgStorageMode: storageMode,
    strText,
    rgSegGraphemeToUtf16,
    rgIdStyleRef,
    mpId_StyleEntry,
    idStyleDefault: 1
  };
}

// ─── Helpers for unit ↔ UTF-16 conversion ────────────────────────────────────

function utf16ToUnit(
  strText: string,
  mode: AttributedTextValueSemantic['rgStorageMode'],
  iUtf16: number,
  rgSegGraphemeToUtf16: number[]
): number {
  if (mode === 'fastCodeUnit') return iUtf16;
  if (mode === 'fastCodePoint') {
    let unit = 0;
    let i = 0;
    while (i < iUtf16) {
      const code = strText.codePointAt(i)!;
      i += code > 0xffff ? 2 : 1;
      unit++;
    }
    return unit;
  }
  // segmentedGrapheme: find the grapheme boundary index
  for (let g = 0; g < rgSegGraphemeToUtf16.length; g++) {
    if (rgSegGraphemeToUtf16[g] > iUtf16) return g;
    if (rgSegGraphemeToUtf16[g] === iUtf16) return g + 1;
  }
  return 0;
}

function unitToUtf16(
  strText: string,
  mode: AttributedTextValueSemantic['rgStorageMode'],
  iUnit: number,
  rgSegGraphemeToUtf16: number[]
): number {
  if (mode === 'fastCodeUnit') return iUnit;
  if (mode === 'fastCodePoint') {
    let i = 0;
    let unit = 0;
    while (unit < iUnit && i < strText.length) {
      const code = strText.codePointAt(i)!;
      i += code > 0xffff ? 2 : 1;
      unit++;
    }
    return i;
  }
  // segmentedGrapheme
  if (iUnit === 0) return 0;
  return rgSegGraphemeToUtf16[iUnit - 1] ?? strText.length;
}

// ─── Convenience: parse + theme in one step ──────────────────────────────────

export interface MarkdownRenderOptions {
  theme?: ThemingTransformConfig;
  cache?: ThemingCache;
}

/**
 * Parse markdown and immediately apply the theming transform.
 * Returns an `AttributedTextValueRender` ready for the `texta()` block.
 */
export function parseMarkdownToRender(
  markdown: string,
  options: MarkdownRenderOptions = {}
): AttributedTextValueRender {
  const semantic = parseMarkdown(markdown);
  const theme = options.theme ?? markdownThemeDefault;
  if (options.cache) {
    const result: ThemingTransformWithCacheResult = transformSemanticToRenderWithCache(
      semantic,
      theme,
      options.cache,
      { idTheme: 'markdown-default' }
    );
    return result.valueRender;
  }
  return transformSemanticToRender(semantic, theme);
}

export { createThemingCache };
export type { ThemingTransformConfig, ThemingCache };
