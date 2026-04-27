// Copyright (c) 2026 François Rouaix

import {
  BlockType,
  Matrix2D,
  Canvas2DContext,
  layoutTextCharacterBounds
} from 'vitrine';
import type {
  Block,
  CharacterBounds,
  RenderContext,
  TextProps
} from 'vitrine';
import type { CharacterBoundsProvider } from './TextSelectionManager.ts';

export interface CharacterBoundsAdapterOptions {
  /**
   * Optional measurement context. When omitted, the adapter attempts to create
   * an internal fallback 2D measurement context and falls back to approximated
   * metrics if that is unavailable.
   */
  context?: RenderContext;
}

function applyPropsTransform(matrixParent: Matrix2D, props: Record<string, unknown>): Matrix2D {
  let matrix = matrixParent;

  const x = typeof props.x === 'number' ? props.x : 0;
  const y = typeof props.y === 'number' ? props.y : 0;
  if (x !== 0 || y !== 0) {
    matrix = matrix.translate(x, y);
  }

  if (typeof props.rotation === 'number') {
    matrix = matrix.rotate(props.rotation);
  }

  const scaleX = typeof props.scaleX === 'number' ? props.scaleX : 1;
  const scaleY = typeof props.scaleY === 'number' ? props.scaleY : 1;
  if (scaleX !== 1 || scaleY !== 1) {
    matrix = matrix.scaleXY(scaleX, scaleY);
  }

  const skewX = typeof props.skewX === 'number' ? props.skewX : 0;
  const skewY = typeof props.skewY === 'number' ? props.skewY : 0;
  if (skewX !== 0 || skewY !== 0) {
    matrix = matrix.skewXY(skewX, skewY);
  }

  return matrix;
}

function transformBounds(boundsLocal: CharacterBounds, transform: Matrix2D): CharacterBounds {
  const cornerTopLeft = transform.transformPoint(boundsLocal.x, boundsLocal.y);
  const cornerTopRight = transform.transformPoint(boundsLocal.x + boundsLocal.width, boundsLocal.y);
  const cornerBottomLeft = transform.transformPoint(boundsLocal.x, boundsLocal.y + boundsLocal.height);
  const cornerBottomRight = transform.transformPoint(boundsLocal.x + boundsLocal.width, boundsLocal.y + boundsLocal.height);
  const xs = [cornerTopLeft.x, cornerTopRight.x, cornerBottomLeft.x, cornerBottomRight.x];
  const ys = [cornerTopLeft.y, cornerTopRight.y, cornerBottomLeft.y, cornerBottomRight.y];
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);

  return {
    x: xMin,
    y: yMin,
    width: Math.max(0, xMax - xMin),
    height: Math.max(0, yMax - yMin)
  };
}

function createFallbackRenderContext(): RenderContext | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return undefined;
  }
  return new Canvas2DContext(ctx);
}

/**
 * Build a CharacterBoundsProvider from a rendered block tree.
 * The provider uses the same text metrics/wrap/alignment conventions as Vitrine's renderer.
 */
export function createCharacterBoundsProviderFromBlockTree(
  root: Block,
  options: CharacterBoundsAdapterOptions = {}
): CharacterBoundsProvider {
  const context = options.context ?? createFallbackRenderContext();
  const mpBoundsByBlockId = new Map<string, CharacterBounds[]>();
  const stack: Array<{ block: Block; transform: Matrix2D }> = [{ block: root, transform: Matrix2D.identity() }];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    const { block, transform: transformParent } = current;
    const transformWorld = applyPropsTransform(transformParent, block.props as Record<string, unknown>);

    if (
      block.type === BlockType.Text
      && typeof block.props.id === 'string'
      && block.props.id.length > 0
    ) {
      const boundsLocal = layoutTextCharacterBounds(block.props.text, block.props as TextProps, context);
      mpBoundsByBlockId.set(
        block.props.id,
        boundsLocal.map((bounds) => transformBounds(bounds, transformWorld))
      );
    }

    const children = block.children;
    if (!children) {
      continue;
    }

    for (let i = children.length - 1; i >= 0; i--) {
      const child = children[i];
      if (!child) {
        continue;
      }
      stack.push({ block: child, transform: transformWorld });
    }
  }

  return (blockId: string, charIndex: number): CharacterBounds | null => {
    if (charIndex < 0) {
      return null;
    }
    const blockBounds = mpBoundsByBlockId.get(blockId);
    if (!blockBounds) {
      return null;
    }
    return blockBounds[charIndex] ?? null;
  };
}
