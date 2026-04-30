// Copyright (c) 2026 François Rouaix

// Block factory functions for creating block descriptors
import type {
  Block,
  BlockForType,
  BlockPropsByType,
  BlockOfType,
  BaseBlockProps
} from './types.ts';
import { BlockType } from './types.ts';

type ContainerBlockType = BlockType.Group | BlockType.Layer | BlockType.Portal | BlockType.ContentSized;
type LeafBlockType = Exclude<BlockType, ContainerBlockType>;

export function block<T extends ContainerBlockType>(
  type: T,
  props: BlockPropsByType[T],
  rgblChildren: Block[]
): BlockForType<T>;
export function block<T extends LeafBlockType>(
  type: T,
  props: BlockPropsByType[T],
  rgblChildren?: Block[]
): BlockForType<T>;
export function block<T extends BlockType>(
  type: T,
  props: BlockPropsByType[T],
  rgblChildren?: Block[]
): BlockForType<T> {
  return {
    type,
    props,
    rgblChildren
  };
}

export function rectangle(props: BlockPropsByType[BlockType.Rectangle], rgblChildren?: Block[]): BlockOfType<BlockType.Rectangle> {
  return block(BlockType.Rectangle, props, rgblChildren);
}

export function circle(props: BlockPropsByType[BlockType.Circle], rgblChildren?: Block[]): BlockOfType<BlockType.Circle> {
  return block(BlockType.Circle, props, rgblChildren);
}

export function ellipse(props: BlockPropsByType[BlockType.Ellipse], rgblChildren?: Block[]): BlockOfType<BlockType.Ellipse> {
  return block(BlockType.Ellipse, props, rgblChildren);
}

export function line(props: BlockPropsByType[BlockType.Line], rgblChildren?: Block[]): BlockOfType<BlockType.Line> {
  return block(BlockType.Line, props, rgblChildren);
}

export function text(props: BlockPropsByType[BlockType.Text], rgblChildren?: Block[]): BlockOfType<BlockType.Text> {
  return block(BlockType.Text, props, rgblChildren);
}

export function path(props: BlockPropsByType[BlockType.Path], rgblChildren?: Block[]): BlockOfType<BlockType.Path> {
  return block(BlockType.Path, props, rgblChildren);
}

export function arc(props: BlockPropsByType[BlockType.Arc], rgblChildren?: Block[]): BlockOfType<BlockType.Arc> {
  return block(BlockType.Arc, props, rgblChildren);
}

export function image(props: BlockPropsByType[BlockType.Image], rgblChildren?: Block[]): BlockOfType<BlockType.Image> {
  return block(BlockType.Image, props, rgblChildren);
}

export function group(props: BlockPropsByType[BlockType.Group], rgblChildren: Block[]): BlockOfType<BlockType.Group> {
  return block(BlockType.Group, props, rgblChildren);
}

export function layer(props: BlockPropsByType[BlockType.Layer], rgblChildren: Block[]): BlockOfType<BlockType.Layer> {
  return block(BlockType.Layer, props, rgblChildren);
}

export function portal(props: BlockPropsByType[BlockType.Portal], rgblChildren: Block[]): BlockOfType<BlockType.Portal> {
  return block(BlockType.Portal, props, rgblChildren);
}

export function contentSized(props: BlockPropsByType[BlockType.ContentSized], rgblChildren: Block[]): BlockOfType<BlockType.ContentSized> {
  return block(BlockType.ContentSized, props, rgblChildren);
}

export function customBlock<TProps extends BaseBlockProps>(
  type: string,
  props: TProps,
  rgblChildren?: Block[]
): Block {
  return {
    type,
    props,
    rgblChildren
  } as unknown as Block;
}

/** Convenience factory: wraps children in a group that opens `href` in a new tab on click. */
export function link(props: { href: string } & BlockPropsByType[BlockType.Group], rgblChildren: Block[]): BlockOfType<BlockType.Group> {
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
    rgblChildren
  );
}
