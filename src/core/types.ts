// Copyright (c) 2026 François Rouaix

// Core type definitions for the block system

export type Color = string; // CSS color format
export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten';

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
  onClick?: (event: PointerEvent) => void;
  onPointerDown?: (event: PointerEvent) => void;
  onPointerUp?: (event: PointerEvent) => void;
  onPointerMove?: (event: PointerEvent) => void;
  onHover?: (event: PointerEvent) => void;
  onDrag?: (event: PointerEvent) => void;
}

export interface BaseBlockProps extends Transform, EventHandlers {
  opacity?: number;
  visible?: boolean;
  disableCulling?: boolean;
  shadow?: ShadowProps;
  id?: string;
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
  Layer = 'layer'
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

export interface Rc {
  x: number;
  y: number;
  width: number;
  height: number;
}
