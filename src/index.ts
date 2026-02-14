// Core types and interfaces
export * from './types';

// Transform system
export { Matrix2D, TransformStack } from './transform';

// Rendering context
export { Canvas2DContext } from './context';
export type { RenderContext } from './context';

// Immediate renderer
export { ImmediateRenderer } from './renderer-immediate';
export type { RendererConfig } from './renderer-immediate';

// Performance
export { PerformanceOptimizer, PerformanceMonitor } from './performance';
export type { Viewport } from './performance';

// Event system
export { EventManager } from './events';
export type { PointerEventData } from './events';
export { HitTester } from './hit-test';
export type { HitTestResult } from './hit-test';

// Block factory functions
export * from './blocks';

// Legacy exports (for backwards compatibility)
export * from './renderer';
