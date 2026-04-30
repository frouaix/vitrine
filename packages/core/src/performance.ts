// Copyright (c) 2026 François Rouaix

// Performance optimization utilities
import type { Block, Rc } from './core/types.ts';
import { getBlockBounds } from './core/bounds.ts';
import { getTextLayoutCacheStats } from './core/text-layout.ts';
import { Matrix2D } from './transform.ts';

export type PerformanceHookMetrics = Record<string, number | string | boolean | null>;
export type PerformanceStatsHook = () => PerformanceHookMetrics;

export interface PerformanceStatsSnapshot {
  blocksRendered: number;
  blocksCulled: number;
  renderTime: number;
  fps: number;
  averageFPS: number;
  hooks: Record<string, PerformanceHookMetrics>;
}

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
    const { fVisible: visible, fDisableCulling: disableCulling } = props;
    if (visible === false) return false;

    if (disableCulling) {
      return true;
    }

    // Get world bounds (getBounds will apply the block's transform)
    const boundsWorld = getBlockBounds(block, worldTransform);
    if (!boundsWorld) {
      // If we can't calculate bounds, assume visible
      return true;
    }

    // Check if in viewport
    return this.isInViewport(boundsWorld, viewport);
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
  private static mpstHook_mpfnStats = new Map<string, PerformanceStatsHook>([
    ['textLayoutCache', () => getTextLayoutCacheStats()]
  ]);

  private frameCount = 0;
  private lastTime = performance.now();
  private fpsHistory: number[] = [];

  static registerStatsHook(stName: string, fnStats: PerformanceStatsHook): void {
    this.mpstHook_mpfnStats.set(stName, fnStats);
  }

  static unregisterStatsHook(stName: string): void {
    this.mpstHook_mpfnStats.delete(stName);
  }

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

  getStats(): PerformanceStatsSnapshot {
    const mpstHookMetrics: Record<string, PerformanceHookMetrics> = {};
    for (const [stName, fnStats] of PerformanceMonitor.mpstHook_mpfnStats.entries()) {
      try {
        mpstHookMetrics[stName] = fnStats();
      } catch {
        mpstHookMetrics[stName] = {
          fError: true
        };
      }
    }

    return {
      ...PerformanceOptimizer.stats,
      averageFPS: this.getAverageFPS(),
      hooks: mpstHookMetrics
    };
  }
}
