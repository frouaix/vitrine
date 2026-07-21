import type { LayoutNode, LayoutRect, LayoutSize, ResolvedPageSpec } from './model.ts';

export interface LayoutAvailableSpace extends LayoutSize {}

export interface LayoutIntrinsicSize {
  minWidth: number;
  maxWidth: number;
  minHeight: number;
}

export interface LayoutMeasureRequest {
  node: LayoutNode;
  availableSpace: LayoutAvailableSpace;
  page: ResolvedPageSpec;
}

export interface LayoutMeasuredContent {
  intrinsicSize: LayoutIntrinsicSize;
  preferredRect?: LayoutRect;
  renderData?: unknown;
}

export interface LayoutMeasureDelegate {
  measure(request: LayoutMeasureRequest): LayoutMeasuredContent | null;
}

export function createNullMeasureDelegate(): LayoutMeasureDelegate {
  return {
    measure(): LayoutMeasuredContent | null {
      return null;
    }
  };
}
