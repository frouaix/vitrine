# Copilot Instructions for Vitrine

## Project Overview

Vitrine is an immediate-mode graphics library for TypeScript that provides a declarative, function-based DSL for canvas rendering. It's optimized for productivity applications that need to render tens of thousands of visual elements (10k+ blocks at 60 FPS).

**Key Philosophy**: Immediate-mode rendering means the visual hierarchy is re-described each frame rather than maintaining a retained scene graph. This provides simplicity and flexibility at the cost of requiring full re-description each render cycle.

## Build & Development

```bash
# Install dependencies
pnpm install

# Development server (opens gallery at localhost:8080)
pnpm dev

# Build all packages (core → gui → demo, in topological order)
pnpm build

# Build demo for production
pnpm build:examples

# Deploy demo gallery to GitHub Pages
pnpm deploy

# Clean build artifacts
pnpm clean
```

**Note**: This project has no test suite configured. Focus on ensuring examples run correctly via `pnpm dev`.

Use `pnpm build` and `pnpm lint` to validate changes. (`lint` runs `pnpm -r build && pnpm -r lint` because cross-package type resolution requires `packages/core/dist/` to exist first.)

## Architecture

### Monorepo Structure

The repository is a pnpm workspace monorepo with three packages:

| Package | Directory | npm name | Description |
|---------|-----------|----------|-------------|
| Core | `packages/core/` | `vitrine` | Block tree, rendering, events, hit-testing, performance |
| GUI | `packages/gui/` | `vitrine-gui` | GUI controls, theming, layout, `VitrineComponent` |
| Demo | `packages/demo/` | *(private)* | Demo website, consumes both packages |

Build order is topologically correct: `vitrine` → `vitrine-gui` → demo.

### Core Rendering Model

1. **Block-based DSL**: All visual elements are "blocks" created by factory functions (`rectangle()`, `circle()`, `text()`, `group()`, etc.)
2. **Immediate mode**: Call `renderer.render(scene)` each frame with a fresh block tree
3. **Transform hierarchy**: Each block can have transforms (x, y, rotation, scale, skew) that affect its children
4. **Event system**: Blocks support event handlers (onClick, onHover, onDrag) with transform-aware hit testing

### Key Source Files

**`packages/core/src/`** — published as `vitrine`:
- **`core/types.ts`**: Type definitions for all block types and props
- **`core/blocks.ts`**: Factory functions for creating blocks (rectangle, circle, group, etc.)
- **`core/renderer-immediate.ts`**: Main `ImmediateRenderer` class with render loop
- **`core/context.ts`**: Canvas 2D context wrapper (`Canvas2DContext`)
- **`events.ts`**: Event handling system (`EventManager`)
- **`performance.ts`**: Frustum culling and performance monitoring
- **`transform.ts`**: 2D matrix transform utilities
- **`hit-test.ts`**: Transform-aware hit detection for events

**`packages/gui/src/`** — published as `vitrine-gui`:
- **`GUI/`**: Higher-level UI components (controls, themes, layout)

### Block Factory Pattern

All blocks follow this pattern:
```typescript
export function blockName(props: BlockNameProps, children?: Block[]): Block {
  return {
    type: BlockType.BlockName,
    props,
    children
  };
}
```

Factory functions are pure - they return descriptors, not instances. The renderer interprets these descriptors each frame.

### Transform System

Transforms are hierarchical and use 2D affine matrices:
- Parent transforms affect all children
- Transform props: `x`, `y`, `rotation` (radians), `scaleX`, `scaleY`, `skewX`, `skewY`, `opacity`
- Use `group()` blocks to create transform hierarchies

### Event Handling

Events flow through the transform hierarchy:
1. `EventManager` tracks pointer position
2. Hit testing converts screen space to local space using inverse transforms
3. Events bubble from leaf blocks to root
4. Event handlers: `onClick`, `onPointerDown`, `onPointerUp`, `onPointerMove`, `onHover`, `onDrag`

