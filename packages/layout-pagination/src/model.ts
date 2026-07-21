export type PageUnit = 'pt' | 'px' | 'mm' | 'in';

export interface LayoutInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface LayoutSize {
  width: number;
  height: number;
}

export interface LayoutRect extends LayoutSize {
  x: number;
  y: number;
}

export interface PageSpec extends LayoutSize {
  id?: string;
  unit?: PageUnit;
  margins?: Partial<LayoutInsets>;
}

export interface ResolvedPageSpec extends LayoutSize {
  id?: string;
  unit: PageUnit;
  margins: LayoutInsets;
  contentBox: LayoutRect;
}

export type LayoutDocumentKind = 'flow' | 'presentation';
export type PresentationPreviewScale = 'contain' | 'cover' | 'stretch';

export type BreakBeforePolicy = 'auto' | 'page';
export type BreakAfterPolicy = 'auto' | 'page';
export type BreakInsidePolicy = 'auto' | 'avoid';
export type PageArtifactKind = 'header' | 'footer' | 'background' | 'foreground';

export interface BaseLayoutNode {
  id?: string;
  breakBefore?: BreakBeforePolicy;
  breakAfter?: BreakAfterPolicy;
  breakInside?: BreakInsidePolicy;
  keepWithNext?: boolean;
}

export interface StackLayoutNode extends BaseLayoutNode {
  kind: 'stack';
  gap?: number;
  padding?: Partial<LayoutInsets>;
  children: LayoutNode[];
}

export interface BoxLayoutNode extends BaseLayoutNode {
  kind: 'box';
  padding?: Partial<LayoutInsets>;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  width?: number;
  height?: number;
  child?: LayoutNode;
}

export interface SpacerLayoutNode extends BaseLayoutNode {
  kind: 'spacer';
  size: number;
}

export interface PageBreakLayoutNode extends BaseLayoutNode {
  kind: 'pageBreak';
  reason?: string;
}

export interface TextLayoutNode extends BaseLayoutNode {
  kind: 'text';
  text: string;
  textStyle?: Record<string, unknown>;
}

export interface TableLayoutNode extends BaseLayoutNode {
  kind: 'table';
  tableId: string;
  content: unknown;
}

export interface MeasuredLayoutNode extends BaseLayoutNode {
  kind: 'measured';
  measureKey: string;
  content: unknown;
}

export interface FixedLayoutNode extends BaseLayoutNode {
  kind: 'fixed';
  artifactKind: PageArtifactKind;
  child: LayoutNode;
}

export type LayoutNode =
  | StackLayoutNode
  | BoxLayoutNode
  | SpacerLayoutNode
  | PageBreakLayoutNode
  | TextLayoutNode
  | TableLayoutNode
  | MeasuredLayoutNode
  | FixedLayoutNode;

export interface FlowLayoutDocument {
  kind: 'flow';
  id: string;
  page: PageSpec;
  body: LayoutNode;
  header?: LayoutNode;
  footer?: LayoutNode;
  background?: LayoutNode;
  foreground?: LayoutNode;
}

export interface PresentationLayoutDocument {
  kind: 'presentation';
  id: string;
  page: PageSpec;
  slides: LayoutNode[];
  previewScale?: PresentationPreviewScale;
  background?: LayoutNode;
  foreground?: LayoutNode;
}

export type LayoutDocument = FlowLayoutDocument | PresentationLayoutDocument;

export type FragmentContinuation = 'none' | 'start' | 'middle' | 'end';

export interface LayoutFragment {
  nodeId?: string;
  pageIndex: number;
  rect: LayoutRect;
  continuation: FragmentContinuation;
  artifactKind?: PageArtifactKind;
  nodeKind?: LayoutNode['kind'];
  renderData?: unknown;
}

export interface PaginatedPage {
  index: number;
  page: ResolvedPageSpec;
  bodyBox: LayoutRect;
  fragments: LayoutFragment[];
}

export type PaginationDiagnosticSeverity = 'info' | 'warning' | 'error';

export interface PaginationDiagnostic {
  code: string;
  severity: PaginationDiagnosticSeverity;
  message: string;
  nodeId?: string;
  pageIndex?: number;
}

export interface PaginatedLayoutResult {
  documentId: string;
  page: ResolvedPageSpec;
  pages: PaginatedPage[];
  diagnostics: PaginationDiagnostic[];
}

export interface LayoutPaginationOptions {
  maxPages?: number;
}

const DEFAULT_PAGE_MARGINS: LayoutInsets = {
  top: 48,
  right: 48,
  bottom: 48,
  left: 48
};

const ZERO_INSETS: LayoutInsets = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0
};

export function normalizeLayoutInsets(
  insets?: Partial<LayoutInsets>,
  defaults: LayoutInsets = ZERO_INSETS
): LayoutInsets {
  return {
    top: insets?.top ?? defaults.top,
    right: insets?.right ?? defaults.right,
    bottom: insets?.bottom ?? defaults.bottom,
    left: insets?.left ?? defaults.left
  };
}

export function resolvePageSpec(page: PageSpec): ResolvedPageSpec {
  if (!(page.width > 0) || !(page.height > 0)) {
    throw new Error('Page width and height must be greater than zero.');
  }

  const margins = normalizeLayoutInsets(page.margins, DEFAULT_PAGE_MARGINS);
  const contentWidth = page.width - margins.left - margins.right;
  const contentHeight = page.height - margins.top - margins.bottom;
  if (contentWidth < 0 || contentHeight < 0) {
    throw new Error('Page margins exceed the page size.');
  }

  return {
    id: page.id,
    width: page.width,
    height: page.height,
    unit: page.unit ?? 'pt',
    margins,
    contentBox: {
      x: margins.left,
      y: margins.top,
      width: contentWidth,
      height: contentHeight
    }
  };
}
