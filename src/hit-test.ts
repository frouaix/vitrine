// Copyright (c) 2026 François Rouaix

// Hit testing utilities for event handling
import type { Block, Rc } from './core/types.ts';
import { BlockType } from './core/types.ts';
import { Matrix2D } from './transform.ts';

export interface HitTestResult {
  block: Block;
  localX: number;
  localY: number;
  worldX: number;
  worldY: number;
}

export class HitTester {
  // Test if a point hits a block, considering its transform
  static hitTest(
    block: Block,
    worldX: number,
    worldY: number,
    worldTransform: Matrix2D = Matrix2D.identity()
  ): HitTestResult | null {
    const { props, children } = block;
    const { visible } = props;
    if (visible === false) return null;

    // Calculate this block's world transform
    const blockTransform = this.getBlockTransform(props);
    const currentTransform = worldTransform.multiply(blockTransform);

    // Transform world coordinates to local space
    const inverse = currentTransform.invert();
    if (!inverse) return null;

    const local = inverse.transformPoint(worldX, worldY);

    // Test children first (reverse order for top-to-bottom)
    if (children) {
      for (let i = children.length - 1; i >= 0; i--) {
        const childHit = this.hitTest(
          children[i],
          worldX,
          worldY,
          currentTransform
        );
        if (childHit) return childHit;
      }
    }

    // Test this block
    if (this.hitTestShape(block, local.x, local.y)) {
      return {
        block,
        localX: local.x,
        localY: local.y,
        worldX,
        worldY
      };
    }

    return null;
  }

  private static getBlockTransform(props: any): Matrix2D {
    let transform = Matrix2D.identity();
    const { x, y, rotation, scaleX, scaleY, skewX, skewY } = props;

    if (x !== undefined || y !== undefined) {
      transform = transform.translate(x ?? 0, y ?? 0);
    }
    if (rotation !== undefined) {
      transform = transform.rotate(rotation);
    }
    if (scaleX !== undefined || scaleY !== undefined) {
      transform = transform.scaleXY(scaleX ?? 1, scaleY ?? 1);
    }
    if (skewX !== undefined || skewY !== undefined) {
      transform = transform.skewXY(skewX ?? 0, skewY ?? 0);
    }

    return transform;
  }

  private static hitTestShape(block: Block, x: number, y: number): boolean {
    const xl = x;
    const yl = y;
    const { props } = block as { props: any };

    switch (block.type) {
      case BlockType.Rectangle: {
        const { dx, dy } = props;
        return this.hitTestRectangle(xl, yl, dx, dy);
      }

      case BlockType.Circle: {
        const { radius } = props;
        return this.hitTestCircle(xl, yl, radius);
      }

      case BlockType.Ellipse: {
        const { radiusX, radiusY } = props;
        return this.hitTestEllipse(xl, yl, radiusX, radiusY);
      }

      case BlockType.Line: {
        const { x1, y1, x2, y2, strokeWidth } = props;
        return this.hitTestLine(xl, yl, x1, y1, x2, y2, strokeWidth ?? 1);
      }

      case BlockType.Text:
        // Approximate text bounds - can be improved with actual text metrics
        const { fontSize: duFont, text: stText } = props;
        const fontSize = duFont ?? 16;
        const textWidth = stText.length * fontSize * 0.6; // rough estimate
        return this.hitTestRectangle(xl, yl, textWidth, fontSize);

      case BlockType.Arc: {
        const { radius, startAngle, endAngle } = props;
        return this.hitTestArc(xl, yl, radius, startAngle, endAngle);
      }

      case BlockType.Group:
      case BlockType.Layer:
        // Groups don't have intrinsic shape, rely on children
        return false;

      default:
        return false;
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
    const lengthSquared = dxl * dxl + dyl * dyl;

    if (lengthSquared === 0) {
      // Line is a point
      const dist = Math.sqrt((xl - xl1) * (xl - xl1) + (yl - yl1) * (yl - yl1));
      return dist <= strokeWidth / 2;
    }

    // Project point onto line
    const t = Math.max(0, Math.min(1, ((xl - xl1) * dxl + (yl - yl1) * dyl) / lengthSquared));
    const xlProj = xl1 + t * dxl;
    const ylProj = yl1 + t * dyl;

    const dist = Math.sqrt((xl - xlProj) * (xl - xlProj) + (yl - ylProj) * (yl - ylProj));
    return dist <= strokeWidth / 2;
  }

  private static hitTestArc(
    xl: number,
    yl: number,
    rl: number,
    startAngle: number,
    endAngle: number
  ): boolean {
    const distance = Math.sqrt(xl * xl + yl * yl);
    if (Math.abs(distance - rl) > 5) return false; // 5px tolerance for arc stroke

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
    const { props } = block as { props: any };

    switch (block.type) {
      case BlockType.Rectangle: {
        const { dx, dy } = props;
        return { x: 0, y: 0, width: dx, height: dy };
      }

      case BlockType.Circle: {
        const { radius } = props;
        return {
          x: -radius,
          y: -radius,
          width: radius * 2,
          height: radius * 2
        };
      }

      case BlockType.Ellipse: {
        const { radiusX, radiusY } = props;
        return {
          x: -radiusX,
          y: -radiusY,
          width: radiusX * 2,
          height: radiusY * 2
        };
      }

      case BlockType.Line: {
        const { x1, x2, y1, y2 } = props;
        const xlMin = Math.min(x1, x2);
        const xlMax = Math.max(x1, x2);
        const ylMin = Math.min(y1, y2);
        const ylMax = Math.max(y1, y2);
        return { x: xlMin, y: ylMin, width: xlMax - xlMin, height: ylMax - ylMin };
      }

      case BlockType.Text: {
        const { fontSize: duFont, text: stText } = props;
        const fontSize = duFont ?? 16;
        const textWidth = stText.length * fontSize * 0.6;
        return { x: 0, y: 0, width: textWidth, height: fontSize };
      }

      default:
        return null;
    }
  }
}
