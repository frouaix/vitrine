import type { AttributedTextValue } from './types.ts';
import { getRgRenderBridgeBoundaryUtf16, getRgRenderBridgeRun } from './render-bridges.ts';
import {
  calculateTextOffset,
  customBlock,
  PerformanceMonitor,
  registerBlockType,
  measureText,
  SF_TEXT_ADVANCE_APPROX_DEFAULT
} from 'vitrine';
import type {
  BaseBlockProps,
  Block,
  Rc,
  CustomBlockHandlers,
  TextMeasure
} from 'vitrine';

export const stBlockTypeTexta = 'texta';

type StyleEntryLike = {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  lineHeight?: number;
  fill?: string;
  background?: string;
  stroke?: string;
  opacity?: number;
};

type Segment = {
  text: string;
  style: StyleEntryLike;
  iStart: number;
  iEnd: number;
};

type SegmentMetrics = {
  text: string;
  style: StyleEntryLike;
  iStart: number;
  iEnd: number;
  font: string | undefined;
  width: number;
  ascent: number;
  descent: number;
  fontSize: number;
  lineHeight: number;
};

type PositionedSegmentMetrics = SegmentMetrics & {
  x: number;
};

type TextaLayoutLine = {
  segments: PositionedSegmentMetrics[];
  width: number;
  height: number;
  ascent: number;
  y: number;
  yBaseline: number;
};

type TextaLayout = {
  lines: TextaLayoutLine[];
  bounds: Rc;
  rgrclCharacterBounds: Rc[];
  styleDefault: StyleEntryLike;
};

type TextaLayoutOptions = {
  fIncludeCharacterBounds?: boolean;
};

interface TextaLayoutCacheEntry {
  layout: TextaLayout;
  fIncludesCharacterBounds: boolean;
}

export interface TextaLayoutCacheStats {
  [stMetric: string]: number;
  cacheEntries: number;
  layoutRequests: number;
  cacheHits: number;
  cacheMisses: number;
  layoutBuilds: number;
  characterBoundsBuilds: number;
  selectionGeometryResolveCalls: number;
  hitRatePercent: number;
}

const mpstLayoutCache = new Map<string, TextaLayoutCacheEntry>();
const C_LAYOUT_CACHE_MAX = 256;
const textaLayoutStats = {
  layoutRequests: 0,
  cacheHits: 0,
  cacheMisses: 0,
  layoutBuilds: 0,
  characterBoundsBuilds: 0,
  selectionGeometryResolveCalls: 0
};

export interface TextaBlockProps extends BaseBlockProps {
  texta: AttributedTextValue;
  align?: 'left' | 'center' | 'right' | 'start' | 'end';
  baseline?: 'top' | 'middle' | 'bottom' | 'alphabetic' | 'hanging';
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  font?: string;
  fontSize?: number;
  lineHeight?: number;
  dx?: number;
}

function getDefaultStyle(props: TextaBlockProps): StyleEntryLike {
  const { texta } = props;
  const mpStyleById = texta.mpId_StyleEntry as Record<number, StyleEntryLike>;
  return mpStyleById[texta.idStyleDefault] ?? {};
}

