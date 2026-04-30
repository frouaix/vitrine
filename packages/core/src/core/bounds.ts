// Copyright (c) 2026 François Rouaix

import type { Block, Rc, Transform } from './types.ts';
import { BlockType } from './types.ts';
import { Matrix2D, transformRc } from '../transform.ts';
import { getBlockTypeHandlers } from './block-registry.ts';
import { getTextBlockRc } from './text-layout.ts';

export function getBlockTransform(props: Transform): Matrix2D {
  let xf = Matrix2D.identity();
  const { x, y, rotation, scaleX, scaleY, skewX, skewY } = props;

  if (x !== undefined || y !== undefined) {
    xf = xf.translate(x ?? 0, y ?? 0);
  }
  if (rotation !== undefined) {
    xf = xf.rotate(rotation);
  }
  if (scaleX !== undefined || scaleY !== undefined) {
    xf = xf.scaleXY(scaleX ?? 1, scaleY ?? 1);
  }
  if (skewX !== undefined || skewY !== undefined) {
    xf = xf.skewXY(skewX ?? 0, skewY ?? 0);
  }

  return xf;
}

export function rcl(bl: Block): Rc | null {
  switch (bl.type) {
    case BlockType.Rectangle: {
      const { dx, dy } = bl.props;
      return { x: 0, y: 0, width: dx, height: dy };
    }

    case BlockType.Circle: {
      const { radius } = bl.props;
      return {
        x: -radius,
        y: -radius,
        width: radius * 2,
        height: radius * 2
      };
    }

    case BlockType.Ellipse: {
      const { radiusX, radiusY } = bl.props;
      return {
        x: -radiusX,
        y: -radiusY,
        width: radiusX * 2,
        height: radiusY * 2
      };
    }

    case BlockType.Line: {
      const { x1, x2, y1, y2 } = bl.props;
      const xlMin = Math.min(x1, x2);
      const xlMax = Math.max(x1, x2);
      const ylMin = Math.min(y1, y2);
      const ylMax = Math.max(y1, y2);
      return { x: xlMin, y: ylMin, width: xlMax - xlMin, height: ylMax - ylMin };
    }

    case BlockType.Text: {
      return getTextBlockRc(bl.props.text, bl.props);
    }

    default: {
      const blockCustom = bl as unknown as { type: string; props: Record<string, unknown>; children?: Block[] };
      const handlers = getBlockTypeHandlers(blockCustom.type);
      return handlers?.rcl?.(blockCustom) ?? null;
    }
  }
}

// Get bounding box for a block in world coordinates.
export function getBlockBounds(bl: Block, xfParent: Matrix2D = Matrix2D.identity()): Rc | null {
  const xfBl = getBlockTransform(bl.props);
  const xfCur = xfParent.multiply(xfBl);

  const rclT = rcl(bl);
  if (!rclT) return null;

  return transformRc(rclT, xfCur);
}
