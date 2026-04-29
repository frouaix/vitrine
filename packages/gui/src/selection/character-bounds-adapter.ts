// Copyright (c) 2026 François Rouaix

import {
  BlockType,
  Matrix2D,
  Canvas2DContext,
  layoutTextCharacterBounds
} from 'vitrine';
import type {
  Block,
  Rc,
  RenderContext,
  TextProps
} from 'vitrine';
import type { CharacterBoundsProvider } from './TextSelectionManager.ts';

export interface CharacterBoundsAdapterOptions {
  /**
   * Optional measurement context. When omitted, the adapter attempts to create
   * an internal fallback 2D measurement context and falls back to approximated
   * metrics if that is unavailable.
   */
  context?: RenderContext;
}

export interface CharacterBoundsUpdateResult {
  changedBlockIds: string[];
  selectableTextBlockIds: string[];
}

interface TextBlockDescriptor {
  blockId: string;
  text: string;
  props: TextProps;
  transformWorld: Matrix2D;
  layoutSignature: string;
  worldSignature: string;
}

interface TextBoundsCacheEntry {
  descriptor: TextBlockDescriptor;
  boundsLocal?: Rc[];
  boundsWorld?: Rc[];
}

function applyPropsTransform(matrixParent: Matrix2D, props: Record<string, unknown>): Matrix2D {
  let matrix = matrixParent;

  const x = typeof props.x === 'number' ? props.x : 0;
  const y = typeof props.y === 'number' ? props.y : 0;
  if (x !== 0 || y !== 0) {
    matrix = matrix.translate(x, y);
  }

  if (typeof props.rotation === 'number') {
    matrix = matrix.rotate(props.rotation);
  }

  const scaleX = typeof props.scaleX === 'number' ? props.scaleX : 1;
  const scaleY = typeof props.scaleY === 'number' ? props.scaleY : 1;
  if (scaleX !== 1 || scaleY !== 1) {
    matrix = matrix.scaleXY(scaleX, scaleY);
  }

  const skewX = typeof props.skewX === 'number' ? props.skewX : 0;
  const skewY = typeof props.skewY === 'number' ? props.skewY : 0;
  if (skewX !== 0 || skewY !== 0) {
    matrix = matrix.skewXY(skewX, skewY);
  }

  return matrix;
}

function transformBounds(boundsLocal: Rc, transform: Matrix2D): Rc {
  const cornerTopLeft = transform.transformPoint(boundsLocal.x, boundsLocal.y);
  const cornerTopRight = transform.transformPoint(boundsLocal.x + boundsLocal.width, boundsLocal.y);
  const cornerBottomLeft = transform.transformPoint(boundsLocal.x, boundsLocal.y + boundsLocal.height);
  const cornerBottomRight = transform.transformPoint(boundsLocal.x + boundsLocal.width, boundsLocal.y + boundsLocal.height);
  const xs = [cornerTopLeft.x, cornerTopRight.x, cornerBottomLeft.x, cornerBottomRight.x];
  const ys = [cornerTopLeft.y, cornerTopRight.y, cornerBottomLeft.y, cornerBottomRight.y];
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);

  return {
    x: xMin,
    y: yMin,
    width: Math.max(0, xMax - xMin),
    height: Math.max(0, yMax - yMin)
  };
}

function createFallbackRenderContext(): RenderContext | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return undefined;
  }
  return new Canvas2DContext(ctx);
}

function signaturePart(value: unknown): string {
  if (value === undefined) {
    return 'u';
  }
  if (value === null) {
    return 'n';
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return 'nan';
    }
    return String(value);
  }
  return String(value);
}

function buildTextLayoutSignature(props: TextProps): string {
  return [
    props.text,
    props.font,
    props.fontSize,
    props.align,
    props.baseline,
    props.dx,
    props.dy,
    props.dyLineHeight
  ].map(signaturePart).join('|');
}

function buildWorldTransformSignature(transform: Matrix2D): string {
  return [
    transform.a,
    transform.b,
    transform.c,
    transform.d,
    transform.e,
    transform.f
  ].map(signaturePart).join('|');
}

function toTextDescriptor(block: Block, transformWorld: Matrix2D): TextBlockDescriptor | null {
  if (
    block.type !== BlockType.Text
    || typeof block.props.id !== 'string'
    || block.props.id.length === 0
  ) {
    return null;
  }

  const props = block.props as TextProps;
  const blockId = block.props.id;
  return {
    blockId,
    text: props.text,
    props,
    transformWorld,
    layoutSignature: buildTextLayoutSignature(props),
    worldSignature: buildWorldTransformSignature(transformWorld)
  };
}

function transformBoundsCollection(boundsLocal: Rc[], transform: Matrix2D): Rc[] {
  return boundsLocal.map((bounds) => transformBounds(bounds, transform));
}

