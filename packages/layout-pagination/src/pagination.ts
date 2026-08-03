import type { LayoutNode, LayoutRect, LayoutInsets } from './common.ts';
import { normalizeLayoutInsets } from './common.ts';

export type PageUnit = 'pt' | 'px' | 'mm' | 'in';

export interface PageSpec {
  id?: string;
  width: number;
  height: number;
  unit?: PageUnit;
  margins?: Partial<LayoutInsets>;
}

export interface ResolvedPageSpec {
  id?: string;
  width: number;
  height: number;
  unit: PageUnit;
  margins: LayoutInsets;
  contentBox: LayoutRect;
}

export type FragmentContinuation = 'none' | 'start' | 'middle' | 'end';

export interface LayoutFragment<TNodeId extends string = string> {
  nodeId?: TNodeId;
  pageIndex: number;
  rect: LayoutRect;
  continuation: FragmentContinuation;
  artifactKind?: import('./common.ts').PageArtifactKind;
  nodeKind?: LayoutNode<TNodeId>['kind'];
  renderData?: unknown;
}

export interface PaginatedPage<TNodeId extends string = string> {
  index: number;
  page: ResolvedPageSpec;
  bodyBox: LayoutRect;
  fragments: LayoutFragment<TNodeId>[];
}

export type PaginationDiagnosticSeverity = 'info' | 'warning' | 'error';

export interface PaginationDiagnostic<TNodeId extends string = string> {
  code: string;
  severity: PaginationDiagnosticSeverity;
  message: string;
  nodeId?: TNodeId;
  pageIndex?: number;
}

export interface PaginatedLayoutResult<TNodeId extends string = string> {
  documentId: string;
  page: ResolvedPageSpec;
  pages: PaginatedPage<TNodeId>[];
  diagnostics: PaginationDiagnostic<TNodeId>[];
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
