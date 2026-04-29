import type { AttributedTextValue } from './types.ts';
import { getRgRenderBridgeRun } from './render-bridges.ts';
import {
  customBlock,
  registerBlockType,
  measureText,
  calculateTextOffset,
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
};

type SegmentMetrics = {
  text: string;
  style: StyleEntryLike;
  font: string | undefined;
  width: number;
  ascent: number;
  descent: number;
  fontSize: number;
  lineHeight: number;
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
    font,
    width: metrics.width,
    ascent: metrics.ascent,
    descent: metrics.descent,
    fontSize,
    lineHeight: getLineHeight(segment.style, styleDefault, defaults.lineHeight, defaults.fontSize)
  };
}

function splitRunLines(props: TextaBlockProps): Segment[][] {
  const runs = getRgRenderBridgeRun(props.texta);
  const styleDefault = getDefaultStyle(props);
  const mpStyleById = props.texta.mpId_StyleEntry as Record<number, StyleEntryLike>;
  const lineSegments: Segment[][] = [[]];

  for (const run of runs) {
    const style = mpStyleById[run.idStyle] ?? styleDefault;
    const parts = run.strSlice.split('\n');
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].length > 0) {
        lineSegments[lineSegments.length - 1].push({ text: parts[i], style });
      }
      if (i < parts.length - 1) {
        lineSegments.push([]);
      }
    }
  }

  return lineSegments;
}

function computeLineMetrics(
  props: TextaBlockProps,
  contextMeasure: (text: string, props: { font?: string; fontSize?: number }) => TextMeasure
): { lineMetrics: SegmentMetrics[][]; lineWidths: number[]; lineHeights: number[]; lineAscents: number[]; styleDefault: StyleEntryLike } {
  const styleDefault = getDefaultStyle(props);
  const lineSegments = splitRunLines(props);

  let lineMetrics: SegmentMetrics[][];
  if (props.dx !== undefined) {
    lineMetrics = [];
    for (const segments of lineSegments) {
      const atoms: SegmentMetrics[] = [];
      for (const segment of segments) {
        const parts = segment.text.split(' ');
        for (let i = 0; i < parts.length; i++) {
          const token = i < parts.length - 1 ? `${parts[i]} ` : parts[i];
          if (token.length > 0) {
            atoms.push(measureSegment({ text: token, style: segment.style }, styleDefault, contextMeasure, props));
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
    return Math.max(...line.map((segment) => segment.ascent), lineHeights[i]! * 0.7);
  });

  return { lineMetrics, lineWidths, lineHeights, lineAscents, styleDefault };
}

function estimateBounds(props: TextaBlockProps): Rc {
  const textValue = props.texta.strText;
  const metrics = measureText(textValue, { font: props.font, fontSize: props.fontSize });
  const lineHeight = props.lineHeight ?? props.fontSize ?? 16;
  const totalHeight = props.dx === undefined
    ? metrics.height
    : Math.max(lineHeight, Math.ceil(Math.max(1, metrics.width) / Math.max(1, props.dx)) * lineHeight);
  const width = props.dx === undefined ? metrics.width : Math.min(metrics.width, props.dx);
  const { xOffset, yOffset } = calculateTextOffset(
    width,
    totalHeight,
    metrics.ascent,
    props.align,
    props.baseline
  );
  return { x: xOffset, y: yOffset, width, height: totalHeight };
}

function createTextaHandlers(): CustomBlockHandlers {
  return {
    render: (block, api): void => {
      const props = block.props as unknown as TextaBlockProps;
      const {
        align,
        baseline,
        fill: fillDefault,
        stroke: strokeDefault,
        strokeWidth: strokeWidthDefault
      } = props;
      const { lineMetrics, lineWidths, lineHeights, lineAscents, styleDefault } = computeLineMetrics(
        props,
        (text, metricsProps) => {
          if (api.context.measureText) {
            return api.context.measureText(text, metricsProps);
          }
          const fontSize = metricsProps.fontSize ?? props.fontSize ?? 16;
          return { width: text.length * fontSize * SF_TEXT_ADVANCE_APPROX_DEFAULT, height: fontSize, ascent: fontSize, descent: 0 };
        }
      );
      if (lineMetrics.length === 0) {
        return;
      }

      const totalHeight = lineHeights.reduce((sum, height) => sum + height, 0);
      const firstAscent = lineAscents[0] ?? (props.fontSize ?? styleDefault.fontSize ?? 16);
      let yBaseline = 0;
      if (baseline === 'top') {
        yBaseline = firstAscent;
      } else if (baseline === 'middle') {
        yBaseline = -totalHeight / 2 + firstAscent;
      } else if (baseline === 'bottom') {
        yBaseline = -totalHeight + firstAscent;
      } else if (baseline === 'hanging') {
        yBaseline = firstAscent * 0.8;
      }

      const getLineStartX = (lineWidth: number): number => {
        if (align === 'center') {
          return -lineWidth / 2;
        }
        if (align === 'right' || align === 'end') {
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

      api.setLayoutBounds({
        x: xMin,
        y: yTop,
        width: Math.max(0, xMax - xMin),
        height: Math.max(0, totalHeight)
      });

      for (let i = 0; i < lineMetrics.length; i++) {
        const line = lineMetrics[i]!;
        let xRun = getLineStartX(lineWidths[i] ?? 0);

        for (const segment of line) {
          const { style } = segment;
          const fill = style.fill
            ?? (typeof fillDefault === 'string' ? fillDefault : undefined)
            ?? styleDefault.fill;
          const background = style.background;
          const stroke = style.stroke
            ?? (typeof strokeDefault === 'string' ? strokeDefault : undefined)
            ?? styleDefault.stroke;
          const opacity = style.opacity ?? 1;

          if (!fill && !stroke && !background) {
            xRun += segment.width;
            continue;
          }

          api.context.save();
          api.context.setOpacity(api.context.opacity * opacity);

          if (background) {
            const bgHeight = segment.ascent + segment.descent;
            api.context.drawRectangle(xRun, yBaseline - segment.ascent, segment.width, bgHeight, { fill: background });
          }

          api.context.drawText(segment.text, xRun, yBaseline, {
            font: segment.font,
            fontSize: segment.fontSize,
            fill,
            stroke,
            strokeWidth: strokeWidthDefault,
            align: 'left',
            baseline: 'alphabetic'
          });
          api.context.restore();
          xRun += segment.width;
        }

        yBaseline += lineHeights[i] ?? 0;
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
      const bounds = estimateBounds(block.props as unknown as TextaBlockProps);
      return xl >= bounds.x
        && xl <= bounds.x + bounds.width
        && yl >= bounds.y
        && yl <= bounds.y + bounds.height;
    },
    rcl: (block): Rc => estimateBounds(block.props as unknown as TextaBlockProps),
    getDebugOutlineBounds: (block): Rc => estimateBounds(block.props as unknown as TextaBlockProps)
  };
}

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
