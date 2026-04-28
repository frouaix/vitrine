// Copyright (c) 2026 François Rouaix

import type { RenderContext } from './context.ts';
import type { Block, Rc } from './types.ts';

export interface CustomBlockDescriptor {
  type: string;
  props: Record<string, unknown>;
  rgblChildren?: Block[];
}

export interface BlockLayoutCache {
  mpbl_rc: WeakMap<Block, Rc>;
}

export interface CustomBlockRenderApi {
  context: RenderContext;
  layoutCache: BlockLayoutCache;
  setLayoutBounds: (bounds: Rc) => void;
}

export interface CustomBlockHitTestApi {
  layoutCache?: BlockLayoutCache;
}

export interface CustomBlockDebugApi {
  context: RenderContext;
}

export interface CustomBlockHandlers {
  render?: (block: CustomBlockDescriptor, api: CustomBlockRenderApi) => void;
  hitTestShape?: (block: CustomBlockDescriptor, xl: number, yl: number, api: CustomBlockHitTestApi) => boolean;
  getLocalBounds?: (block: CustomBlockDescriptor) => Rc | null;
  getDebugOutlineBounds?: (block: CustomBlockDescriptor, api: CustomBlockDebugApi) => Rc | null;
}

const mpCustomBlockHandlers = new Map<string, CustomBlockHandlers>();

export function registerBlockType(type: string, handlers: CustomBlockHandlers): void {
  mpCustomBlockHandlers.set(type, handlers);
}

export function unregisterBlockType(type: string): void {
  mpCustomBlockHandlers.delete(type);
}

export function getBlockTypeHandlers(type: string): CustomBlockHandlers | undefined {
  return mpCustomBlockHandlers.get(type);
}
