// Copyright (c) 2026 François Rouaix

// Hit testing utilities for event handling
import type { Block, Rc } from './core/types.ts';
import { BlockType } from './core/types.ts';
import { Matrix2D } from './transform.ts';
import { getBlockTypeHandlers } from './core/block-registry.ts';

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
    const { props, rgblChildren: children } = bl;
    const { fVisible: visible } = props;
    if (visible === false) return null;

    // Calculate this block's world transform
    const xfBlock = this.getBlockTransform(props);
    const xfCur = xfWorld.multiply(xfBlock);

    // Transform world coordinates to local space
    const inverse = xfCur.invert();
    if (!inverse) return null;

    const local = inverse.transformPoint(xs, ys);

    // Reject points outside clip region
    const { clip, dx: dxClip, dy: dyClip } = props as any;
    if (clip && dxClip !== undefined && dyClip !== undefined) {
      if (local.x < 0 || local.x > dxClip || local.y < 0 || local.y > dyClip) {
        return null;
      }
    }

    // Test children first (reverse order for top-to-bottom)
    if (children) {
      const rgblAncestorsChild = [...rgblAncestors, bl];
      for (let i = children.length - 1; i >= 0; i--) {
        const blChildHit = this.hitTest(
          children[i],
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
    if (this.hitTestShape(bl, local.x, local.y, layoutCache)) {
      return {
        block: bl,
        ancestors: rgblAncestors,
        xl: local.x,
        yl: local.y,
        xs: xs,
        ys: ys
      };
    }

    return null;
  }

  private static getBlockTransform(props: any): Matrix2D {
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

  private static hitTestShape(bl: Block, x: number, y: number, layoutCache?: HitTestLayoutCache): boolean {
    const xl = x;
    const yl = y;

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

        // Calculate text bounds accounting for baseline and alignment
        const { fontSize: duFont, text: stText, align, baseline, dx: dxMax, dyLineHeight } = bl.props;
        const fontSize = duFont ?? 16;
        const duLineHeight = dyLineHeight ?? fontSize * 1.4;

        let textWidth: number;
        let height: number;
        if (dxMax !== undefined) {
          // Approximate wrapped line count
          const singleLineWidth = stText.length * fontSize * 0.6;
          const lineCount = Math.max(1, Math.ceil(singleLineWidth / dxMax));
          textWidth = Math.min(singleLineWidth, dxMax);
          height = lineCount * duLineHeight;
        } else {
          textWidth = stText.length * fontSize * 0.6; // rough estimate
          height = fontSize;
        }

        const ascent = fontSize; // approximate
        
        // Calculate x offset based on alignment
        let xOffset = 0;
        if (align === 'center') {
          xOffset = -textWidth / 2;
        } else if (align === 'right' || align === 'end') {
          xOffset = -textWidth;
        }
        
        // Calculate y offset based on baseline
        let yOffset = -ascent; // Default for 'alphabetic' baseline
        if (baseline === 'top' || baseline === 'hanging') {
          yOffset = 0;
        } else if (baseline === 'middle') {
          yOffset = -height / 2;
        } else if (baseline === 'bottom') {
          yOffset = -height;
        }
        
        // Translate hit point to text box space
        const testX = xl - xOffset;
        const testY = yl - yOffset;
        return this.hitTestRectangle(testX, testY, textWidth, height);
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

  // Get bounding box for a block in world coordinates
  static getBounds(block: Block, worldTransform: Matrix2D = Matrix2D.identity()): Rc | null {
    const blockTransform = this.getBlockTransform(block.props);
    const currentTransform = worldTransform.multiply(blockTransform);

    const localBounds = this.getLocalBounds(block);
    if (!localBounds) return null;

    // Transform all four corners to world space
    const corners = [
      currentTransform.transformPoint(localBounds.x, localBounds.y),
      currentTransform.transformPoint(localBounds.x + localBounds.width, localBounds.y),
      currentTransform.transformPoint(localBounds.x, localBounds.y + localBounds.height),
      currentTransform.transformPoint(localBounds.x + localBounds.width, localBounds.y + localBounds.height)
    ];

    const xcMin = Math.min(...corners.map(c => c.x));
    const xcMax = Math.max(...corners.map(c => c.x));
    const ycMin = Math.min(...corners.map(c => c.y));
    const ycMax = Math.max(...corners.map(c => c.y));

    return {
      x: xcMin,
      y: ycMin,
      width: xcMax - xcMin,
      height: ycMax - ycMin
    };
  }

  private static getLocalBounds(block: Block): Rc | null {
    switch (block.type) {
      case BlockType.Rectangle: {
        const { dx, dy } = block.props;
        return { x: 0, y: 0, width: dx, height: dy };
      }

      case BlockType.Circle: {
        const { radius } = block.props;
        return {
          x: -radius,
          y: -radius,
          width: radius * 2,
          height: radius * 2
        };
      }

      case BlockType.Ellipse: {
        const { radiusX, radiusY } = block.props;
        return {
          x: -radiusX,
          y: -radiusY,
          width: radiusX * 2,
          height: radiusY * 2
        };
      }

      case BlockType.Line: {
        const { x1, x2, y1, y2 } = block.props;
        const xlMin = Math.min(x1, x2);
        const xlMax = Math.max(x1, x2);
        const ylMin = Math.min(y1, y2);
        const ylMax = Math.max(y1, y2);
        return { x: xlMin, y: ylMin, width: xlMax - xlMin, height: ylMax - ylMin };
      }

      case BlockType.Text: {
        const { fontSize: duFont, text: stText, dx: dxMax, dyLineHeight } = block.props;
        const fontSize = duFont ?? 16;
        const duLineHeight = dyLineHeight ?? fontSize * 1.4;
        const singleLineWidth = stText.length * fontSize * 0.6;
        if (dxMax !== undefined) {
          const lineCount = Math.max(1, Math.ceil(singleLineWidth / dxMax));
          return { x: 0, y: 0, width: Math.min(singleLineWidth, dxMax), height: lineCount * duLineHeight };
        }
        return { x: 0, y: 0, width: singleLineWidth, height: fontSize };
      }

      default: {
        const blockCustom = block as unknown as { type: string; props: Record<string, unknown>; children?: Block[] };
        const handlers = getBlockTypeHandlers(blockCustom.type);
        return handlers?.getLocalBounds?.(blockCustom) ?? null;
      }
    }
  }
}
