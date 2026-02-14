// Hit testing utilities for event handling
import type { Block, Bounds } from './types';
import { BlockType } from './types';
import { Matrix2D } from './transform';

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
    const props = block.props as any;

    switch (block.type) {
      case BlockType.Rectangle:
        return this.hitTestRectangle(x, y, props.width, props.height);

      case BlockType.Circle:
        return this.hitTestCircle(x, y, props.radius);

      case BlockType.Ellipse:
        return this.hitTestEllipse(x, y, props.radiusX, props.radiusY);

      case BlockType.Line:
        return this.hitTestLine(x, y, props.x1, props.y1, props.x2, props.y2, props.strokeWidth ?? 1);

      case BlockType.Text:
        // Approximate text bounds - can be improved with actual text metrics
        const fontSize = props.fontSize ?? 16;
        const textWidth = props.text.length * fontSize * 0.6; // rough estimate
        return this.hitTestRectangle(x, y, textWidth, fontSize);

      case BlockType.Arc:
        return this.hitTestArc(x, y, props.radius, props.startAngle, props.endAngle);

      case BlockType.Group:
      case BlockType.Layer:
        // Groups don't have intrinsic shape, rely on children
        return false;

      default:
        return false;
    }
  }

  private static hitTestRectangle(x: number, y: number, width: number, height: number): boolean {
    return x >= 0 && x <= width && y >= 0 && y <= height;
  }

  private static hitTestCircle(x: number, y: number, radius: number): boolean {
    return x * x + y * y <= radius * radius;
  }

  private static hitTestEllipse(x: number, y: number, radiusX: number, radiusY: number): boolean {
    return (x * x) / (radiusX * radiusX) + (y * y) / (radiusY * radiusY) <= 1;
  }

  private static hitTestLine(
    x: number,
    y: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    strokeWidth: number
  ): boolean {
    // Distance from point to line segment
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) {
      // Line is a point
      const dist = Math.sqrt((x - x1) * (x - x1) + (y - y1) * (y - y1));
      return dist <= strokeWidth / 2;
    }

    // Project point onto line
    const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lengthSquared));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;

    const dist = Math.sqrt((x - projX) * (x - projX) + (y - projY) * (y - projY));
    return dist <= strokeWidth / 2;
  }

  private static hitTestArc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number
  ): boolean {
    const distance = Math.sqrt(x * x + y * y);
    if (Math.abs(distance - radius) > 5) return false; // 5px tolerance for arc stroke

    const angle = Math.atan2(y, x);
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
  static getBounds(block: Block, worldTransform: Matrix2D = Matrix2D.identity()): Bounds | null {
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

    const minX = Math.min(...corners.map(c => c.x));
    const maxX = Math.max(...corners.map(c => c.x));
    const minY = Math.min(...corners.map(c => c.y));
    const maxY = Math.max(...corners.map(c => c.y));

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  private static getLocalBounds(block: Block): Bounds | null {
    const props = block.props as any;

    switch (block.type) {
      case BlockType.Rectangle:
        return { x: 0, y: 0, width: props.width, height: props.height };

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
        const minX = Math.min(props.x1, props.x2);
        const maxX = Math.max(props.x1, props.x2);
        const minY = Math.min(props.y1, props.y2);
        const maxY = Math.max(props.y1, props.y2);
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };

      case BlockType.Text:
        const fontSize = props.fontSize ?? 16;
        const textWidth = props.text.length * fontSize * 0.6;
        return { x: 0, y: 0, width: textWidth, height: fontSize };

      default:
        return null;
    }
  }
}
