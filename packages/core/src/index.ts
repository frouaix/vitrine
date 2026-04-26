// Copyright (c) 2026 François Rouaix

// Core types and interfaces
export * from './core/types.ts';

// Transform system
export { Matrix2D, TransformStack } from './transform.ts';

// Rendering context
export { Canvas2DContext } from './core/context.ts';
export type { RenderContext } from './core/context.ts';

// Immediate renderer
export { ImmediateRenderer } from './core/renderer-immediate.ts';
export type { RendererConfig } from './core/renderer-immediate.ts';

// Performance
export { PerformanceOptimizer, PerformanceMonitor } from './performance.ts';
export type { Viewport } from './performance.ts';

// Event system
export { EventManager } from './events.ts';
export type { PointerEventData, ActiveTooltip } from './events.ts';
export { HitTester } from './hit-test.ts';
export type { HitTestResult } from './hit-test.ts';

// Selection system
export type { Selection, TextMetrics, CharacterBounds, TextLayout, TextLine } from './core/selection-types.ts';
export { measureText, calculateTextOffset, getCharacterBounds, hitTestCharacter, layoutTextCharacterBounds, getTextBlockBounds } from './core/text-layout.ts';

// Block factory functions
export * from './core/blocks.ts';

// Gradient & pattern factories
export * from './core/fill-styles.ts';

// Legacy exports (for backwards compatibility)
export * from './core/renderer.ts';
export * from './core/renderer-canvas.ts';
export * from './core/renderer-webgl.ts';
