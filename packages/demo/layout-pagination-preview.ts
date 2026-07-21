import { group, rectangle, text } from 'vitrine';
import type { Block } from 'vitrine';
import {
  normalizeLayoutInsets,
  type BoxLayoutNode,
  type FixedLayoutNode,
  type LayoutDocument,
  type LayoutFragment,
  type LayoutInsets,
  type LayoutNode,
  type LayoutRect,
  type PaginatedLayoutResult,
  type PaginatedPage,
  type ResolvedPageSpec,
  type StackLayoutNode,
  type TextLayoutNode
} from 'vitrine-layout-pagination';

interface RenderTheme {
  canvasFill: string;
  pageFill: string;
  pageStroke: string;
  shadowFill: string;
  textFill: string;
  mutedTextFill: string;
  accentFill: string;
  artifactFills: Record<'background' | 'header' | 'footer' | 'foreground', string>;
}

interface FlowPreviewOptions {
  x?: number;
  y?: number;
  scale?: number;
  pageGap?: number;
  columns?: number;
  showPageLabels?: boolean;
}

interface PresentationPreviewOptions {
  x?: number;
  y?: number;
  mainScale?: number;
  thumbnailScale?: number;
  thumbnailGap?: number;
  currentPageIndex?: number;
}

function scaleLength(value: number, scale: number): number {
  return value * scale;
}

function scaleInsets(insets: LayoutInsets, scale: number): LayoutInsets {
  return {
    top: insets.top * scale,
    right: insets.right * scale,
    bottom: insets.bottom * scale,
    left: insets.left * scale
  };
}

function scaleFontString(font: string | undefined, scale: number): string | undefined {
  if (!font) {
    return undefined;
  }
  return font.replace(/(\d+(?:\.\d+)?)px/g, (_match, size) => `${Math.max(1, Number(size) * scale)}px`);
}

const themeDefault: RenderTheme = {
  canvasFill: '#0f172a',
  pageFill: '#ffffff',
  pageStroke: '#cbd5e1',
  shadowFill: 'rgba(15, 23, 42, 0.14)',
  textFill: '#0f172a',
  mutedTextFill: '#475569',
  accentFill: '#2563eb',
  artifactFills: {
    background: 'rgba(59, 130, 246, 0.06)',
    header: 'rgba(59, 130, 246, 0.08)',
    footer: 'rgba(148, 163, 184, 0.10)',
    foreground: 'rgba(14, 165, 233, 0.05)'
  }
};

function scaleRect(rect: LayoutRect, pageX: number, pageY: number, scale: number): LayoutRect {
  return {
    x: pageX + rect.x * scale,
    y: pageY + rect.y * scale,
    width: rect.width * scale,
    height: rect.height * scale
  };
}

function estimateTextHeight(node: TextLayoutNode, width: number): number {
  const fontSize = typeof node.textStyle?.fontSize === 'number' ? node.textStyle.fontSize : 16;
  const lineHeight = typeof node.textStyle?.lineHeight === 'number' ? node.textStyle.lineHeight : fontSize * 1.4;
  const cCharsPerLine = Math.max(1, Math.floor(Math.max(width, fontSize) / Math.max(1, fontSize * 0.58)));
  return node.text
    .split('\n')
    .reduce((count, line) => count + Math.max(1, Math.ceil(line.length / cCharsPerLine)), 0) * lineHeight;
}

