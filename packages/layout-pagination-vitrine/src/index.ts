import { group, rectangle, text } from 'vitrine';
import type { Block, GroupProps } from 'vitrine';
import {
  normalizeLayoutInsets,
  type BoxLayoutNode,
  type LayoutAvailableSpace,
  type LayoutDocument,
  type LayoutFragment,
  type LayoutIntrinsicSize,
  type LayoutMeasureDelegate,
  type LayoutMeasureRequest,
  type LayoutMeasuredContent,
  type LayoutNode,
  type LayoutRect,
  type MeasuredLayoutNode,
  type PageArtifactKind,
  type PaginatedLayoutResult,
  type PaginatedPage,
  type ResolvedPageSpec,
  type StackLayoutNode,
  type TableLayoutNode,
  type TextLayoutNode
} from 'vitrine-layout-pagination';

export interface VitrineLayoutContentRenderContext<TNodeId extends string = string> {
  nodeId?: TNodeId;
  nodeKind: LayoutNode<TNodeId>['kind'];
  pageIndex: number;
  frame: LayoutRect;
  pageRect: LayoutRect;
  scale: number;
  renderData?: unknown;
}

export interface VitrineLayoutLeafContent<TNodeId extends string = string> {
  blocks?: Block[];
  renderBlocks?: (context: VitrineLayoutContentRenderContext<TNodeId>) => Block[];
  intrinsicSize?: LayoutIntrinsicSize;
  clip?: boolean;
}

export type VitrineLayoutDocument<TNodeId extends string = string> = LayoutDocument<
  TNodeId,
  VitrineLayoutLeafContent<TNodeId>,
  VitrineLayoutLeafContent<TNodeId>
>;

type VitrineLayoutNode<TNodeId extends string = string> = LayoutNode<
  TNodeId,
  VitrineLayoutLeafContent<TNodeId>,
  VitrineLayoutLeafContent<TNodeId>
>;

type VitrineLeafLayoutNode<TNodeId extends string = string> =
  | MeasuredLayoutNode<TNodeId, VitrineLayoutLeafContent<TNodeId>>
  | TableLayoutNode<TNodeId, VitrineLayoutLeafContent<TNodeId>>;

export interface VitrineLayoutMeasureRequest<TNodeId extends string = string> {
  node: VitrineLeafLayoutNode<TNodeId>;
  content: VitrineLayoutLeafContent<TNodeId>;
  availableSpace: LayoutAvailableSpace;
  page: ResolvedPageSpec;
}

export interface CreateVitrineLayoutMeasureDelegateOptions<TNodeId extends string = string> {
  measureMeasuredContent?: (request: VitrineLayoutMeasureRequest<TNodeId>) => LayoutMeasuredContent | null;
  measureTableContent?: (request: VitrineLayoutMeasureRequest<TNodeId>) => LayoutMeasuredContent | null;
  fallbackIntrinsicSize?: LayoutIntrinsicSize;
}

export interface BuildVitrineBlocksFromPaginatedPageOptions {
  x?: number;
  y?: number;
  scale?: number;
  rootGroupProps?: GroupProps;
  showPageShadow?: boolean;
  showPageFrame?: boolean;
  pageFill?: string;
  pageStroke?: string;
  pageStrokeWidth?: number;
  pageCornerRadius?: number;
  pageShadowFill?: string;
  pageShadowOffsetX?: number;
  pageShadowOffsetY?: number;
  pageShadowCornerRadius?: number;
  artifactFills?: Partial<Record<PageArtifactKind, string>>;
  defaultTextFill?: string;
}

export interface BuildVitrineBlocksFromPaginatedLayoutOptions
  extends Omit<BuildVitrineBlocksFromPaginatedPageOptions, 'x' | 'y' | 'rootGroupProps'> {
  x?: number;
  y?: number;
  columns?: number;
  pageGap?: number;
  rootGroupProps?: GroupProps;
}

export interface VitrinePreviewTheme {
  canvasFill: string;
  pageFill: string;
  pageStroke: string;
  shadowFill: string;
  textFill: string;
  mutedTextFill: string;
  accentFill: string;
  artifactFills: Partial<Record<PageArtifactKind, string>>;
}

