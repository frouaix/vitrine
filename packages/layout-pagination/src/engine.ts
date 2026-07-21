import type {
  FlowLayoutDocument,
  LayoutDocument,
  LayoutFragment,
  LayoutNode,
  LayoutPaginationOptions,
  LayoutRect,
  PaginatedLayoutResult,
  PaginationDiagnostic,
  PageArtifactKind,
  PresentationLayoutDocument,
  ResolvedPageSpec
} from './model.ts';
import { normalizeLayoutInsets, resolvePageSpec } from './model.ts';
import type { LayoutMeasureDelegate, LayoutMeasuredContent } from './measure.ts';
import { createNullMeasureDelegate } from './measure.ts';

export interface PreparedFlowLayoutDocument {
  kind: 'flow';
  documentId: string;
  page: ResolvedPageSpec;
  body: LayoutNode;
  header?: LayoutNode;
  footer?: LayoutNode;
  background?: LayoutNode;
  foreground?: LayoutNode;
}

export interface PreparedPresentationLayoutDocument {
  kind: 'presentation';
  documentId: string;
  page: ResolvedPageSpec;
  slides: LayoutNode[];
  previewScale: 'contain' | 'cover' | 'stretch';
  background?: LayoutNode;
  foreground?: LayoutNode;
}

export type PreparedLayoutDocument =
  | PreparedFlowLayoutDocument
  | PreparedPresentationLayoutDocument;

interface FlowLayoutRuntime {
  page: ResolvedPageSpec;
  delegate: LayoutMeasureDelegate;
  diagnostics: PaginationDiagnostic[];
  pages: PaginatedLayoutResult['pages'];
  bodyBox: LayoutRect;
  maxPages: number;
  currentPageIndex: number;
  cursorY: number;
}

function assertRootNodeAllowed(node: LayoutNode, role: 'body' | 'header' | 'footer' | 'background' | 'foreground'): void {
  if (node.kind === 'fixed' && role !== 'body') {
    throw new Error(`Nested fixed nodes are not allowed in ${role}.`);
  }
}

function validateFlowDocument(document: FlowLayoutDocument): void {
  assertRootNodeAllowed(document.body, 'body');
  if (document.header) {
    assertRootNodeAllowed(document.header, 'header');
  }
  if (document.footer) {
    assertRootNodeAllowed(document.footer, 'footer');
  }
  if (document.background) {
    assertRootNodeAllowed(document.background, 'background');
  }
  if (document.foreground) {
    assertRootNodeAllowed(document.foreground, 'foreground');
  }
}

function validatePresentationDocument(document: PresentationLayoutDocument): void {
  if (document.slides.length === 0) {
    throw new Error('Presentation documents must define at least one slide.');
  }

  for (const slide of document.slides) {
    assertRootNodeAllowed(slide, 'body');
  }
  if (document.background) {
    assertRootNodeAllowed(document.background, 'background');
  }
  if (document.foreground) {
    assertRootNodeAllowed(document.foreground, 'foreground');
  }
}

export function validateLayoutDocument(document: LayoutDocument): void {
  if (document.id.trim().length === 0) {
    throw new Error('Layout document id must be non-empty.');
  }

  if (document.kind === 'presentation') {
    validatePresentationDocument(document);
    return;
  }

  validateFlowDocument(document);
}

export function prepareLayoutDocument(document: LayoutDocument): PreparedLayoutDocument {
  validateLayoutDocument(document);

  const page = resolvePageSpec(document.page);
  if (document.kind === 'presentation') {
    return {
      kind: 'presentation',
      documentId: document.id,
      page,
      slides: document.slides,
      previewScale: document.previewScale ?? 'contain',
      background: document.background,
      foreground: document.foreground
    };
  }

  return {
    kind: 'flow',
    documentId: document.id,
    page,
    body: document.body,
    header: document.header,
    footer: document.footer,
    background: document.background,
    foreground: document.foreground
  };
}

function cloneRect(rect: LayoutRect): LayoutRect {
  return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
}

function clampDimension(value: number, min?: number, max?: number): number {
  let next = value;
  if (min !== undefined) {
    next = Math.max(min, next);
  }
  if (max !== undefined) {
    next = Math.min(max, next);
  }
  return next;
}

function addDiagnostic(
  diagnostics: PaginationDiagnostic[],
  diagnostic: PaginationDiagnostic
): void {
  diagnostics.push(diagnostic);
}

