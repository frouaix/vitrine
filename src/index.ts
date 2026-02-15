// Core types and interfaces
export * from './core/types.js';

// Transform system
export { Matrix2D, TransformStack } from './transform.js';

// Rendering context
export { Canvas2DContext } from './core/context.js';
export type { RenderContext } from './core/context.js';

// Immediate renderer
export { ImmediateRenderer } from './core/renderer-immediate.js';
export type { RendererConfig } from './core/renderer-immediate.js';

// Performance
export { PerformanceOptimizer, PerformanceMonitor } from './performance.js';
export type { Viewport } from './performance.js';

// Event system
export { EventManager } from './events.js';
export type { PointerEventData } from './events.js';
export { HitTester } from './hit-test.js';
export type { HitTestResult } from './hit-test.js';

// Block factory functions
export * from './core/blocks.js';

// Legacy exports (for backwards compatibility)
export * from './core/renderer.js';
export * from './core/renderer-canvas.js';
export * from './core/renderer-webgl.js';
