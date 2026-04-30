// Copyright (c) 2026 François Rouaix

// Hit testing utilities for event handling
import type { Block, Rc } from './core/types.ts';
import { BlockType } from './core/types.ts';
import { Matrix2D } from './transform.ts';
import { getBlockTypeHandlers } from './core/block-registry.ts';
import { getTextBlockRc } from './core/text-layout.ts';
import { getBlockTransform } from './core/bounds.ts';

export interface HitTestResult {
  block: Block;
  /** Ancestry chain from root to hit block (excludes hit block itself) */
  ancestors: Block[];
  /** Block-local X coordinate */
  xl: number;
  /** Block-local Y coordinate */
  yl: number;
  /** Scene X coordinate (before block transforms) */
  xs: number;
  /** Scene Y coordinate (before block transforms) */
  ys: number;
}

export interface HitTestLayoutCache {
  mpbl_rc: WeakMap<Block, Rc>;
}

export class HitTester {
  // Test if a point hits a block, considering its transform
  static hitTest(
    bl: Block,
    xs: number,
    ys: number,
    xfWorld: Matrix2D = Matrix2D.identity(),
    rgblAncestors: Block[] = [],
    layoutCache?: HitTestLayoutCache
  ): HitTestResult | null {
    const { props, rgblChildren } = bl;
    const { fVisible } = props;
    if (fVisible === false) return null;

    // Calculate this block's world transform
    const xfBlock = getBlockTransform(props);
    const xfCur = xfWorld.multiply(xfBlock);

    // Transform world coordinates to local space
    const inverse = xfCur.invert();
    if (!inverse) return null;

    const ptl = inverse.transformPoint(xs, ys);

    // Reject points outside clip region
    const { clip, dx: dxClip, dy: dyClip } = props as { clip?: boolean; dx?: number; dy?: number };
    if (clip && dxClip !== undefined && dyClip !== undefined) {
      if (ptl.x < 0 || ptl.x > dxClip || ptl.y < 0 || ptl.y > dyClip) {
        return null;
      }
    }

    // Test children first (reverse order for top-to-bottom)
    if (rgblChildren) {
      const rgblAncestorsChild = [...rgblAncestors, bl];
      for (let i = rgblChildren.length - 1; i >= 0; i--) {
        const blChildHit = this.hitTest(
          rgblChildren[i],
          xs,
          ys,
          xfCur,
          rgblAncestorsChild,
          layoutCache
        );
        if (blChildHit) return blChildHit;
      }
    }

    // Test this block
    if (this.hitTestShape(bl, ptl.x, ptl.y, layoutCache)) {
      return {
        block: bl,
        ancestors: rgblAncestors,
        xl: ptl.x,
        yl: ptl.y,
        xs: xs,
        ys: ys
      };
    }

    return null;
  }

