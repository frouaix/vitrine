// Copyright (c) 2026 François Rouaix

// Core type definitions for the block system

export type Color = string; // CSS color format
export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten';

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
  id?: string;
  tooltip?: () => string | Block;
}

export interface StrokeProps {
  stroke?: Color;
  strokeWidth?: number;
}

export interface FillProps {
  fill?: Color;
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
  stroke: Color;
}

export interface TextProps extends BaseBlockProps, StrokeProps, FillProps {
  text: string;
  font?: string;
  fontSize?: number;
  align?: 'left' | 'center' | 'right' | 'start' | 'end';
  baseline?: 'top' | 'middle' | 'bottom' | 'alphabetic' | 'hanging';
}

export interface PathProps extends BaseBlockProps, StrokeProps, FillProps {
  pathData: string; // SVG path format
  closed?: boolean;
}

export interface ArcProps extends BaseBlockProps, StrokeProps, FillProps {
  radius: number;
  startAngle: number;
  endAngle: number;
}

export interface ImageProps extends BaseBlockProps, Rs {
  src: string | HTMLImageElement;
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