function estimateNodeHeight(node: LayoutNode, width: number): number {
  switch (node.kind) {
    case 'text':
      return estimateTextHeight(node, width);
    case 'spacer':
      return node.size;
    case 'box': {
      const insets = normalizeLayoutInsets(node.padding);
      const childHeight = node.child ? estimateNodeHeight(node.child, Math.max(0, width - insets.left - insets.right)) : 0;
      const naturalHeight = childHeight + insets.top + insets.bottom;
      let nextHeight = node.height ?? naturalHeight;
      if (node.minHeight !== undefined) {
        nextHeight = Math.max(nextHeight, node.minHeight);
      }
      if (node.maxHeight !== undefined) {
        nextHeight = Math.min(nextHeight, node.maxHeight);
      }
      return nextHeight;
    }
    case 'stack': {
      const insets = normalizeLayoutInsets(node.padding);
      const innerWidth = Math.max(0, width - insets.left - insets.right);
      let height = insets.top + insets.bottom;
      node.children.forEach((child, index) => {
        height += estimateNodeHeight(child, innerWidth);
        if (index < node.children.length - 1) {
          height += node.gap ?? 0;
        }
      });
      return height;
    }
    case 'measured':
    case 'table':
      return 96;
    case 'pageBreak':
      return 0;
    case 'fixed':
      return estimateNodeHeight(node.child, width);
  }
}

function findNodeById(node: LayoutNode | undefined, id: string): LayoutNode | null {
  if (!node) {
    return null;
  }
  if (node.id === id) {
    return node;
  }
  switch (node.kind) {
    case 'stack':
      for (const child of node.children) {
        const found = findNodeById(child, id);
        if (found) {
          return found;
        }
      }
      return null;
    case 'box':
      return node.child ? findNodeById(node.child, id) : null;
    case 'fixed':
      return findNodeById(node.child, id);
    default:
      return null;
  }
}

function lookupNode(document: LayoutDocument, fragment: LayoutFragment, pageIndex: number): LayoutNode | null {
  if (fragment.artifactKind) {
    switch (fragment.artifactKind) {
      case 'background':
        return document.background ?? null;
      case 'foreground':
        return document.foreground ?? null;
      case 'header':
        return document.kind === 'flow' ? document.header ?? null : null;
      case 'footer':
        return document.kind === 'flow' ? document.footer ?? null : null;
    }
  }

  if (document.kind === 'presentation') {
    return document.slides[pageIndex] ?? null;
  }

  if (!fragment.nodeId) {
    return null;
  }
  return findNodeById(document.body, fragment.nodeId)
    ?? findNodeById(document.header, fragment.nodeId)
    ?? findNodeById(document.footer, fragment.nodeId)
    ?? findNodeById(document.background, fragment.nodeId)
    ?? findNodeById(document.foreground, fragment.nodeId);
}

function buildTextBlock(node: TextLayoutNode, rect: LayoutRect, theme: RenderTheme, scale: number): Block {
  const fontSize = (typeof node.textStyle?.fontSize === 'number' ? node.textStyle.fontSize : 16) * scale;
  const dyLineHeight = (typeof node.textStyle?.lineHeight === 'number'
    ? node.textStyle.lineHeight
    : (typeof node.textStyle?.fontSize === 'number' ? node.textStyle.fontSize : 16) * 1.4) * scale;
  const fill = typeof node.textStyle?.fill === 'string' ? node.textStyle.fill : theme.textFill;
  const font = typeof node.textStyle?.font === 'string'
    ? scaleFontString(node.textStyle.font, scale)
    : undefined;
  return text({
    x: rect.x,
    y: rect.y,
    text: node.text,
    dx: rect.width,
    fontSize,
    dyLineHeight,
    font,
    fill,
    baseline: 'top'
  });
}

function buildBoxBlocks(node: BoxLayoutNode, rect: LayoutRect, theme: RenderTheme, scale: number): Block[] {
  const insets = scaleInsets(normalizeLayoutInsets(node.padding), scale);
  const fill = rect.height <= 64 ? '#dbeafe' : '#eff6ff';
  const blocks: Block[] = [
    rectangle({
      x: rect.x,
      y: rect.y,
      dx: rect.width,
      dy: rect.height,
      fill,
      stroke: '#93c5fd',
      strokeWidth: 1,
      cornerRadius: 12 * scale
    })
  ];

  if (node.child) {
    blocks.push(...renderNodeIntoRect(node.child, {
      x: rect.x + insets.left,
      y: rect.y + insets.top,
      width: Math.max(0, rect.width - insets.left - insets.right),
      height: Math.max(0, rect.height - insets.top - insets.bottom)
    }, theme, scale));
  }
  return blocks;
}

