import type { LayoutNode, LayoutRect, LayoutSize } from './common.ts';
import type { ResolvedPageSpec } from './pagination.ts';

export interface LayoutAvailableSpace extends LayoutSize {}

export interface LayoutIntrinsicSize {
  minWidth: number;
  maxWidth: number;
  minHeight: number;
}

export interface LayoutMeasureRequest<TNodeId extends string = string> {
  node: LayoutNode<TNodeId>;
  availableSpace: LayoutAvailableSpace;
  page: ResolvedPageSpec;
}

export interface LayoutMeasuredContent {
  intrinsicSize: LayoutIntrinsicSize;
  preferredRect?: LayoutRect;
  renderData?: unknown;
}

export interface LayoutMeasureDelegate<TNodeId extends string = string> {
  measure(request: LayoutMeasureRequest<TNodeId>): LayoutMeasuredContent | null;
}

export function createNullMeasureDelegate<TNodeId extends string = string>(): LayoutMeasureDelegate<TNodeId> {
  return {
    measure(): LayoutMeasuredContent | null {
      return null;
    }
  };
}
