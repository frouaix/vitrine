import type { LayoutContent, LayoutNode } from './common.ts';
import type { PageSpec } from './pagination.ts';

export type LayoutDocumentKind = 'flow' | 'presentation';
export type PresentationPreviewScale = 'contain' | 'cover' | 'stretch';

export interface FlowLayoutDocument<
  TNodeId extends string = string,
  TTableContent = LayoutContent,
  TMeasuredContent = LayoutContent
> {
  kind: 'flow';
  id: string;
  page: PageSpec;
  body: LayoutNode<TNodeId, TTableContent, TMeasuredContent>;
  header?: LayoutNode<TNodeId, TTableContent, TMeasuredContent>;
  footer?: LayoutNode<TNodeId, TTableContent, TMeasuredContent>;
  background?: LayoutNode<TNodeId, TTableContent, TMeasuredContent>;
  foreground?: LayoutNode<TNodeId, TTableContent, TMeasuredContent>;
}

export interface PresentationLayoutDocument<
  TNodeId extends string = string,
  TTableContent = LayoutContent,
  TMeasuredContent = LayoutContent
> {
  kind: 'presentation';
  id: string;
  page: PageSpec;
  slides: LayoutNode<TNodeId, TTableContent, TMeasuredContent>[];
  previewScale?: PresentationPreviewScale;
  background?: LayoutNode<TNodeId, TTableContent, TMeasuredContent>;
  foreground?: LayoutNode<TNodeId, TTableContent, TMeasuredContent>;
}

export type LayoutDocument<
  TNodeId extends string = string,
  TTableContent = LayoutContent,
  TMeasuredContent = LayoutContent
> =
  | FlowLayoutDocument<TNodeId, TTableContent, TMeasuredContent>
  | PresentationLayoutDocument<TNodeId, TTableContent, TMeasuredContent>;