function estimateTextHeight(text: string, availableWidth: number, textStyle?: Record<string, unknown>): number {
  const fontSize = typeof textStyle?.fontSize === 'number' ? textStyle.fontSize : 16;
  const lineHeight = typeof textStyle?.lineHeight === 'number' ? textStyle.lineHeight : fontSize * 1.4;
  const charsPerLine = Math.max(1, Math.floor(Math.max(availableWidth, fontSize) / Math.max(1, fontSize * 0.6)));
  return text
    .split('\n')
    .reduce((count, line) => count + Math.max(1, Math.ceil(line.length / charsPerLine)), 0) * lineHeight;
}

function measureLeafNode(
  node: LayoutNode,
  availableWidth: number,
  page: ResolvedPageSpec,
  delegate: LayoutMeasureDelegate,
  diagnostics: PaginationDiagnostic[]
): { width: number; height: number; renderData?: unknown } {
  const measured = delegate.measure({
    node,
    availableSpace: {
      width: availableWidth,
      height: page.contentBox.height
    },
    page
  });
  if (measured) {
    return {
      width: measured.preferredRect?.width ?? availableWidth,
      height: measured.preferredRect?.height ?? measured.intrinsicSize.minHeight,
      renderData: measured.renderData
    };
  }

  switch (node.kind) {
    case 'spacer':
      return { width: availableWidth, height: node.size };
    case 'text':
      return {
        width: availableWidth,
        height: estimateTextHeight(node.text, availableWidth, node.textStyle)
      };
    case 'measured':
    case 'table':
      addDiagnostic(diagnostics, {
        code: 'missing-measure-delegate',
        severity: 'warning',
        message: `No measure delegate provided for ${node.kind} node.`,
        nodeId: node.id
      });
      return { width: availableWidth, height: 0 };
    default:
      return { width: availableWidth, height: 0 };
  }
}

function estimateNodeHeight(
  node: LayoutNode,
  availableWidth: number,
  page: ResolvedPageSpec,
  delegate: LayoutMeasureDelegate,
  diagnostics: PaginationDiagnostic[]
): number {
  switch (node.kind) {
    case 'stack': {
      const padding = normalizeLayoutInsets(node.padding);
      let height = padding.top + padding.bottom;
      node.children.forEach((child, index) => {
        height += estimateNodeHeight(child, Math.max(0, availableWidth - padding.left - padding.right), page, delegate, diagnostics);
        if (index < node.children.length - 1) {
          height += node.gap ?? 0;
        }
      });
      return height;
    }
    case 'box': {
      const padding = normalizeLayoutInsets(node.padding);
      const childHeight = node.child
        ? estimateNodeHeight(node.child, Math.max(0, availableWidth - padding.left - padding.right), page, delegate, diagnostics)
        : 0;
      const naturalHeight = childHeight + padding.top + padding.bottom;
      return clampDimension(node.height ?? naturalHeight, node.minHeight, node.maxHeight);
    }
    case 'pageBreak':
      return 0;
    default:
      return measureLeafNode(node, availableWidth, page, delegate, diagnostics).height;
  }
}

function createArtifactFragment(
  node: LayoutNode,
  pageIndex: number,
  rect: LayoutRect,
  artifactKind: PageArtifactKind
): LayoutFragment {
  return {
    nodeId: node.id,
    nodeKind: node.kind,
    pageIndex,
    rect,
    continuation: 'none',
    artifactKind
  };
}

function ensurePage(runtime: FlowLayoutRuntime): void {
  if (runtime.pages[runtime.currentPageIndex]) {
    return;
  }
  if (runtime.currentPageIndex >= runtime.maxPages) {
    throw new Error(`Pagination exceeded maxPages=${runtime.maxPages}.`);
  }
  runtime.pages.push({
    index: runtime.currentPageIndex,
    page: runtime.page,
    bodyBox: cloneRect(runtime.bodyBox),
    fragments: []
  });
}

function currentPage(runtime: FlowLayoutRuntime): PaginatedLayoutResult['pages'][number] {
  ensurePage(runtime);
  return runtime.pages[runtime.currentPageIndex]!;
}