  private static hitTestShape(bl: Block, xl: number, yl: number, layoutCache?: HitTestLayoutCache): boolean {
    switch (bl.type) {
      case BlockType.Rectangle: {
        const { dx, dy } = bl.props;
        return this.hitTestRectangle(xl, yl, dx, dy);
      }

      case BlockType.Circle: {
        const { radius } = bl.props;
        return this.hitTestCircle(xl, yl, radius);
      }

      case BlockType.Ellipse: {
        const { radiusX, radiusY } = bl.props;
        return this.hitTestEllipse(xl, yl, radiusX, radiusY);
      }

      case BlockType.Line: {
        const { x1, y1, x2, y2, strokeWidth } = bl.props;
        return this.hitTestLine(xl, yl, x1, y1, x2, y2, strokeWidth ?? 1);
      }

      case BlockType.Text: {
        const cachedBounds = layoutCache?.mpbl_rc.get(bl);
        if (cachedBounds) {
          return this.hitTestRectangle(
            xl - cachedBounds.x,
            yl - cachedBounds.y,
            cachedBounds.width,
            cachedBounds.height
          );
        }

        const rc = getTextBlockRc(bl.props.text, bl.props);
        return this.hitTestRectangle(xl - rc.x, yl - rc.y, rc.width, rc.height);
      }

      case BlockType.Arc: {
        const { radius, startAngle, endAngle } = bl.props;
        return this.hitTestArc(xl, yl, radius, startAngle, endAngle);
      }

      case BlockType.Group:
      case BlockType.Layer:
      case BlockType.Portal:
      case BlockType.ContentSized:
        {
          const cachedBounds = layoutCache?.mpbl_rc.get(bl);
          if (cachedBounds) {
            return this.hitTestRectangle(
              xl - cachedBounds.x,
              yl - cachedBounds.y,
              cachedBounds.width,
              cachedBounds.height
            );
          }
        }
        // Content-sized wrappers and containers otherwise rely on children.
        // Groups, layers, and portals don't have intrinsic shape, rely on children
        return false;

      default: {
        const blCustom = bl as unknown as { type: string; props: Record<string, unknown>; children?: Block[] };
        const handlers = getBlockTypeHandlers(blCustom.type);
        if (handlers?.hitTestShape) {
          return handlers.hitTestShape(blCustom, xl, yl, { layoutCache });
        }
        return false;
      }
    }
  }

  private static hitTestRectangle(xl: number, yl: number, dxl: number, dyl: number): boolean {
    return xl >= 0 && xl <= dxl && yl >= 0 && yl <= dyl;
  }

  private static hitTestCircle(xl: number, yl: number, rl: number): boolean {
    return xl * xl + yl * yl <= rl * rl;
  }

  private static hitTestEllipse(xl: number, yl: number, rxl: number, ryl: number): boolean {
    return (xl * xl) / (rxl * rxl) + (yl * yl) / (ryl * ryl) <= 1;
  }

  private static hitTestLine(
    xl: number,
    yl: number,
    xl1: number,
    yl1: number,
    xl2: number,
    yl2: number,
    strokeWidth: number
  ): boolean {
    // Distance from point to line segment
    const dxl = xl2 - xl1;
    const dyl = yl2 - yl1;
    const duLengthSquared = dxl * dxl + dyl * dyl;

    if (duLengthSquared === 0) {
      // Line is a point
      const duDistance = Math.sqrt((xl - xl1) * (xl - xl1) + (yl - yl1) * (yl - yl1));
      return duDistance <= strokeWidth / 2;
    }

    // Project point onto line
    const t = Math.max(0, Math.min(1, ((xl - xl1) * dxl + (yl - yl1) * dyl) / duLengthSquared));
    const xlProj = xl1 + t * dxl;
    const ylProj = yl1 + t * dyl;

    const duDistance = Math.sqrt((xl - xlProj) * (xl - xlProj) + (yl - ylProj) * (yl - ylProj));
    return duDistance <= strokeWidth / 2;
  }

  private static hitTestArc(
    xl: number,
    yl: number,
    rl: number,
    startAngle: number,
    endAngle: number
  ): boolean {
    const duDistance = Math.sqrt(xl * xl + yl * yl);
    if (Math.abs(duDistance - rl) > 5) return false; // 5px tolerance for arc stroke

    const angle = Math.atan2(yl, xl);
    let normalizedAngle = angle;
    if (normalizedAngle < 0) normalizedAngle += Math.PI * 2;

    let normalizedStart = startAngle;
    let normalizedEnd = endAngle;
    if (normalizedStart < 0) normalizedStart += Math.PI * 2;
    if (normalizedEnd < 0) normalizedEnd += Math.PI * 2;

    if (normalizedEnd < normalizedStart) {
      return normalizedAngle >= normalizedStart || normalizedAngle <= normalizedEnd;
    }
    return normalizedAngle >= normalizedStart && normalizedAngle <= normalizedEnd;
  }

}