export class CharacterBoundsAdapter {
  private context: RenderContext | undefined;
  private cacheByBlockId: Map<string, TextBoundsCacheEntry> = new Map();
  private selectableTextBlockIds: string[] = [];

  constructor(options: CharacterBoundsAdapterOptions = {}) {
    this.context = options.context ?? createFallbackRenderContext();
  }

  private getLocalBounds(entry: TextBoundsCacheEntry): Rc[] {
    if (entry.boundsLocal) {
      return entry.boundsLocal;
    }
    entry.boundsLocal = layoutTextCharacterBounds(
      entry.descriptor.text,
      entry.descriptor.props,
      this.context
    );
    return entry.boundsLocal;
  }

  private getWorldBounds(entry: TextBoundsCacheEntry): Rc[] {
    if (entry.boundsWorld) {
      return entry.boundsWorld;
    }
    const boundsLocal = this.getLocalBounds(entry);
    entry.boundsWorld = transformBoundsCollection(boundsLocal, entry.descriptor.transformWorld);
    return entry.boundsWorld;
  }

  private buildDescriptorMap(root: Block): Map<string, TextBlockDescriptor> {
    const descriptorsByBlockId = new Map<string, TextBlockDescriptor>();
    const stack: Array<{ block: Block; transform: Matrix2D }> = [{ block: root, transform: Matrix2D.identity() }];

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) {
        continue;
      }

      const { block, transform: transformParent } = current;
      const transformWorld = applyPropsTransform(transformParent, block.props as Record<string, unknown>);
      const descriptor = toTextDescriptor(block, transformWorld);
      if (descriptor) {
        descriptorsByBlockId.set(descriptor.blockId, descriptor);
      }

      const rgblChildren = block.rgblChildren;
      if (!rgblChildren) {
        continue;
      }

      for (let i = rgblChildren.length - 1; i >= 0; i--) {
        const child = rgblChildren[i];
        if (!child) {
          continue;
        }
        stack.push({ block: child, transform: transformWorld });
      }
    }

    return descriptorsByBlockId;
  }

  updateFromBlockTree(root: Block): CharacterBoundsUpdateResult {
    const descriptorsByBlockId = this.buildDescriptorMap(root);
    const nextCacheByBlockId = new Map<string, TextBoundsCacheEntry>();
    const changedBlockIds = new Set<string>();
    const selectableTextBlockIds = Array.from(descriptorsByBlockId.keys());

    for (const [blockId, descriptor] of descriptorsByBlockId.entries()) {
      const previous = this.cacheByBlockId.get(blockId);
      if (!previous) {
        nextCacheByBlockId.set(blockId, { descriptor });
        changedBlockIds.add(blockId);
        continue;
      }

      const layoutChanged = previous.descriptor.layoutSignature !== descriptor.layoutSignature;
      const worldChanged = previous.descriptor.worldSignature !== descriptor.worldSignature;
      if (layoutChanged || worldChanged) {
        changedBlockIds.add(blockId);
      }

      nextCacheByBlockId.set(blockId, {
        descriptor,
        boundsLocal: layoutChanged ? undefined : previous.boundsLocal,
        boundsWorld: layoutChanged || worldChanged ? undefined : previous.boundsWorld
      });
    }

    for (const blockId of this.cacheByBlockId.keys()) {
      if (!nextCacheByBlockId.has(blockId)) {
        changedBlockIds.add(blockId);
      }
    }

    this.cacheByBlockId = nextCacheByBlockId;
    this.selectableTextBlockIds = selectableTextBlockIds;

    return {
      changedBlockIds: Array.from(changedBlockIds),
      selectableTextBlockIds: [...this.selectableTextBlockIds]
    };
  }

  getSelectableTextBlockIds(): string[] {
    return [...this.selectableTextBlockIds];
  }

  getProvider(): CharacterBoundsProvider {
    return (blockId: string, charIndex: number): Rc | null => {
      if (charIndex < 0) {
        return null;
      }
      const entry = this.cacheByBlockId.get(blockId);
      if (!entry) {
        return null;
      }
      const boundsWorld = this.getWorldBounds(entry);
      return boundsWorld[charIndex] ?? null;
    };
  }
}

export function createCharacterBoundsAdapter(
  options: CharacterBoundsAdapterOptions = {}
): CharacterBoundsAdapter {
  return new CharacterBoundsAdapter(options);
}

/**
 * Build a CharacterBoundsProvider from a rendered block tree.
 * The provider uses the same text metrics/wrap/alignment conventions as Vitrine's renderer.
 */
export function createCharacterBoundsProviderFromBlockTree(
  root: Block,
  options: CharacterBoundsAdapterOptions = {}
): CharacterBoundsProvider {
  const adapter = createCharacterBoundsAdapter(options);
  adapter.updateFromBlockTree(root);
  return adapter.getProvider();
}
