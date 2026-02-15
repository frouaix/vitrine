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
  shadow?: ShadowProps;
  id?: string;
}

export interface StrokeProps {
  stroke?: Color;
  strokeWidth?: number;
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

export interface Block {
  type: BlockType;
  props: BaseBlockProps;
  children?: Block[];
}

export interface RectangleProps extends BaseBlockProps, StrokeProps {
  width: number;
  height: number;
  fill?: Color;
  cornerRadius?: number;
}

export interface CircleProps extends BaseBlockProps, StrokeProps {
  radius: number;
  fill?: Color;
}

export interface EllipseProps extends BaseBlockProps, StrokeProps {
  radiusX: number;
  radiusY: number;
  fill?: Color;
}

export interface LineProps extends BaseBlockProps, StrokeProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: Color;
}

export interface TextProps extends BaseBlockProps, StrokeProps {
  text: string;
  font?: string;
  fontSize?: number;
  fill?: Color;
  align?: 'left' | 'center' | 'right' | 'start' | 'end';
  baseline?: 'top' | 'middle' | 'bottom' | 'alphabetic' | 'hanging';
}

export interface PathProps extends BaseBlockProps, StrokeProps {
  pathData: string; // SVG path format
  fill?: Color;
  closed?: boolean;
}

export interface ArcProps extends BaseBlockProps, StrokeProps {
  radius: number;
  startAngle: number;
  endAngle: number;
  fill?: Color;
}

export interface ImageProps extends BaseBlockProps {
  src: string | HTMLImageElement;
  width: number;
  height: number;
}

export interface GroupProps extends BaseBlockProps {
  clip?: boolean;
}

export interface LayerProps extends BaseBlockProps {
  blendMode?: BlendMode;
  cache?: boolean;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}