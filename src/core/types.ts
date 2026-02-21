// Copyright (c) 2026 François Rouaix

// Core type definitions for the block system

export type Color = string; // CSS color format
export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten';

// --- Gradient & Pattern descriptors ---

export interface ColorStop {
  offset: number; // 0–1
  color: Color;
}

export interface LinearGradientDescriptor {
  type: 'linear-gradient';
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  stops: ColorStop[];
}

export interface RadialGradientDescriptor {
  type: 'radial-gradient';
  x0: number;
  y0: number;
  r0: number;
  x1: number;
  y1: number;
  r1: number;
  stops: ColorStop[];
}

export interface ConicGradientDescriptor {
  type: 'conic-gradient';
  startAngle: number;
  x: number;
  y: number;
  stops: ColorStop[];
}

export type GradientDescriptor = LinearGradientDescriptor | RadialGradientDescriptor | ConicGradientDescriptor;

export interface PatternDescriptor {
  type: 'pattern';
  image: HTMLImageElement | HTMLCanvasElement;
  repetition?: 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat';
}

/** Any value accepted by fill or stroke properties. */
export type FillStyle = Color | GradientDescriptor | PatternDescriptor;

/** Pointer event enriched with Vitrine coordinate data. */
export type VitrinePointerEvent = PointerEvent & {
  /** Block-local X coordinate (after all parent+block transforms inverted) */
  xl?: number;
  /** Block-local Y coordinate (after all parent+block transforms inverted) */
  yl?: number;
  /** Scene X coordinate (root scene graph, camera-inverse applied, before block transforms) */
  xs?: number;
  /** Scene Y coordinate (root scene graph, camera-inverse applied, before block transforms) */
  ys?: number;
};

export interface Transform {
  x?: number;
  y?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  skewX?: number;
  skewY?: number;
}

export interface ShadowProps {
  offsetX: number;
  offsetY: number;
  blur: number;
  color: Color;
}

export interface EventHandlers {
  onClick?: (event: VitrinePointerEvent) => void;
  onPointerDown?: (event: VitrinePointerEvent) => void;
  onPointerUp?: (event: VitrinePointerEvent) => void;
  onPointerMove?: (event: VitrinePointerEvent) => void;
  onHover?: (event: VitrinePointerEvent) => void;
  onDrag?: (event: VitrinePointerEvent) => void;
}

export interface BaseBlockProps extends Transform, EventHandlers {
  opacity?: number;
  visible?: boolean;
  disableCulling?: boolean;
  shadow?: ShadowProps;
  filter?: string;
  id?: string;
  tooltip?: () => string | Block;
}

export type LineCap = 'butt' | 'round' | 'square';
export type LineJoin = 'bevel' | 'round' | 'miter';
export type FillRule = 'nonzero' | 'evenodd';

export interface StrokeProps {
  stroke?: FillStyle;
  strokeWidth?: number;
  lineCap?: LineCap;
  lineJoin?: LineJoin;
  lineDash?: number[];
  lineDashOffset?: number;
}

export interface FillProps {
  fill?: FillStyle;
}

export interface Rs {
  dx: number;
  dy: number;
}

export enum BlockType {
  Rectangle = 'rectangle',
  Circle = 'circle',
  Ellipse = 'ellipse',
  Path = 'path',
  Line = 'line',
  Text = 'text',
  Image = 'image',
  Arc = 'arc',
  Group = 'group',
  Layer = 'layer',
  Portal = 'portal'
}

export type BlockPropsByType = {
  [BlockType.Rectangle]: RectangleProps;
  [BlockType.Circle]: CircleProps;
  [BlockType.Ellipse]: EllipseProps;
  [BlockType.Path]: PathProps;
  [BlockType.Line]: LineProps;
  [BlockType.Text]: TextProps;
  [BlockType.Image]: ImageProps;
  [BlockType.Arc]: ArcProps;
  [BlockType.Group]: GroupProps;
  [BlockType.Layer]: LayerProps;
  [BlockType.Portal]: PortalProps;
};

export type BlockForType<T extends BlockType = BlockType> = {
  type: T;
  props: BlockPropsByType[T];
  children?: Block[];
};

export type Block = {
  [T in BlockType]: BlockForType<T>;
}[BlockType];

export type BlockOfType<T extends BlockType> = Extract<Block, { type: T }>;

export interface RectangleProps extends BaseBlockProps, StrokeProps, FillProps, Rs {
  cornerRadius?: number;
}

export interface CircleProps extends BaseBlockProps, StrokeProps, FillProps {
  radius: number;
}

export interface EllipseProps extends BaseBlockProps, StrokeProps, FillProps {
  radiusX: number;
  radiusY: number;
}

export interface LineProps extends BaseBlockProps, StrokeProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: FillStyle;
}

export interface TextProps extends BaseBlockProps, StrokeProps, FillProps {
  text: string;
  font?: string;
  fontSize?: number;
  align?: 'left' | 'center' | 'right' | 'start' | 'end';
  baseline?: 'top' | 'middle' | 'bottom' | 'alphabetic' | 'hanging';
  /** When set, word-wrap text to fit within this width. */
  dx?: number;
  /** When set (with dx), clip text vertically at this height. */
  dy?: number;
  /** Line spacing in pixels. Defaults to fontSize * 1.4. */
  lineHeight?: number;
}

export interface PathProps extends BaseBlockProps, StrokeProps, FillProps {
  pathData: string; // SVG path format
  closed?: boolean;
  fillRule?: FillRule;
}

export interface ArcProps extends BaseBlockProps, StrokeProps, FillProps {
  radius: number;
  startAngle: number;
  endAngle: number;
  fillRule?: FillRule;
}

export interface ImageProps extends BaseBlockProps, Rs {
  src: string | HTMLImageElement;
  /** Source rectangle for cropping (all four must be provided together). */
  sx?: number;
  sy?: number;
  sw?: number;
  sh?: number;
}

export interface GroupProps extends BaseBlockProps {
  clip?: boolean;
}

export interface LayerProps extends BaseBlockProps {
  blendMode?: BlendMode;
  cache?: boolean;
}

export interface PortalProps extends BaseBlockProps {
  // Portal renders its children in the overlay layer
  // Future: could add targetLayer property for multiple overlay layers
}

export interface Rc {
  x: number;
  y: number;
  width: number;
  height: number;
}
