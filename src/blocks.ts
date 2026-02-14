// Block factory functions for creating block descriptors
import type {
  Block,
  RectangleProps,
  CircleProps,
  EllipseProps,
  LineProps,
  TextProps,
  PathProps,
  ArcProps,
  ImageProps,
  GroupProps,
  LayerProps
} from './types.js';
import { BlockType } from './types.js';

export function rectangle(props: RectangleProps, children?: Block[]): Block {
  return {
    type: BlockType.Rectangle,
    props,
    children
  };
}

export function circle(props: CircleProps, children?: Block[]): Block {
  return {
    type: BlockType.Circle,
    props,
    children
  };
}

export function ellipse(props: EllipseProps, children?: Block[]): Block {
  return {
    type: BlockType.Ellipse,
    props,
    children
  };
}

export function line(props: LineProps, children?: Block[]): Block {
  return {
    type: BlockType.Line,
    props,
    children
  };
}

export function text(props: TextProps, children?: Block[]): Block {
  return {
    type: BlockType.Text,
    props,
    children
  };
}

export function path(props: PathProps, children?: Block[]): Block {
  return {
    type: BlockType.Path,
    props,
    children
  };
}

export function arc(props: ArcProps, children?: Block[]): Block {
  return {
    type: BlockType.Arc,
    props,
    children
  };
}

export function image(props: ImageProps, children?: Block[]): Block {
  return {
    type: BlockType.Image,
    props,
    children
  };
}

export function group(props: GroupProps, children: Block[]): Block {
  return {
    type: BlockType.Group,
    props,
    children
  };
}

export function layer(props: LayerProps, children: Block[]): Block {
  return {
    type: BlockType.Layer,
    props,
    children
  };
}
