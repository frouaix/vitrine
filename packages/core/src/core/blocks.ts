// Copyright (c) 2026 François Rouaix

// Block factory functions for creating block descriptors
import type {
  Block,
  BlockForType,
  BlockPropsByType,
  BlockOfType,
} from './types.ts';
import { BlockType } from './types.ts';

type ContainerBlockType = BlockType.Group | BlockType.Layer | BlockType.Portal;
type LeafBlockType = Exclude<BlockType, ContainerBlockType>;

export function block<T extends ContainerBlockType>(
  type: T,
  props: BlockPropsByType[T],
  children: Block[]
): BlockForType<T>;
export function block<T extends LeafBlockType>(
  type: T,
  props: BlockPropsByType[T],
  children?: Block[]
): BlockForType<T>;
export function block<T extends BlockType>(
  type: T,
  props: BlockPropsByType[T],
  children?: Block[]
): BlockForType<T> {
  return {
    type,
    props,
    children
  };
}

export function rectangle(props: BlockPropsByType[BlockType.Rectangle], children?: Block[]): BlockOfType<BlockType.Rectangle> {
  return block(BlockType.Rectangle, props, children);
}

export function circle(props: BlockPropsByType[BlockType.Circle], children?: Block[]): BlockOfType<BlockType.Circle> {
  return block(BlockType.Circle, props, children);
}

export function ellipse(props: BlockPropsByType[BlockType.Ellipse], children?: Block[]): BlockOfType<BlockType.Ellipse> {
  return block(BlockType.Ellipse, props, children);
}

export function line(props: BlockPropsByType[BlockType.Line], children?: Block[]): BlockOfType<BlockType.Line> {
  return block(BlockType.Line, props, children);
}

export function text(props: BlockPropsByType[BlockType.Text], children?: Block[]): BlockOfType<BlockType.Text> {
  return block(BlockType.Text, props, children);
}

export function path(props: BlockPropsByType[BlockType.Path], children?: Block[]): BlockOfType<BlockType.Path> {
  return block(BlockType.Path, props, children);
}

export function arc(props: BlockPropsByType[BlockType.Arc], children?: Block[]): BlockOfType<BlockType.Arc> {
  return block(BlockType.Arc, props, children);
}

export function image(props: BlockPropsByType[BlockType.Image], children?: Block[]): BlockOfType<BlockType.Image> {
  return block(BlockType.Image, props, children);
}

export function group(props: BlockPropsByType[BlockType.Group], children: Block[]): BlockOfType<BlockType.Group> {
  return block(BlockType.Group, props, children);
}

export function layer(props: BlockPropsByType[BlockType.Layer], children: Block[]): BlockOfType<BlockType.Layer> {
  return block(BlockType.Layer, props, children);
}

export function portal(props: BlockPropsByType[BlockType.Portal], children: Block[]): BlockOfType<BlockType.Portal> {
  return block(BlockType.Portal, props, children);
}

/** Convenience factory: wraps children in a group that opens `href` in a new tab on click. */
export function link(props: { href: string } & BlockPropsByType[BlockType.Group], children: Block[]): BlockOfType<BlockType.Group> {
  const { href, onClick: userOnClick, tooltip: userTooltip, ...rest } = props;
  return group(
    {
      ...rest,
      tooltip: userTooltip ?? (() => href),
      onClick: (event) => {
        window.open(href, '_blank', 'noopener');
        if (userOnClick) userOnClick(event);
      }
    },
    children
  );
}