function buildMeasuredPlaceholder(node: LayoutNode, rect: LayoutRect, label: string, theme: RenderTheme, scale: number): Block[] {
  return [
    rectangle({
      x: rect.x,
      y: rect.y,
      dx: rect.width,
      dy: rect.height,
      fill: '#f8fafc',
      stroke: '#cbd5e1',
      strokeWidth: 1,
      cornerRadius: 10 * scale
    }),
    text({
      x: rect.x + 16 * scale,
      y: rect.y + 16 * scale,
      text: label,
      fontSize: 14 * scale,
      fill: theme.mutedTextFill,
      baseline: 'top'
    })
  ];
}

function renderStackIntoRect(node: StackLayoutNode, rect: LayoutRect, theme: RenderTheme, scale: number): Block[] {
  const insets = scaleInsets(normalizeLayoutInsets(node.padding), scale);
  const innerRect: LayoutRect = {
    x: rect.x + insets.left,
    y: rect.y + insets.top,
    width: Math.max(0, rect.width - insets.left - insets.right),
    height: Math.max(0, rect.height - insets.top - insets.bottom)
  };
  let yCursor = innerRect.y;
  const blocks: Block[] = [];

  node.children.forEach((child, index) => {
    const childHeight = estimateNodeHeight(child, innerRect.width / Math.max(scale, 0.0001)) * scale;
    const childRect: LayoutRect = {
      x: innerRect.x,
      y: yCursor,
      width: innerRect.width,
      height: childHeight
    };
    blocks.push(...renderNodeIntoRect(child, childRect, theme, scale));
    yCursor += childHeight;
    if (index < node.children.length - 1) {
      yCursor += (node.gap ?? 0) * scale;
    }
  });

  return blocks;
}

function renderNodeIntoRect(node: LayoutNode, rect: LayoutRect, theme: RenderTheme, scale: number): Block[] {
  switch (node.kind) {
    case 'text':
      return [buildTextBlock(node, rect, theme, scale)];
    case 'spacer':
      return [];
    case 'stack':
      return renderStackIntoRect(node, rect, theme, scale);
    case 'box':
      return buildBoxBlocks(node, rect, theme, scale);
    case 'measured':
      return buildMeasuredPlaceholder(node, rect, `Measured: ${node.measureKey}`, theme, scale);
    case 'table':
      return buildMeasuredPlaceholder(node, rect, `Table: ${node.tableId}`, theme, scale);
    case 'fixed':
      return renderNodeIntoRect((node as FixedLayoutNode).child, rect, theme, scale);
    case 'pageBreak':
      return [];
  }
}

function renderPageFragments(
  document: LayoutDocument,
  page: PaginatedPage,
  pageX: number,
  pageY: number,
  scale: number,
  theme: RenderTheme
): Block[] {
  const blocks: Block[] = [
    rectangle({
      x: pageX + 8,
      y: pageY + 10,
      dx: page.page.width * scale,
      dy: page.page.height * scale,
      fill: theme.shadowFill,
      cornerRadius: 18
    }),
    rectangle({
      x: pageX,
      y: pageY,
      dx: page.page.width * scale,
      dy: page.page.height * scale,
      fill: theme.pageFill,
      stroke: theme.pageStroke,
      strokeWidth: 1,
      cornerRadius: 18
    })
  ];

  for (const fragment of page.fragments) {
    const rectScaled = scaleRect(fragment.rect, pageX, pageY, scale);
    if (fragment.artifactKind) {
      blocks.push(rectangle({
        x: rectScaled.x,
        y: rectScaled.y,
        dx: rectScaled.width,
        dy: rectScaled.height,
        fill: theme.artifactFills[fragment.artifactKind]
      }));
    }
    const node = lookupNode(document, fragment, page.index);
    if (!node) {
      continue;
    }
    blocks.push(...renderNodeIntoRect(node, rectScaled, theme, scale));
  }

  return blocks;
}