function pushPageArtifacts(
  pageFragments: LayoutFragment[],
  prepared: PreparedFlowLayoutDocument,
  pageIndex: number,
  bodyBox: LayoutRect,
  headerHeight: number,
  footerHeight: number,
  phase: 'start' | 'end'
): void {
  if (phase === 'start' && prepared.background) {
    pageFragments.push(createArtifactFragment(prepared.background, pageIndex, cloneRect(prepared.page.contentBox), 'background'));
  }
  if (phase === 'start' && prepared.header && headerHeight > 0) {
    pageFragments.push(createArtifactFragment(prepared.header, pageIndex, {
      x: prepared.page.contentBox.x,
      y: prepared.page.contentBox.y,
      width: prepared.page.contentBox.width,
      height: headerHeight
    }, 'header'));
  }
  if (phase === 'end' && prepared.footer && footerHeight > 0) {
    pageFragments.push(createArtifactFragment(prepared.footer, pageIndex, {
      x: prepared.page.contentBox.x,
      y: bodyBox.y + bodyBox.height,
      width: prepared.page.contentBox.width,
      height: footerHeight
    }, 'footer'));
  }
  if (phase === 'end' && prepared.foreground) {
    pageFragments.push(createArtifactFragment(prepared.foreground, pageIndex, cloneRect(prepared.page.contentBox), 'foreground'));
  }
}

function startNewFlowPage(
  runtime: FlowLayoutRuntime,
  prepared: PreparedFlowLayoutDocument,
  headerHeight: number,
  footerHeight: number
): void {
  ensurePage(runtime);
  const page = currentPage(runtime);
  if (page.fragments.length === 0) {
    pushPageArtifacts(page.fragments, prepared, runtime.currentPageIndex, runtime.bodyBox, headerHeight, footerHeight, 'start');
  }
  runtime.cursorY = runtime.bodyBox.y;
}

function advancePage(
  runtime: FlowLayoutRuntime,
  prepared: PreparedFlowLayoutDocument,
  headerHeight: number,
  footerHeight: number
): void {
  runtime.currentPageIndex += 1;
  ensurePage(runtime);
  const page = currentPage(runtime);
  if (page.fragments.length === 0) {
    pushPageArtifacts(page.fragments, prepared, runtime.currentPageIndex, runtime.bodyBox, headerHeight, footerHeight, 'start');
  }
  runtime.cursorY = runtime.bodyBox.y;
}

function emitLeafFragment(
  runtime: FlowLayoutRuntime,
  node: LayoutNode,
  width: number,
  height: number,
  renderData?: unknown
): void {
  currentPage(runtime).fragments.push({
    nodeId: node.id,
    nodeKind: node.kind,
    pageIndex: runtime.currentPageIndex,
    rect: {
      x: runtime.bodyBox.x,
      y: runtime.cursorY,
      width,
      height
    },
    continuation: 'none',
    renderData
  });
  runtime.cursorY += height;
}

function layoutNodeIntoPages(
  node: LayoutNode,
  runtime: FlowLayoutRuntime,
  prepared: PreparedFlowLayoutDocument,
  availableWidth: number,
  headerHeight: number,
  footerHeight: number
): void {
  if (node.breakBefore === 'page' || node.kind === 'pageBreak') {
    advancePage(runtime, prepared, headerHeight, footerHeight);
    if (node.kind === 'pageBreak') {
      return;
    }
  }

  if (node.kind === 'stack') {
    const padding = normalizeLayoutInsets(node.padding);
    const innerWidth = Math.max(0, availableWidth - padding.left - padding.right);
    runtime.cursorY += padding.top;
    node.children.forEach((child, index) => {
      if (index > 0) {
        runtime.cursorY += node.gap ?? 0;
      }
      const totalHeight = estimateNodeHeight(child, innerWidth, runtime.page, runtime.delegate, runtime.diagnostics);
      const remainingHeight = runtime.bodyBox.y + runtime.bodyBox.height - runtime.cursorY;
      if (remainingHeight < totalHeight && totalHeight <= runtime.bodyBox.height) {
        advancePage(runtime, prepared, headerHeight, footerHeight);
      }
      layoutNodeIntoPages(child, runtime, prepared, innerWidth, headerHeight, footerHeight);
    });
    runtime.cursorY += padding.bottom;
  } else if (node.kind === 'box') {
    const totalHeight = estimateNodeHeight(node, availableWidth, runtime.page, runtime.delegate, runtime.diagnostics);
    const remainingHeight = runtime.bodyBox.y + runtime.bodyBox.height - runtime.cursorY;
    if (remainingHeight < totalHeight && totalHeight <= runtime.bodyBox.height) {
      advancePage(runtime, prepared, headerHeight, footerHeight);
    }
    if (totalHeight > runtime.bodyBox.height) {
      addDiagnostic(runtime.diagnostics, {
        code: 'box-overflow-page',
        severity: 'warning',
        message: 'Box node is taller than the available page body area.',
        nodeId: node.id,
        pageIndex: runtime.currentPageIndex
      });
    }
    emitLeafFragment(runtime, node, availableWidth, totalHeight);
  } else {
    const measured = measureLeafNode(node, availableWidth, runtime.page, runtime.delegate, runtime.diagnostics);
    const remainingHeight = runtime.bodyBox.y + runtime.bodyBox.height - runtime.cursorY;
    if (remainingHeight < measured.height && measured.height <= runtime.bodyBox.height) {
      advancePage(runtime, prepared, headerHeight, footerHeight);
    }
    if (measured.height > runtime.bodyBox.height) {
      addDiagnostic(runtime.diagnostics, {
        code: 'node-overflow-page',
        severity: 'warning',
        message: `${node.kind} node is taller than the available page body area.`,
        nodeId: node.id,
        pageIndex: runtime.currentPageIndex
      });
    }
    emitLeafFragment(runtime, node, measured.width, measured.height, measured.renderData);
  }

  if (node.breakAfter === 'page') {
    advancePage(runtime, prepared, headerHeight, footerHeight);
  }
}

