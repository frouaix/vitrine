// Copyright (c) 2026 François Rouaix

import {
  BlockType,
  Matrix2D,
  Canvas2DContext,
  layoutTextCharacterBounds,
  getBlockTypeHandlers,
  getBlockTransform,
  transformRc
} from 'vitrine';
import type {
  Block,
  CustomBlockDescriptor,
  CustomBlockSelectionGeometry,
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

interface CharacterBoundsDescriptor {
  blockId: string;
  transformWorld: Matrix2D;
  layoutSignature: string;
  resolveLocalBounds: () => Rc[];
  worldSignature: string;
}

/** Cache bounds per character for text block, keyed by id+hash of text/props/transform */
interface TextBoundsCacheEntry {
  descriptor: CharacterBoundsDescriptor;
  rgrcl?: Rc[];
  rgrcs?: Rc[];
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

function toTextDescriptor(block: Block, xfCur: Matrix2D, context?: RenderContext): CharacterBoundsDescriptor | null {
  if (
    typeof block.props.id !== 'string'
    || block.props.id.length === 0
  ) {
    return null;
  }

  const props = block.props as TextProps;
  const blockId = block.props.id;
  return {
    blockId,
    transformWorld: xfCur,
    layoutSignature: buildTextLayoutSignature(props),
    resolveLocalBounds: () => layoutTextCharacterBounds(props.text, props, context),
    worldSignature: buildWorldTransformSignature(xfCur)
  };
}

function toCustomSelectionDescriptor(
  geometry: CustomBlockSelectionGeometry,
  xfCur: Matrix2D
): CharacterBoundsDescriptor | null {
  if (geometry.blockId.length === 0) {
    return null;
  }

  const resolveCharacterBounds = geometry.resolveCharacterBounds
    ?? (geometry.rgrclCharacterBounds
      ? (): Rc[] => geometry.rgrclCharacterBounds ?? []
      : null);
  if (!resolveCharacterBounds) {
    return null;
  }

  return {
    blockId: geometry.blockId,
    transformWorld: xfCur,
    layoutSignature: geometry.layoutSignature,
    resolveLocalBounds: resolveCharacterBounds,
    worldSignature: buildWorldTransformSignature(xfCur)
  };
}

function transformBoundsCollection(rgrcl: Rc[], xf: Matrix2D): Rc[] {
  return rgrcl.map((rc) => transformRc(rc, xf));
}

export class CharacterBoundsAdapter {
  private context: RenderContext | undefined;
  private cacheByBlockId: Map<string, TextBoundsCacheEntry> = new Map();
  private selectableTextBlockIds: string[] = [];

  constructor(options: CharacterBoundsAdapterOptions = {}) {
    this.context = options.context ?? createFallbackRenderContext();
  }

  private ensureRgrcl(entry: TextBoundsCacheEntry): Rc[] {
    if (!entry.rgrcl) {
      entry.rgrcl = entry.descriptor.resolveLocalBounds();
    }
    return entry.rgrcl;
  }

  private ensureRgrcs(entry: TextBoundsCacheEntry): Rc[] {
    if (!entry.rgrcs) {
      entry.rgrcs = transformBoundsCollection(this.ensureRgrcl(entry), entry.descriptor.transformWorld);
    }
    return entry.rgrcs;
  }

  private buildDescriptorMap(blRoot: Block): Map<string, CharacterBoundsDescriptor> {
    const descriptorsByBlockId = new Map<string, CharacterBoundsDescriptor>();
    const stack: Array<{ block: Block; transform: Matrix2D }> = [{ block: blRoot, transform: Matrix2D.identity() }];

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) {
        continue;
      }

      const { block, transform: transformParent } = current;
      const transformWorld = transformParent.multiply(getBlockTransform(block.props));
      if (block.type === BlockType.Text) {
        const descriptor = toTextDescriptor(block, transformWorld, this.context);
        if (descriptor) {
          descriptorsByBlockId.set(descriptor.blockId, descriptor);
        }
      } else {
        const handlers = getBlockTypeHandlers(block.type);
        const geometry = handlers?.getSelectionGeometry?.(
          block as unknown as CustomBlockDescriptor,
          { context: this.context }
        );
        if (geometry) {
          const descriptor = toCustomSelectionDescriptor(geometry, transformWorld);
          if (descriptor) {
            descriptorsByBlockId.set(descriptor.blockId, descriptor);
          }
        }
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

  updateFromBlockTree(blRoot: Block): CharacterBoundsUpdateResult {
    const descriptorsByBlockId = this.buildDescriptorMap(blRoot);
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
        rgrcl: layoutChanged ? undefined : previous.rgrcl,
        rgrcs: layoutChanged || worldChanged ? undefined : previous.rgrcs
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
      const boundsWorld = this.ensureRgrcs(entry);
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