function buildFont(style: StyleEntryLike, styleDefault: StyleEntryLike, fontDefault?: string): string | undefined {
  if (fontDefault && !style.fontFamily && !style.fontWeight && !style.fontStyle && style.fontSize === undefined) {
    return fontDefault;
  }
  const fontFamily = style.fontFamily ?? styleDefault.fontFamily;
  if (!fontFamily) {
    return undefined;
  }
  const fontStyle = style.fontStyle ?? styleDefault.fontStyle ?? 'normal';
  const fontWeight = style.fontWeight ?? styleDefault.fontWeight ?? 'normal';
  const fontSize = style.fontSize ?? styleDefault.fontSize ?? 16;
  return `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
}

function getFontSize(style: StyleEntryLike, styleDefault: StyleEntryLike, fontSizeDefault?: number): number {
  return style.fontSize ?? fontSizeDefault ?? styleDefault.fontSize ?? 16;
}

function getLineHeight(style: StyleEntryLike, styleDefault: StyleEntryLike, lineHeightDefault?: number, fontSizeDefault?: number): number {
  const fontSize = getFontSize(style, styleDefault, fontSizeDefault);
  return style.lineHeight ?? lineHeightDefault ?? styleDefault.lineHeight ?? fontSize * 1.4;
}

function measureSegment(
  segment: Segment,
  styleDefault: StyleEntryLike,
  contextMeasure: (text: string, props: { font?: string; fontSize?: number }) => TextMeasure,
  defaults: Pick<TextaBlockProps, 'font' | 'fontSize' | 'lineHeight'>
): SegmentMetrics {
  const fontSize = getFontSize(segment.style, styleDefault, defaults.fontSize);
  const font = buildFont(segment.style, styleDefault, defaults.font);
  const metrics = contextMeasure(segment.text, font ? { font } : { fontSize });
  return {
    text: segment.text,
    style: segment.style,
    iStart: segment.iStart,
    iEnd: segment.iEnd,
    font,
    width: metrics.width,
    ascent: metrics.ascent,
    descent: metrics.descent,
    fontSize,
    lineHeight: getLineHeight(segment.style, styleDefault, defaults.lineHeight, defaults.fontSize)
  };
}

function createMeasureTextFn(
  props: TextaBlockProps,
  context?: { measureText?: (text: string, props: { font?: string; fontSize?: number }) => TextMeasure }
): (text: string, props: { font?: string; fontSize?: number }) => TextMeasure {
  return (text, metricsProps) => {
    if (context?.measureText) {
      return context.measureText(text, metricsProps);
    }
    const fontSize = metricsProps.fontSize ?? props.fontSize ?? 16;
    return {
      width: text.length * fontSize * SF_TEXT_ADVANCE_APPROX_DEFAULT,
      height: fontSize,
      ascent: fontSize,
      descent: 0
    };
  };
}

function getUnitText(value: AttributedTextValue, rgBoundaryUtf16: number[], iUnit: number): string {
  const iUtf16Start = rgBoundaryUtf16[iUnit] ?? value.strText.length;
  const iUtf16End = rgBoundaryUtf16[iUnit + 1] ?? value.strText.length;
  return value.strText.slice(iUtf16Start, iUtf16End);
}

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

function buildTextaLayoutSignature(props: TextaBlockProps): string {
  return [
    props.texta.iVersion,
    props.texta.rgUnits,
    props.texta.rgStorageMode,
    props.align,
    props.baseline,
    props.dx,
    props.font,
    props.fontSize,
    props.lineHeight
  ].join('|');
}

function getTextaMeasureSignature(
  context?: { measureText?: (text: string, props: { font?: string; fontSize?: number }) => TextMeasure }
): string {
  return context?.measureText ? 'measured' : 'approx';
}

function getTextaLayoutCacheKey(
  props: TextaBlockProps,
  context?: { measureText?: (text: string, props: { font?: string; fontSize?: number }) => TextMeasure }
): string {
  return `${buildTextaLayoutSignature(props)}|${getTextaMeasureSignature(context)}`;
}

function splitRunLines(
  props: TextaBlockProps,
  rgBoundaryUtf16: number[],
  styleDefault: StyleEntryLike
): Segment[][] {
  const runs = getRgRenderBridgeRun(props.texta);
  const mpStyleById = props.texta.mpId_StyleEntry as Record<number, StyleEntryLike>;
  const lineSegments: Segment[][] = [[]];

  for (const run of runs) {
    const style = mpStyleById[run.idStyle] ?? styleDefault;
    let textCurrent = '';
    let iStartCurrent = run.iStart;

    for (let iUnit = run.iStart; iUnit < run.iEnd; iUnit++) {
      const textUnit = getUnitText(props.texta, rgBoundaryUtf16, iUnit);
      if (textUnit === '\n') {
        if (textCurrent.length > 0) {
          lineSegments[lineSegments.length - 1].push({
            text: textCurrent,
            style,
            iStart: iStartCurrent,
            iEnd: iUnit
          });
          textCurrent = '';
        }
        lineSegments.push([]);
        iStartCurrent = iUnit + 1;
        continue;
      }

      if (textCurrent.length === 0) {
        iStartCurrent = iUnit;
      }
      textCurrent += textUnit;
    }

    if (textCurrent.length > 0) {
      lineSegments[lineSegments.length - 1].push({
        text: textCurrent,
        style,
        iStart: iStartCurrent,
        iEnd: run.iEnd
      });
    }
  }

  return lineSegments;
}

function splitSegmentWrapAtoms(segment: Segment, value: AttributedTextValue, rgBoundaryUtf16: number[]): Segment[] {
  const atoms: Segment[] = [];
  let textCurrent = '';
  let iStartCurrent = segment.iStart;

  for (let iUnit = segment.iStart; iUnit < segment.iEnd; iUnit++) {
    const textUnit = getUnitText(value, rgBoundaryUtf16, iUnit);
    if (textUnit === ' ') {
      if (textCurrent.length > 0) {
        textCurrent += textUnit;
        atoms.push({
          text: textCurrent,
          style: segment.style,
          iStart: iStartCurrent,
          iEnd: iUnit + 1
        });
        textCurrent = '';
        iStartCurrent = iUnit + 1;
      } else {
        atoms.push({
          text: textUnit,
          style: segment.style,
          iStart: iUnit,
          iEnd: iUnit + 1
        });
        iStartCurrent = iUnit + 1;
      }
      continue;
    }

    if (textCurrent.length === 0) {
      iStartCurrent = iUnit;
    }
    textCurrent += textUnit;
  }

  if (textCurrent.length > 0) {
    atoms.push({
      text: textCurrent,
      style: segment.style,
      iStart: iStartCurrent,
      iEnd: segment.iEnd
    });
  }

  return atoms;
}

function computeLineMetrics(
  props: TextaBlockProps,
  rgBoundaryUtf16: number[],
  contextMeasure: (text: string, props: { font?: string; fontSize?: number }) => TextMeasure
): { lineMetrics: SegmentMetrics[][]; lineWidths: number[]; lineHeights: number[]; lineAscents: number[]; styleDefault: StyleEntryLike } {
  const styleDefault = getDefaultStyle(props);
  const lineSegments = splitRunLines(props, rgBoundaryUtf16, styleDefault);

  let lineMetrics: SegmentMetrics[][];
  if (props.dx !== undefined) {
    lineMetrics = [];
    for (const segments of lineSegments) {
      const atoms: SegmentMetrics[] = [];
      for (const segment of segments) {
        const segmentAtoms = splitSegmentWrapAtoms(segment, props.texta, rgBoundaryUtf16);
        for (const atom of segmentAtoms) {
          if (atom.text.length > 0) {
            atoms.push(measureSegment(atom, styleDefault, contextMeasure, props));
          }
        }
      }

      const linesVisual: SegmentMetrics[][] = [[]];
      let widthCurrent = 0;
      for (const atom of atoms) {
        if (widthCurrent + atom.width > props.dx && linesVisual[linesVisual.length - 1]!.length > 0) {
          linesVisual.push([]);
          widthCurrent = 0;
        }
        linesVisual[linesVisual.length - 1]!.push(atom);
        widthCurrent += atom.width;
      }
      for (const line of linesVisual) {
        lineMetrics.push(line);
      }
    }
  } else {
    lineMetrics = lineSegments.map((segments) =>
      segments.map((segment) => measureSegment(segment, styleDefault, contextMeasure, props))
    );
  }

  const lineWidths = lineMetrics.map((line) => line.reduce((sum, segment) => sum + segment.width, 0));
  const lineHeights = lineMetrics.map((line) => {
    if (line.length === 0) {
      return props.lineHeight ?? props.fontSize ?? styleDefault.fontSize ?? 16;
    }
    return Math.max(...line.map((segment) => segment.lineHeight));
  });
  const lineAscents = lineMetrics.map((line, i) => {
    if (line.length === 0) {
      return props.fontSize ?? styleDefault.fontSize ?? 16;
    }
    return Math.max(...line.map((segment) => segment.ascent));
  });

  return { lineMetrics, lineWidths, lineHeights, lineAscents, styleDefault };
}

function calculateTextaBounds(
  props: TextaBlockProps,
  lineWidths: number[],
  lineHeights: number[],
  lineAscents: number[],
  styleDefault: StyleEntryLike
): { bounds: Rc; yBaseline: number; firstAscent: number } {
  if (lineWidths.length === 0 || lineHeights.length === 0) {
    return {
      bounds: {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      },
      yBaseline: 0,
      firstAscent: props.fontSize ?? styleDefault.fontSize ?? 16
    };
  }

  const totalHeight = lineHeights.reduce((sum, height) => sum + height, 0);
  const firstAscent = lineAscents[0] ?? (props.fontSize ?? styleDefault.fontSize ?? 16);
  let yBaseline = 0;
  if (props.baseline === 'top') {
    yBaseline = firstAscent;
  } else if (props.baseline === 'middle') {
    yBaseline = -totalHeight / 2 + firstAscent;
  } else if (props.baseline === 'bottom') {
    yBaseline = -totalHeight + firstAscent;
  } else if (props.baseline === 'hanging') {
    yBaseline = firstAscent * 0.8;
  }

  const getLineStartX = (lineWidth: number): number => {
    if (props.align === 'center') {
      return -lineWidth / 2;
    }
    if (props.align === 'right' || props.align === 'end') {
      return -lineWidth;
    }
    return 0;
  };

  const yTop = yBaseline - firstAscent;
  let xMin = 0;
  let xMax = 0;
  for (let i = 0; i < lineWidths.length; i++) {
    const lineWidth = lineWidths[i] ?? 0;
    const xStart = getLineStartX(lineWidth);
    if (i === 0) {
      xMin = xStart;
      xMax = xStart + lineWidth;
    } else {
      xMin = Math.min(xMin, xStart);
      xMax = Math.max(xMax, xStart + lineWidth);
    }
  }

  return {
    bounds: {
      x: xMin,
      y: yTop,
      width: Math.max(0, xMax - xMin),
      height: Math.max(0, totalHeight)
    },
    yBaseline,
    firstAscent
  };
}

function estimateTextaBounds(props: TextaBlockProps): Rc {
  const lineHeight = props.lineHeight ?? props.fontSize ?? 16;
  if (props.texta.strText.length === 0) {
    return {
      x: 0,
      y: 0,
      width: 0,
      height: 0
    };
  }

  const baseMetrics = measureText(props.texta.strText, { font: props.font, fontSize: props.fontSize });
  const lines = props.texta.strText.split('\n');
  const lineWidths = lines.map((line) => measureText(line, { font: props.font, fontSize: props.fontSize }).width);
  const widthMax = lineWidths.length > 0
    ? Math.max(...lineWidths)
    : baseMetrics.width;
  const explicitLineCount = Math.max(1, lines.length);
  const wrappedLineCount = props.dx !== undefined
    ? lineWidths.reduce((count, width) => count + Math.max(1, Math.ceil(Math.max(1, width) / Math.max(1, props.dx!))), 0)
    : explicitLineCount;
  const width = props.dx !== undefined
    ? Math.min(widthMax, props.dx)
    : widthMax;
  const height = Math.max(lineHeight, wrappedLineCount * lineHeight);
  const { xOffset, yOffset } = calculateTextOffset(
    width,
    height,
    baseMetrics.ascent,
    props.align,
    props.baseline
  );
  return {
    x: xOffset,
    y: yOffset,
    width,
    height
  };
}

function buildTextaLayoutUncached(
  props: TextaBlockProps,
  context?: { measureText?: (text: string, props: { font?: string; fontSize?: number }) => TextMeasure },
  options?: TextaLayoutOptions
): TextaLayout {
  textaLayoutStats.layoutBuilds += 1;
  if (options?.fIncludeCharacterBounds === true) {
    textaLayoutStats.characterBoundsBuilds += 1;
  }
  const contextMeasure = createMeasureTextFn(props, context);
  const rgBoundaryUtf16 = getRgRenderBridgeBoundaryUtf16(props.texta);
  const { lineMetrics, lineWidths, lineHeights, lineAscents, styleDefault } = computeLineMetrics(
    props,
    rgBoundaryUtf16,
    contextMeasure
  );
  const fIncludeCharacterBounds = options?.fIncludeCharacterBounds ?? false;
  const rgrclCharacterBounds: Array<Rc | null> = fIncludeCharacterBounds
    ? new Array(props.texta.rgIdStyleRef.length).fill(null)
    : [];

  if (lineMetrics.length === 0) {
    return {
      lines: [],
      bounds: {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      },
      rgrclCharacterBounds: [],
      styleDefault
    };
  }

  const getLineStartX = (lineWidth: number): number => {
    if (props.align === 'center') {
      return -lineWidth / 2;
    }
    if (props.align === 'right' || props.align === 'end') {
      return -lineWidth;
    }
    return 0;
  };

  const {
    bounds,
    yBaseline,
    firstAscent
  } = calculateTextaBounds(props, lineWidths, lineHeights, lineAscents, styleDefault);

  const lines: TextaLayoutLine[] = [];
  let yLineBaseline = yBaseline;

  for (let i = 0; i < lineMetrics.length; i++) {
    const line = lineMetrics[i] ?? [];
    const lineWidth = lineWidths[i] ?? 0;
    const lineHeight = lineHeights[i] ?? 0;
    const lineAscent = lineAscents[i] ?? firstAscent;
    const yLineTop = yLineBaseline - lineAscent;
    let xRun = getLineStartX(lineWidth);
    const segments: PositionedSegmentMetrics[] = [];

    for (const segment of line) {
      segments.push({
        ...segment,
        x: xRun
      });

      if (fIncludeCharacterBounds) {
        let widthTotalUnits = 0;
        const rgdxUnit: number[] = [];
        for (let iUnit = segment.iStart; iUnit < segment.iEnd; iUnit++) {
          const textUnit = getUnitText(props.texta, rgBoundaryUtf16, iUnit);
          const metrics = contextMeasure(textUnit, segment.font ? { font: segment.font } : { fontSize: segment.fontSize });
          rgdxUnit.push(metrics.width);
          widthTotalUnits += metrics.width;
        }

        const scale = widthTotalUnits > 0 ? segment.width / widthTotalUnits : 1;
        let widthBefore = 0;
        for (let iUnitOffset = 0; iUnitOffset < rgdxUnit.length; iUnitOffset++) {
          const widthAfter = widthBefore + rgdxUnit[iUnitOffset]!;
          rgrclCharacterBounds[segment.iStart + iUnitOffset] = {
            x: xRun + widthBefore * scale,
            y: yLineTop,
            width: Math.max(0, (widthAfter - widthBefore) * scale),
            height: lineHeight
          };
          widthBefore = widthAfter;
        }
      }

      xRun += segment.width;
    }

    lines.push({
      segments,
      width: lineWidth,
      height: lineHeight,
      ascent: lineAscent,
      y: yLineTop,
      yBaseline: yLineBaseline
    });

    yLineBaseline += lineHeight;
  }

  if (fIncludeCharacterBounds) {
    let xFallback = bounds.x + bounds.width;
    let yFallback = bounds.y;
    let heightFallback = lineHeights[0] ?? 0;
    for (let i = 0; i < rgrclCharacterBounds.length; i++) {
      const rc = rgrclCharacterBounds[i];
      if (rc) {
        xFallback = rc.x + rc.width;
        yFallback = rc.y;
        heightFallback = rc.height;
        continue;
      }
      rgrclCharacterBounds[i] = {
        x: xFallback,
        y: yFallback,
        width: 0,
        height: heightFallback
      };
    }
  }

  return {
    lines,
    bounds,
    rgrclCharacterBounds: rgrclCharacterBounds as Rc[],
    styleDefault
  };
}

function buildTextaLayout(
  props: TextaBlockProps,
  context?: { measureText?: (text: string, props: { font?: string; fontSize?: number }) => TextMeasure },
  options?: TextaLayoutOptions
): TextaLayout {
  textaLayoutStats.layoutRequests += 1;
  const fIncludeCharacterBounds = options?.fIncludeCharacterBounds ?? false;
  const stCacheKey = getTextaLayoutCacheKey(props, context);
  const cached = mpstLayoutCache.get(stCacheKey);
  if (cached && (cached.fIncludesCharacterBounds || !fIncludeCharacterBounds)) {
    textaLayoutStats.cacheHits += 1;
    touchMapKey(mpstLayoutCache, stCacheKey);
    return cached.layout;
  }

  textaLayoutStats.cacheMisses += 1;
  const layout = buildTextaLayoutUncached(props, context, options);
  setWithLruTouch(mpstLayoutCache, stCacheKey, {
    layout,
    fIncludesCharacterBounds: fIncludeCharacterBounds
  }, C_LAYOUT_CACHE_MAX);
  return layout;
}

export function clearTextaLayoutCache(): void {
  mpstLayoutCache.clear();
}

export function resetTextaLayoutCacheStats(): void {
  textaLayoutStats.layoutRequests = 0;
  textaLayoutStats.cacheHits = 0;
  textaLayoutStats.cacheMisses = 0;
  textaLayoutStats.layoutBuilds = 0;
  textaLayoutStats.characterBoundsBuilds = 0;
  textaLayoutStats.selectionGeometryResolveCalls = 0;
}

export function getTextaLayoutCacheStats(): TextaLayoutCacheStats {
  const hitRatePercent = textaLayoutStats.layoutRequests > 0
    ? (textaLayoutStats.cacheHits / textaLayoutStats.layoutRequests) * 100
    : 0;
  return {
    cacheEntries: mpstLayoutCache.size,
    layoutRequests: textaLayoutStats.layoutRequests,
    cacheHits: textaLayoutStats.cacheHits,
    cacheMisses: textaLayoutStats.cacheMisses,
    layoutBuilds: textaLayoutStats.layoutBuilds,
    characterBoundsBuilds: textaLayoutStats.characterBoundsBuilds,
    selectionGeometryResolveCalls: textaLayoutStats.selectionGeometryResolveCalls,
    hitRatePercent
  };
}

function createTextaHandlers(): CustomBlockHandlers {
  return {
    render: (block, api): void => {
      const props = block.props as unknown as TextaBlockProps;
      const {
        fill: fillDefault,
        stroke: strokeDefault,
        strokeWidth: strokeWidthDefault
      } = props;
      const layout = buildTextaLayout(props, api.context);
      if (layout.lines.length === 0) {
        return;
      }

      api.setLayoutBounds(layout.bounds);

      for (const line of layout.lines) {
        for (const segment of line.segments) {
          const { style } = segment;
          const fill = style.fill
            ?? (typeof fillDefault === 'string' ? fillDefault : undefined)
            ?? layout.styleDefault.fill;
          const background = style.background;
          const stroke = style.stroke
            ?? (typeof strokeDefault === 'string' ? strokeDefault : undefined)
            ?? layout.styleDefault.stroke;
          const opacity = style.opacity ?? 1;

          if (!fill && !stroke && !background) {
            continue;
          }

          api.context.save();
          api.context.setOpacity(api.context.opacity * opacity);

          if (background) {
            const bgHeight = segment.ascent + segment.descent;
            api.context.drawRectangle(segment.x, line.yBaseline - segment.ascent, segment.width, bgHeight, { fill: background });
          }

          api.context.drawText(segment.text, segment.x, line.yBaseline, {
            font: segment.font,
            fontSize: segment.fontSize,
            fill,
            stroke,
            strokeWidth: strokeWidthDefault,
            align: 'left',
            baseline: 'alphabetic'
          });
          api.context.restore();
        }
      }
    },
    hitTestShape: (block, xl, yl, { layoutCache }): boolean => {
      const cachedBounds = layoutCache?.mpbl_rc.get(block as unknown as Block);
      if (cachedBounds) {
        return xl >= cachedBounds.x
          && xl <= cachedBounds.x + cachedBounds.width
          && yl >= cachedBounds.y
          && yl <= cachedBounds.y + cachedBounds.height;
      }
      const bounds = estimateTextaBounds(block.props as unknown as TextaBlockProps);
      layoutCache?.mpbl_rc.set(block as unknown as Block, bounds);
      return xl >= bounds.x
        && xl <= bounds.x + bounds.width
        && yl >= bounds.y
        && yl <= bounds.y + bounds.height;
    },
    rcl: (block): Rc => estimateTextaBounds(block.props as unknown as TextaBlockProps),
    getDebugOutlineBounds: (block, api): Rc => buildTextaLayout(block.props as unknown as TextaBlockProps, api.context).bounds,
    getSelectionGeometry: (block, api) => {
      const props = block.props as unknown as TextaBlockProps;
      if (typeof props.id !== 'string' || props.id.length === 0) {
        return null;
      }

      return {
        blockId: props.id,
        layoutSignature: buildTextaLayoutSignature(props),
        resolveCharacterBounds: (): Rc[] => {
          textaLayoutStats.selectionGeometryResolveCalls += 1;
          return buildTextaLayout(props, api.context, { fIncludeCharacterBounds: true }).rgrclCharacterBounds;
        }
      };
    }
  };
}

PerformanceMonitor.registerStatsHook('textaLayoutCache', () => getTextaLayoutCacheStats());

let fRegistered = false;

export function registerTextaBlockType(): void {
  if (fRegistered) {
    return;
  }
  registerBlockType(stBlockTypeTexta, createTextaHandlers());
  fRegistered = true;
}

export function texta(props: TextaBlockProps, children?: Block[]): Block {
  return customBlock(stBlockTypeTexta, props, children);
}