export interface FlowPreviewOptions {
  x?: number;
  y?: number;
  scale?: number;
  pageGap?: number;
  columns?: number;
  showPageLabels?: boolean;
  theme?: Partial<VitrinePreviewTheme>;
}

export interface PresentationPreviewOptions {
  x?: number;
  y?: number;
  mainScale?: number;
  thumbnailScale?: number;
  thumbnailGap?: number;
  currentPageIndex?: number;
  theme?: Partial<VitrinePreviewTheme>;
}

export const themeDefault: VitrinePreviewTheme = {
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

function mergePreviewTheme(theme?: Partial<VitrinePreviewTheme>): VitrinePreviewTheme {
  return {
    ...themeDefault,
    ...theme,
    artifactFills: {
      ...themeDefault.artifactFills,
      ...theme?.artifactFills
    }
  };
}

function estimateTextHeight(node: TextLayoutNode, availableWidth: number): number {
  const fontSize = typeof node.textStyle?.fontSize === 'number' ? node.textStyle.fontSize : 16;
  const lineHeight = typeof node.textStyle?.lineHeight === 'number' ? node.textStyle.lineHeight : fontSize * 1.4;
  const cCharsPerLine = Math.max(1, Math.floor(Math.max(availableWidth, fontSize) / Math.max(1, fontSize * 0.58)));
  return node.text
    .split('\n')
    .reduce((count: number, line: string) => count + Math.max(1, Math.ceil(line.length / cCharsPerLine)), 0) * lineHeight;
}

function resolveLeafContent<TNodeId extends string>(
  node: VitrineLayoutNode<TNodeId>
): VitrineLayoutLeafContent<TNodeId> | null {
  switch (node.kind) {
    case 'measured':
    case 'table':
      return node.content;
    default:
      return null;
  }
}

function estimateNodeHeight<TNodeId extends string>(
  node: VitrineLayoutNode<TNodeId>,
  availableWidth: number
): number {
  switch (node.kind) {
    case 'text':
      return estimateTextHeight(node, availableWidth);
    case 'spacer':
      return node.size;
    case 'box': {
      const insets = normalizeLayoutInsets(node.padding);
      const childHeight = node.child
        ? estimateNodeHeight(node.child, Math.max(0, availableWidth - insets.left - insets.right))
        : 0;
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
      const innerWidth = Math.max(0, availableWidth - insets.left - insets.right);
      let height = insets.top + insets.bottom;
      node.children.forEach((child: VitrineLayoutNode<TNodeId>, index: number) => {
        height += estimateNodeHeight(child, innerWidth);
        if (index < node.children.length - 1) {
          height += node.gap ?? 0;
        }
      });
      return height;
    }
    case 'measured':
    case 'table':
      return resolveLeafContent(node)?.intrinsicSize?.minHeight ?? 0;
    case 'pageBreak':
      return 0;
    case 'fixed':
      return estimateNodeHeight(node.child, availableWidth);
  }

  return 0;
}

function findNodeById<TNodeId extends string>(
  node: VitrineLayoutNode<TNodeId> | undefined,
  id: string
): VitrineLayoutNode<TNodeId> | null {
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

function lookupNode<TNodeId extends string>(
  document: VitrineLayoutDocument<TNodeId>,
  fragment: LayoutFragment<TNodeId>,
  pageIndex: number
): VitrineLayoutNode<TNodeId> | null {
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

function buildTextBlock(
  node: TextLayoutNode,
  rect: LayoutRect,
  defaultTextFill: string
): Block {
  return text({
    x: rect.x,
    y: rect.y,
    text: node.text,
    dx: rect.width,
    font: node.textStyle?.font,
    fontSize: node.textStyle?.fontSize,
    dyLineHeight: node.textStyle?.lineHeight,
    fill: node.textStyle?.fill ?? defaultTextFill,
    baseline: 'top'
  });
}

function renderLeafNode<TNodeId extends string>(
  node: VitrineLeafLayoutNode<TNodeId>,
  rect: LayoutRect,
  pageIndex: number,
  scale: number,
  renderData?: unknown
): Block[] {
  const content = resolveLeafContent(node);
  if (!content) {
    return [];
  }

  const rgblChildren = content.renderBlocks
    ? content.renderBlocks({
        nodeId: node.id,
        nodeKind: node.kind,
        pageIndex,
        frame: {
          x: 0,
          y: 0,
          width: rect.width,
          height: rect.height
        },
        pageRect: rect,
        scale,
        renderData
      })
    : (content.blocks ?? []);

  return [
    group({
      x: rect.x,
      y: rect.y,
      clip: content.clip ?? false,
      dx: rect.width,
      dy: rect.height
    }, rgblChildren)
  ];
}

function renderBoxIntoRect<TNodeId extends string>(
  node: BoxLayoutNode<TNodeId>,
  rect: LayoutRect,
  pageIndex: number,
  scale: number,
  defaultTextFill: string
): Block[] {
  if (!node.child) {
    return [];
  }
  const insets = normalizeLayoutInsets(node.padding);
  return renderNodeIntoRect(node.child, {
    x: rect.x + insets.left,
    y: rect.y + insets.top,
    width: Math.max(0, rect.width - insets.left - insets.right),
    height: Math.max(0, rect.height - insets.top - insets.bottom)
  }, pageIndex, scale, defaultTextFill);
}

function renderStackIntoRect<TNodeId extends string>(
  node: StackLayoutNode<TNodeId>,
  rect: LayoutRect,
  pageIndex: number,
  scale: number,
  defaultTextFill: string
): Block[] {
  const insets = normalizeLayoutInsets(node.padding);
  const innerRect: LayoutRect = {
    x: rect.x + insets.left,
    y: rect.y + insets.top,
    width: Math.max(0, rect.width - insets.left - insets.right),
    height: Math.max(0, rect.height - insets.top - insets.bottom)
  };
  let yCursor = innerRect.y;
  const rgblBlocks: Block[] = [];

  node.children.forEach((child: VitrineLayoutNode<TNodeId>, index: number) => {
    const dyChild = estimateNodeHeight(child, innerRect.width);
    const childRect: LayoutRect = {
      x: innerRect.x,
      y: yCursor,
      width: innerRect.width,
      height: dyChild
    };
    rgblBlocks.push(...renderNodeIntoRect(child, childRect, pageIndex, scale, defaultTextFill));
    yCursor += dyChild;
    if (index < node.children.length - 1) {
      yCursor += node.gap ?? 0;
    }
  });

  return rgblBlocks;
}

function renderNodeIntoRect<TNodeId extends string>(
  node: VitrineLayoutNode<TNodeId>,
  rect: LayoutRect,
  pageIndex: number,
  scale: number,
  defaultTextFill: string,
  renderData?: unknown
): Block[] {
  switch (node.kind) {
    case 'text':
      return [buildTextBlock(node, rect, defaultTextFill)];
    case 'spacer':
    case 'pageBreak':
      return [];
    case 'stack':
      return renderStackIntoRect(node, rect, pageIndex, scale, defaultTextFill);
    case 'box':
      return renderBoxIntoRect(node, rect, pageIndex, scale, defaultTextFill);
    case 'measured':
    case 'table':
      return renderLeafNode(node, rect, pageIndex, scale, renderData);
    case 'fixed':
      return renderNodeIntoRect(node.child, rect, pageIndex, scale, defaultTextFill, renderData);
  }

  return [];
}

function resolvePreferredMeasuredContent(
  intrinsicSize: LayoutIntrinsicSize,
  availableSpace: LayoutAvailableSpace
): LayoutMeasuredContent {
  const dxPreferred = Math.max(
    intrinsicSize.minWidth,
    Math.min(availableSpace.width, intrinsicSize.maxWidth)
  );

  return {
    intrinsicSize,
    preferredRect: {
      x: 0,
      y: 0,
      width: Number.isFinite(dxPreferred) ? dxPreferred : availableSpace.width,
      height: intrinsicSize.minHeight
    }
  };
}

export function createVitrineLayoutMeasureDelegate<TNodeId extends string = string>(
  options: CreateVitrineLayoutMeasureDelegateOptions<TNodeId> = {}
): LayoutMeasureDelegate<TNodeId> {
  const fallbackIntrinsicSize = options.fallbackIntrinsicSize ?? {
    minWidth: 0,
    maxWidth: Number.POSITIVE_INFINITY,
    minHeight: 0
  };

  return {
    measure(request: LayoutMeasureRequest<TNodeId>): LayoutMeasuredContent | null {
      if (request.node.kind !== 'measured' && request.node.kind !== 'table') {
        return null;
      }

      const content = request.node.content as VitrineLayoutLeafContent<TNodeId>;
      const rsRequest: VitrineLayoutMeasureRequest<TNodeId> = {
        node: request.node as VitrineLeafLayoutNode<TNodeId>,
        content,
        availableSpace: request.availableSpace,
        page: request.page
      };

      const measured = request.node.kind === 'measured'
        ? options.measureMeasuredContent?.(rsRequest)
        : options.measureTableContent?.(rsRequest);
      if (measured) {
        return measured;
      }

      return resolvePreferredMeasuredContent(content.intrinsicSize ?? fallbackIntrinsicSize, request.availableSpace);
    }
  };
}

export function buildVitrineBlocksFromPaginatedPage<TNodeId extends string = string>(
  document: VitrineLayoutDocument<TNodeId>,
  page: PaginatedPage<TNodeId>,
  options: BuildVitrineBlocksFromPaginatedPageOptions = {}
): Block {
  const x = options.x ?? 0;
  const y = options.y ?? 0;
  const scale = options.scale ?? 1;
  const rgblChildren: Block[] = [];

  if (options.showPageShadow) {
    rgblChildren.push(rectangle({
      x: options.pageShadowOffsetX ?? 8,
      y: options.pageShadowOffsetY ?? 10,
      dx: page.page.width,
      dy: page.page.height,
      fill: options.pageShadowFill ?? themeDefault.shadowFill,
      cornerRadius: options.pageShadowCornerRadius ?? 18
    }));
  }

  if (options.showPageFrame) {
    rgblChildren.push(rectangle({
      x: 0,
      y: 0,
      dx: page.page.width,
      dy: page.page.height,
      fill: options.pageFill ?? themeDefault.pageFill,
      stroke: options.pageStroke ?? themeDefault.pageStroke,
      strokeWidth: options.pageStrokeWidth ?? 1,
      cornerRadius: options.pageCornerRadius ?? 18
    }));
  }

  for (const fragment of page.fragments) {
    if (fragment.artifactKind) {
      const artifactFill = options.artifactFills?.[fragment.artifactKind];
      if (artifactFill !== undefined) {
        rgblChildren.push(rectangle({
          x: fragment.rect.x,
          y: fragment.rect.y,
          dx: fragment.rect.width,
          dy: fragment.rect.height,
          fill: artifactFill
        }));
      }
    }

    const node = lookupNode(document, fragment, page.index);
    if (!node) {
      continue;
    }

    rgblChildren.push(
      ...renderNodeIntoRect(
        node,
        fragment.rect,
        page.index,
        scale,
        options.defaultTextFill ?? themeDefault.textFill,
        fragment.renderData
      )
    );
  }

  return group({
    ...(options.rootGroupProps ?? {}),
    x,
    y,
    scaleX: scale,
    scaleY: scale
  }, rgblChildren);
}

export function buildVitrineBlocksFromPaginatedLayout<TNodeId extends string = string>(
  document: VitrineLayoutDocument<TNodeId>,
  result: PaginatedLayoutResult<TNodeId>,
  options: BuildVitrineBlocksFromPaginatedLayoutOptions = {}
): Block {
  const xStart = options.x ?? 0;
  const yStart = options.y ?? 0;
  const scale = options.scale ?? 1;
  const gap = options.pageGap ?? 24;
  const cColumns = Math.max(1, options.columns ?? 1);
  const dxPageScaled = result.page.width * scale;
  const dyPageScaled = result.page.height * scale;
  const dxStride = dxPageScaled + gap;
  const dyStride = dyPageScaled + gap;

  const rgblChildren = result.pages.map((page: PaginatedPage<TNodeId>, index: number) => {
    const col = index % cColumns;
    const row = Math.floor(index / cColumns);
    return buildVitrineBlocksFromPaginatedPage(document, page, {
      ...options,
      x: xStart + col * dxStride,
      y: yStart + row * dyStride,
      scale
    });
  });

  return group(options.rootGroupProps ?? {}, rgblChildren);
}

export function buildFlowDocumentPreview<TNodeId extends string = string>(
  document: VitrineLayoutDocument<TNodeId>,
  result: PaginatedLayoutResult<TNodeId>,
  options: FlowPreviewOptions = {}
): Block {
  const theme = mergePreviewTheme(options.theme);
  const xStart = options.x ?? 40;
  const yStart = options.y ?? 60;
  const scale = options.scale ?? 0.34;
  const gap = options.pageGap ?? 28;
  const cColumns = Math.max(1, options.columns ?? 2);
  const dxPageScaled = result.page.width * scale;
  const dyPageScaled = result.page.height * scale;
  const dxStride = dxPageScaled + gap;
  const dyStride = dyPageScaled + gap;
  const rgblChildren: Block[] = [
    rectangle({
      dx: 1280,
      dy: 900,
      fill: theme.canvasFill
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

  result.pages.forEach((page: PaginatedPage<TNodeId>, index: number) => {
    const col = index % cColumns;
    const row = Math.floor(index / cColumns);
    const xPage = xStart + col * dxStride;
    const yPage = yStart + row * dyStride;
    rgblChildren.push(buildVitrineBlocksFromPaginatedPage(document, page, {
      x: xPage,
      y: yPage,
      scale,
      showPageShadow: true,
      showPageFrame: true,
      pageFill: theme.pageFill,
      pageStroke: theme.pageStroke,
      pageShadowFill: theme.shadowFill,
      artifactFills: theme.artifactFills,
      defaultTextFill: theme.textFill
    }));
    if (options.showPageLabels !== false) {
      rgblChildren.push(text({
        x: xPage + 14,
        y: yPage + 14,
        text: `Page ${index + 1}`,
        fontSize: 11,
        fill: theme.mutedTextFill,
        baseline: 'top'
      }));
    }
  });

  return group({}, rgblChildren);
}

export function buildPresentationPreview<TNodeId extends string = string>(
  document: VitrineLayoutDocument<TNodeId>,
  result: PaginatedLayoutResult<TNodeId>,
  options: PresentationPreviewOptions = {}
): Block {
  const theme = mergePreviewTheme(options.theme);
  const iCurrent = Math.max(0, Math.min(options.currentPageIndex ?? 0, result.pages.length - 1));
  const mainScale = options.mainScale ?? 0.5;
  const thumbScale = options.thumbnailScale ?? 0.14;
  const thumbGap = options.thumbnailGap ?? 18;
  const xStart = options.x ?? 40;
  const yStart = options.y ?? 64;
  const pageCurrent = result.pages[iCurrent]!;
  const dyMain = result.page.height * mainScale;
  const rgblChildren: Block[] = [
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
    buildVitrineBlocksFromPaginatedPage(document, pageCurrent, {
      x: xStart,
      y: yStart,
      scale: mainScale,
      showPageShadow: true,
      showPageFrame: true,
      pageFill: theme.pageFill,
      pageStroke: theme.pageStroke,
      pageShadowFill: theme.shadowFill,
      artifactFills: theme.artifactFills,
      defaultTextFill: theme.textFill
    })
  ];

  result.pages.forEach((page: PaginatedPage<TNodeId>, index: number) => {
    const thumbX = xStart + index * (result.page.width * thumbScale + thumbGap);
    const thumbY = yStart + dyMain + 34;
    rgblChildren.push(buildVitrineBlocksFromPaginatedPage(document, page, {
      x: thumbX,
      y: thumbY,
      scale: thumbScale,
      showPageFrame: true,
      pageFill: theme.pageFill,
      pageStroke: index === iCurrent ? theme.accentFill : theme.pageStroke,
      artifactFills: theme.artifactFills,
      defaultTextFill: theme.textFill
    }));
    rgblChildren.push(text({
      x: thumbX + 8,
      y: thumbY + 8,
      text: String(index + 1),
      fontSize: 10,
      fill: index === iCurrent ? theme.accentFill : theme.mutedTextFill,
      baseline: 'top'
    }));
  });

  return group({}, rgblChildren);
}