**Sibling trap**: bubbling only travels up the ancestor chain, never sideways. When building a compound object (e.g. a background rectangle + a text label), placing the event handler on a block that is a *sibling* of the block the pointer actually hits means the handler is never reached. Always place event handlers on the **nearest common ancestor** (typically a `group`) or make the decorative blocks **children** of the interactive block. See [docs/BLOCK_DSL.md §5.6](../docs/BLOCK_DSL.md) for detailed examples.

## Code Conventions

### General Coding Style

- TypeScript only, no JavaScript files
- Uses strict TypeScript (`strict: true`)
- **Always use semicolons** (`;`)
- **Use explicit `.ts` extensions** for all relative TypeScript imports/exports (`./foo.ts`, `../bar.ts`)
- **Keep package imports extensionless** (`vitrine`, `react`)
- **Use explicit return types** for functions
- **Prefer destructuring** over direct property access
- **Hungarian notation** for geometric variables (see `hungarian-notation.md`)
- **Functions returning `Rs` must use an `rs*` prefix** (for example `rsControl`, `rsStack`)
- **Variables of type `Rs` must use an `rs*` prefix** (for example `rsChild`, `rsContent`)
- **Guard Clause / Early Return** pattern for better readability
- **No console.log** in production code
- **No inline CSS** - use CSS Modules or styled components

### File Organization

- Core rendering logic lives in `packages/core/src/core/`
- Core support modules (events, transforms, hit-test, performance) in `packages/core/src/`
- Higher-level GUI components in `packages/gui/src/GUI/`
- Demo HTML files and TypeScript demos in `packages/demo/`
- In `packages/demo`, Vite aliases resolve `'vitrine'` → `packages/core/src/index.ts` and `'vitrine-gui'` → `packages/gui/src/index.ts` for hot-reload during development

### TypeScript Patterns

- All blocks extend `BaseBlockProps` which includes transforms and event handlers
- Block factory functions accept `children?: Block[]` as second parameter (even for leaf nodes)
- Enums used for block types: `BlockType.Rectangle`, `BlockType.Circle`, etc.

### Performance Optimization

- **Culling**: Enabled by default (`enableCulling: true`). Blocks outside viewport are skipped.
- **Performance monitoring**: `renderer.getPerformanceStats()` returns FPS, blocks rendered, blocks culled
- **PerformanceOptimizer** in `performance.ts` handles frustum culling logic
- Avoid creating new objects/arrays inside render loops - pre-allocate when possible

### Examples Pattern

Demo files follow this structure:
1. Import core blocks from `'vitrine'`; import GUI controls from `'vitrine-gui'`
2. Create `ImmediateRenderer` instance
3. Define a `render()` function that builds a block tree and calls `renderer.render(scene)`
4. Call `requestAnimationFrame(render)` for animation loop
5. See `packages/demo/gallery.ts` for the comprehensive demo showcase

## Common Tasks

### Adding a new block type

1. Define props interface in `packages/core/src/core/types.ts` extending `BaseBlockProps`
2. Add enum value to `BlockType`
3. Create factory function in `packages/core/src/core/blocks.ts`
4. Add rendering logic in `packages/core/src/core/renderer-immediate.ts` (in the main render switch)
5. Export from `packages/core/src/index.ts`

### Adding a new example / demo

1. Create `.html` file in `packages/demo/` directory
2. Import from `'vitrine'` or `'vitrine-gui'` (Vite aliases handle resolution to source)
3. Add entry to `packages/demo/gallery.ts` if it should appear in the demo gallery
4. To add to Vite build, update `packages/demo/vite.config.ts` rollupOptions.input

### Debugging rendering issues

1. Use `renderer.getPerformanceStats()` to check if blocks are being culled unexpectedly
2. Check transform hierarchy - parent transforms affect children
3. Verify coordinate space - blocks use relative coordinates within their parent
4. Use `visible: false` prop to hide blocks without removing them from the tree
