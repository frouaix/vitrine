// Copyright (c) 2026 François Rouaix

// Performance optimization utilities
import type { Block, Rc } from './core/types.ts';
import { HitTester } from './hit-test.ts';
import { Matrix2D } from './transform.ts';

export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class PerformanceOptimizer {
  // Check if bounds intersect viewport (frustum culling)
  static isInViewport(bounds: Rc, viewport: Viewport): boolean {
    return !(
      bounds.x + bounds.width < viewport.x ||
      bounds.x > viewport.x + viewport.width ||
      bounds.y + bounds.height < viewport.y ||
      bounds.y > viewport.y + viewport.height
    );
  }

  // Cull blocks outside viewport
  static cullBlocks(
    block: Block,
    viewport: Viewport,
    worldTransform: Matrix2D = Matrix2D.identity()
  ): boolean {
    const { props } = block;
    const { visible } = props;
    if (visible === false) return false;

    // Get world bounds (getBounds will apply the block's transform)
    const boundsWorld = HitTester.getBounds(block, worldTransform);
    if (!boundsWorld) {
      // If we can't calculate bounds, assume visible
      return true;
    }

    // Check if in viewport
    return this.isInViewport(boundsWorld, viewport);
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

  // Object pooling for frequently allocated objects
  private static transformPool: Matrix2D[] = [];
  private static pointPool: { xc: number; yc: number }[] = [];

  static getPooledTransform(): Matrix2D {
    return this.transformPool.pop() || Matrix2D.identity();
  }

  static returnPooledTransform(transform: Matrix2D): void {
    if (this.transformPool.length < 1000) {
      this.transformPool.push(transform);
    }
  }

  static getPooledPoint(): { xc: number; yc: number } {
    return this.pointPool.pop() || { xc: 0, yc: 0 };
  }

  static returnPooledPoint(point: { xc: number; yc: number }): void {
    if (this.pointPool.length < 1000) {
      this.pointPool.push(point);
    }
  }

  // Performance stats
  static stats = {
    blocksRendered: 0,
    blocksCulled: 0,
    renderTime: 0,
    fps: 0
  };

  static resetStats(): void {
    this.stats.blocksRendered = 0;
    this.stats.blocksCulled = 0;
  }
}

export class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fpsHistory: number[] = [];

  update(): void {
    this.frameCount++;
    const currentTime = performance.now();
    const elapsed = currentTime - this.lastTime;

    if (elapsed >= 1000) {
      const fps = (this.frameCount / elapsed) * 1000;
      this.fpsHistory.push(fps);
      if (this.fpsHistory.length > 60) {
        this.fpsHistory.shift();
      }
      PerformanceOptimizer.stats.fps = Math.round(fps);
      this.frameCount = 0;
      this.lastTime = currentTime;
    }
  }

  getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return 0;
    const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.fpsHistory.length);
  }

  getStats() {
    return {
      ...PerformanceOptimizer.stats,
      averageFPS: this.getAverageFPS()
    };
  }
}
