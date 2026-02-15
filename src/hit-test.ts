// Hit testing utilities for event handling
import type { Block, Rc } from './core/types.js';
import { BlockType } from './core/types.js';
import { Matrix2D } from './transform.js';

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
    if (block.props.visible === false) return null;

    // Calculate this block's world transform
    const blockTransform = this.getBlockTransform(block.props);
    const currentTransform = worldTransform.multiply(blockTransform);

    // Transform world coordinates to local space
    const inverse = currentTransform.invert();
    if (!inverse) return null;

    const local = inverse.transformPoint(worldX, worldY);

    // Test children first (reverse order for top-to-bottom)
    if (block.children) {
      for (let i = block.children.length - 1; i >= 0; i--) {
        const childHit = this.hitTest(
          block.children[i],
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

    if (props.x !== undefined || props.y !== undefined) {
      transform = transform.translate(props.x ?? 0, props.y ?? 0);
    }
    if (props.rotation !== undefined) {
      transform = transform.rotate(props.rotation);
    }
    if (props.scaleX !== undefined || props.scaleY !== undefined) {
      transform = transform.scaleXY(props.scaleX ?? 1, props.scaleY ?? 1);
    }
    if (props.skewX !== undefined || props.skewY !== undefined) {
      transform = transform.skewXY(props.skewX ?? 0, props.skewY ?? 0);
    }

    return transform;
  }

  private static hitTestShape(block: Block, x: number, y: number): boolean {
    const xl = x;
    const yl = y;
    const props = block.props as any;

    switch (block.type) {
      case BlockType.Rectangle:
        return this.hitTestRectangle(xl, yl, props.dx, props.dy);

      case BlockType.Circle:
        return this.hitTestCircle(xl, yl, props.radius);

      case BlockType.Ellipse:
        return this.hitTestEllipse(xl, yl, props.radiusX, props.radiusY);

      case BlockType.Line:
        return this.hitTestLine(xl, yl, props.x1, props.y1, props.x2, props.y2, props.strokeWidth ?? 1);

      case BlockType.Text:
        // Approximate text bounds - can be improved with actual text metrics
        const fontSize = props.fontSize ?? 16;
        const textWidth = props.text.length * fontSize * 0.6; // rough estimate
        return this.hitTestRectangle(xl, yl, textWidth, fontSize);

      case BlockType.Arc:
        return this.hitTestArc(xl, yl, props.radius, props.startAngle, props.endAngle);

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
    const props = block.props as any;

    switch (block.type) {
      case BlockType.Rectangle:
        return { x: 0, y: 0, width: props.dx, height: props.dy };

      case BlockType.Circle:
        return {
          x: -props.radius,
          y: -props.radius,
          width: props.radius * 2,
          height: props.radius * 2
        };

      case BlockType.Ellipse:
        return {
          x: -props.radiusX,
          y: -props.radiusY,
          width: props.radiusX * 2,
          height: props.radiusY * 2
        };

      case BlockType.Line:
        const xlMin = Math.min(props.x1, props.x2);
        const xlMax = Math.max(props.x1, props.x2);
        const ylMin = Math.min(props.y1, props.y2);
        const ylMax = Math.max(props.y1, props.y2);
        return { x: xlMin, y: ylMin, width: xlMax - xlMin, height: ylMax - ylMin };

      case BlockType.Text:
        const fontSize = props.fontSize ?? 16;
        const textWidth = props.text.length * fontSize * 0.6;
        return { x: 0, y: 0, width: textWidth, height: fontSize };

      default:
        return null;
    }
  }
}