export function buildFlowDocumentPreview(
  document: LayoutDocument,
  result: PaginatedLayoutResult,
  options: FlowPreviewOptions = {}
): Block {
  const xStart = options.x ?? 40;
  const yStart = options.y ?? 60;
  const scale = options.scale ?? 0.34;
  const pageGap = options.pageGap ?? 28;
  const cColumns = Math.max(1, options.columns ?? 2);
  const pageWidthScaled = result.page.width * scale;
  const pageHeightScaled = result.page.height * scale;
  const pageStrideX = pageWidthScaled + pageGap;
  const pageStrideY = pageHeightScaled + pageGap;
  const children: Block[] = [
    rectangle({
      dx: 1280,
      dy: 900,
      fill: themeDefault.canvasFill
    }),
    text({
      x: 44,
      y: 26,
      text: `Flow document preview · ${result.pages.length} pages`,
      fontSize: 22,
      fill: '#e2e8f0',
      baseline: 'top'
    }),
    text({
      x: 44,
      y: 58,
      text: 'Semantic pagination with repeated page furniture and page breaks.',
      fontSize: 13,
      fill: '#94a3b8',
      baseline: 'top'
    })
  ];

  result.pages.forEach((page, index) => {
    const col = index % cColumns;
    const row = Math.floor(index / cColumns);
    const pageX = xStart + col * pageStrideX;
    const pageY = yStart + row * pageStrideY;
    children.push(...renderPageFragments(document, page, pageX, pageY, scale, themeDefault));
    if (options.showPageLabels !== false) {
      children.push(text({
        x: pageX + 14,
        y: pageY + 14,
        text: `Page ${index + 1}`,
        fontSize: 11,
        fill: themeDefault.mutedTextFill,
        baseline: 'top'
      }));
    }
  });

  return group({}, children);
}

export function buildPresentationPreview(
  document: LayoutDocument,
  result: PaginatedLayoutResult,
  options: PresentationPreviewOptions = {}
): Block {
  const iCurrent = Math.max(0, Math.min(options.currentPageIndex ?? 0, result.pages.length - 1));
  const mainScale = options.mainScale ?? 0.5;
  const thumbScale = options.thumbnailScale ?? 0.14;
  const thumbGap = options.thumbnailGap ?? 18;
  const xStart = options.x ?? 40;
  const yStart = options.y ?? 64;
  const pageMain = result.pages[iCurrent]!;
  const dxMain = result.page.width * mainScale;
  const dyMain = result.page.height * mainScale;
  const children: Block[] = [
    rectangle({
      dx: 1280,
      dy: 860,
      fill: '#020617'
    }),
    text({
      x: 44,
      y: 26,
      text: `Presentation preview · slide ${iCurrent + 1} of ${result.pages.length}`,
      fontSize: 22,
      fill: '#e2e8f0',
      baseline: 'top'
    }),
    text({
      x: 44,
      y: 58,
      text: 'Explicit slide pages with fixed 16:9 geometry for browser presentations.',
      fontSize: 13,
      fill: '#94a3b8',
      baseline: 'top'
    }),
    ...renderPageFragments(document, pageMain, xStart, yStart, mainScale, themeDefault)
  ];

  result.pages.forEach((page, index) => {
    const thumbX = xStart + index * (result.page.width * thumbScale + thumbGap);
    const thumbY = yStart + dyMain + 34;
    const scale = thumbScale;
    children.push(...renderPageFragments(document, page, thumbX, thumbY, scale, {
      ...themeDefault,
      pageStroke: index === iCurrent ? themeDefault.accentFill : themeDefault.pageStroke
    }));
    children.push(text({
      x: thumbX + 8,
      y: thumbY + 8,
      text: String(index + 1),
      fontSize: 10,
      fill: index === iCurrent ? themeDefault.accentFill : themeDefault.mutedTextFill,
      baseline: 'top'
    }));
  });

  return group({}, children);
}