function layoutFlowDocument(
  prepared: PreparedFlowLayoutDocument,
  delegate: LayoutMeasureDelegate,
  options?: LayoutPaginationOptions
): PaginatedLayoutResult {
  const diagnostics: PaginationDiagnostic[] = [];
  const headerHeight = prepared.header
    ? estimateNodeHeight(prepared.header, prepared.page.contentBox.width, prepared.page, delegate, diagnostics)
    : 0;
  const footerHeight = prepared.footer
    ? estimateNodeHeight(prepared.footer, prepared.page.contentBox.width, prepared.page, delegate, diagnostics)
    : 0;
  const bodyBox: LayoutRect = {
    x: prepared.page.contentBox.x,
    y: prepared.page.contentBox.y + headerHeight,
    width: prepared.page.contentBox.width,
    height: Math.max(0, prepared.page.contentBox.height - headerHeight - footerHeight)
  };
  const runtime: FlowLayoutRuntime = {
    page: prepared.page,
    delegate,
    diagnostics,
    pages: [],
    bodyBox,
    maxPages: options?.maxPages ?? 1000,
    currentPageIndex: 0,
    cursorY: bodyBox.y
  };

  startNewFlowPage(runtime, prepared, headerHeight, footerHeight);
  layoutNodeIntoPages(prepared.body, runtime, prepared, bodyBox.width, headerHeight, footerHeight);
  runtime.pages.forEach((page, index) => {
    pushPageArtifacts(page.fragments, prepared, index, bodyBox, headerHeight, footerHeight, 'end');
  });

  return {
    documentId: prepared.documentId,
    page: prepared.page,
    pages: runtime.pages,
    diagnostics
  };
}

function layoutPresentationDocument(prepared: PreparedPresentationLayoutDocument): PaginatedLayoutResult {
  return {
    documentId: prepared.documentId,
    page: prepared.page,
    diagnostics: [],
    pages: prepared.slides.map((slide, index) => ({
      index,
      page: prepared.page,
      bodyBox: cloneRect(prepared.page.contentBox),
      fragments: [
        ...(prepared.background ? [createArtifactFragment(prepared.background, index, cloneRect(prepared.page.contentBox), 'background')] : []),
        {
          nodeId: slide.id,
          nodeKind: slide.kind,
          pageIndex: index,
          rect: cloneRect(prepared.page.contentBox),
          continuation: 'none'
        },
        ...(prepared.foreground ? [createArtifactFragment(prepared.foreground, index, cloneRect(prepared.page.contentBox), 'foreground')] : [])
      ]
    }))
  };
}

export class PaginatedLayoutEngine {
  private delegate: LayoutMeasureDelegate;

  constructor(delegate: LayoutMeasureDelegate = createNullMeasureDelegate()) {
    this.delegate = delegate;
  }

  getMeasureDelegate(): LayoutMeasureDelegate {
    return this.delegate;
  }

  prepare(document: LayoutDocument): PreparedLayoutDocument {
    return prepareLayoutDocument(document);
  }

  layout(document: LayoutDocument, options?: LayoutPaginationOptions): PaginatedLayoutResult {
    const prepared = this.prepare(document);
    if (prepared.kind === 'presentation') {
      return layoutPresentationDocument(prepared);
    }
    return layoutFlowDocument(prepared, this.delegate, options);
  }
}

export function createPaginatedLayoutEngine(
  delegate: LayoutMeasureDelegate = createNullMeasureDelegate()
): PaginatedLayoutEngine {
  return new PaginatedLayoutEngine(delegate);
}
