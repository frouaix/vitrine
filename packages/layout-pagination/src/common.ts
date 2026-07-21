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

export interface LayoutTextStyle {
  font?: string;
  fontSize?: number;
  lineHeight?: number;
  fill?: string;
}

export type LayoutContent = object;

export type BreakBeforePolicy = 'auto' | 'page';
export type BreakAfterPolicy = 'auto' | 'page';
export type BreakInsidePolicy = 'auto' | 'avoid';
export type PageArtifactKind = 'header' | 'footer' | 'background' | 'foreground';

export enum LayoutNodeType {
  Stack = 'stack',
  Box = 'box',
  Spacer = 'spacer',
  PageBreak = 'pageBreak',
  Text = 'text',
  Table = 'table',
  Measured = 'measured',
  Fixed = 'fixed'
}

export interface BaseLayoutNodeProps<TNodeId extends string = string> {
  id?: TNodeId;
  breakBefore?: BreakBeforePolicy;
  breakAfter?: BreakAfterPolicy;
  breakInside?: BreakInsidePolicy;
  keepWithNext?: boolean;
}

export interface StackLayoutNodeProps<
  TNodeId extends string = string,
  TTableContent = LayoutContent,
  TMeasuredContent = LayoutContent
> extends BaseLayoutNodeProps<TNodeId> {
  gap?: number;
  padding?: Partial<LayoutInsets>;
  children: LayoutNode<TNodeId, TTableContent, TMeasuredContent>[];
}

export interface BoxLayoutNodeProps<
  TNodeId extends string = string,
  TTableContent = LayoutContent,
  TMeasuredContent = LayoutContent
> extends BaseLayoutNodeProps<TNodeId> {
  padding?: Partial<LayoutInsets>;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  width?: number;
  height?: number;
  child?: LayoutNode<TNodeId, TTableContent, TMeasuredContent>;
}

export interface SpacerLayoutNodeProps<TNodeId extends string = string> extends BaseLayoutNodeProps<TNodeId> {
  size: number;
}

export interface PageBreakLayoutNodeProps<TNodeId extends string = string> extends BaseLayoutNodeProps<TNodeId> {
  reason?: string;
}

export interface TextLayoutNodeProps<
  TNodeId extends string = string,
  TTextStyle extends LayoutTextStyle = LayoutTextStyle
> extends BaseLayoutNodeProps<TNodeId> {
  text: string;
  textStyle?: TTextStyle;
}

export interface TableLayoutNodeProps<
  TNodeId extends string = string,
  TTableContent = LayoutContent
> extends BaseLayoutNodeProps<TNodeId> {
  tableId: string;
  content: TTableContent;
}

export interface MeasuredLayoutNodeProps<
  TNodeId extends string = string,
  TMeasuredContent = LayoutContent
> extends BaseLayoutNodeProps<TNodeId> {
  measureKey: string;
  content: TMeasuredContent;
}

export interface FixedLayoutNodeProps<
  TNodeId extends string = string,
  TTableContent = LayoutContent,
  TMeasuredContent = LayoutContent
> extends BaseLayoutNodeProps<TNodeId> {
  artifactKind: PageArtifactKind;
  child: LayoutNode<TNodeId, TTableContent, TMeasuredContent>;
}

export type LayoutNodePropsByType<
  TNodeId extends string = string,
  TTableContent = LayoutContent,
  TMeasuredContent = LayoutContent,
  TTextStyle extends LayoutTextStyle = LayoutTextStyle
> = {
  [LayoutNodeType.Stack]: StackLayoutNodeProps<TNodeId, TTableContent, TMeasuredContent>;
  [LayoutNodeType.Box]: BoxLayoutNodeProps<TNodeId, TTableContent, TMeasuredContent>;
  [LayoutNodeType.Spacer]: SpacerLayoutNodeProps<TNodeId>;
  [LayoutNodeType.PageBreak]: PageBreakLayoutNodeProps<TNodeId>;
  [LayoutNodeType.Text]: TextLayoutNodeProps<TNodeId, TTextStyle>;
  [LayoutNodeType.Table]: TableLayoutNodeProps<TNodeId, TTableContent>;
  [LayoutNodeType.Measured]: MeasuredLayoutNodeProps<TNodeId, TMeasuredContent>;
  [LayoutNodeType.Fixed]: FixedLayoutNodeProps<TNodeId, TTableContent, TMeasuredContent>;
};

export type LayoutNodeForType<
  T extends LayoutNodeType,
  TNodeId extends string = string,
  TTableContent = LayoutContent,
  TMeasuredContent = LayoutContent,
  TTextStyle extends LayoutTextStyle = LayoutTextStyle
> = {
  kind: T;
} & LayoutNodePropsByType<TNodeId, TTableContent, TMeasuredContent, TTextStyle>[T];

export type LayoutNode<
  TNodeId extends string = string,
  TTableContent = LayoutContent,
  TMeasuredContent = LayoutContent,
  TTextStyle extends LayoutTextStyle = LayoutTextStyle
> =
  {
    [T in LayoutNodeType]: LayoutNodeForType<T, TNodeId, TTableContent, TMeasuredContent, TTextStyle>;
  }[LayoutNodeType];

export type LayoutNodeOfType<
  T extends LayoutNodeType,
  TNodeId extends string = string,
  TTableContent = LayoutContent,
  TMeasuredContent = LayoutContent,
  TTextStyle extends LayoutTextStyle = LayoutTextStyle
> = Extract<LayoutNode<TNodeId, TTableContent, TMeasuredContent, TTextStyle>, { kind: T }>;

export type StackLayoutNode<
  TNodeId extends string = string,
  TTableContent = LayoutContent,
  TMeasuredContent = LayoutContent
> = LayoutNodeForType<LayoutNodeType.Stack, TNodeId, TTableContent, TMeasuredContent>;

export type BoxLayoutNode<
  TNodeId extends string = string,
  TTableContent = LayoutContent,
  TMeasuredContent = LayoutContent
> = LayoutNodeForType<LayoutNodeType.Box, TNodeId, TTableContent, TMeasuredContent>;

export type SpacerLayoutNode<TNodeId extends string = string> =
  LayoutNodeForType<LayoutNodeType.Spacer, TNodeId>;

export type PageBreakLayoutNode<TNodeId extends string = string> =
  LayoutNodeForType<LayoutNodeType.PageBreak, TNodeId>;

export type TextLayoutNode<
  TNodeId extends string = string,
  TTextStyle extends LayoutTextStyle = LayoutTextStyle
> = LayoutNodeForType<LayoutNodeType.Text, TNodeId, LayoutContent, LayoutContent, TTextStyle>;

export type TableLayoutNode<
  TNodeId extends string = string,
  TTableContent = LayoutContent
> = LayoutNodeForType<LayoutNodeType.Table, TNodeId, TTableContent>;

export type MeasuredLayoutNode<
  TNodeId extends string = string,
  TMeasuredContent = LayoutContent
> = LayoutNodeForType<LayoutNodeType.Measured, TNodeId, LayoutContent, TMeasuredContent>;

export type FixedLayoutNode<
  TNodeId extends string = string,
  TTableContent = LayoutContent,
  TMeasuredContent = LayoutContent
> = LayoutNodeForType<LayoutNodeType.Fixed, TNodeId, TTableContent, TMeasuredContent>;

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
