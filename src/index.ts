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

// Block factory functions
export * from './blocks';

// Legacy exports (for backwards compatibility)
export * from './renderer';
