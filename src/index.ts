// Core types and interfaces
export * from './types.js';

// Transform system
export { Matrix2D, TransformStack } from './transform.js';

// Rendering context
export { Canvas2DContext } from './context.js';
export type { RenderContext } from './context.js';

// Immediate renderer
export { ImmediateRenderer } from './renderer-immediate.js';
export type { RendererConfig } from './renderer-immediate.js';

// Performance
export { PerformanceOptimizer, PerformanceMonitor } from './performance.js';
export type { Viewport } from './performance.js';

// Event system
export { EventManager } from './events.js';
export type { PointerEventData } from './events.js';
export { HitTester } from './hit-test.js';
export type { HitTestResult } from './hit-test.js';

// Block factory functions
export * from './blocks.js';

// Legacy exports (for backwards compatibility)
export * from './renderer.js';
