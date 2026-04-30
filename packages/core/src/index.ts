// Copyright (c) 2026 François Rouaix

// Core types and interfaces
export * from './core/types.ts';

// Transform system
export { Matrix2D, TransformStack, transformRc } from './transform.ts';

// Rendering context
export {
  Canvas2DContext,
  DU_FONTSIZE_DEFAULT,
  SF_TEXT_ASCENT_DEFAULT,
  SF_TEXT_DESCENT_DEFAULT,
  SF_TEXT_ADVANCE_APPROX_DEFAULT,
  SF_TEXT_LINE_HEIGHT_DEFAULT
} from './core/context.ts';
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
export type { Selection, TextLayout, TextLine } from './core/selection-types.ts';
export { measureText, calculateTextOffset, getCharacterBounds, hitTestCharacter, layoutTextCharacterBounds, getTextBlockRc as getTextBlockBounds } from './core/text-layout.ts';
export { getBlockTransform, getBlockBounds } from './core/bounds.ts';
export {
  registerBlockType,
  unregisterBlockType,
  getBlockTypeHandlers
} from './core/block-registry.ts';
export type {
  BlockLayoutCache,
  CustomBlockHandlers,
  CustomBlockRenderApi,
  CustomBlockHitTestApi,
  CustomBlockDebugApi
} from './core/block-registry.ts';

// Block factory functions
export * from './core/blocks.ts';

// Gradient & pattern factories
export * from './core/fill-styles.ts';

// Legacy exports (for backwards compatibility)
export * from './core/renderer.ts';
export * from './core/renderer-canvas.ts';
export * from './core/renderer-webgl.ts';
