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

# Build TypeScript library (outputs to dist/)
pnpm build

# Build examples for production (outputs to dist-examples/)
pnpm build:examples

# Deploy examples to GitHub Pages
pnpm deploy

# Clean build artifacts
pnpm clean
```

**Note**: This project has no test suite or linters configured. Focus on ensuring examples run correctly via `pnpm dev`.

## Architecture

### Core Rendering Model

1. **Block-based DSL**: All visual elements are "blocks" created by factory functions (`rectangle()`, `circle()`, `text()`, `group()`, etc.)
2. **Immediate mode**: Call `renderer.render(scene)` each frame with a fresh block tree
3. **Transform hierarchy**: Each block can have transforms (x, y, rotation, scale, skew) that affect its children
4. **Event system**: Blocks support event handlers (onClick, onHover, onDrag) with transform-aware hit testing

### Key Source Files

- **`src/core/types.ts`**: Type definitions for all block types and props
- **`src/core/blocks.ts`**: Factory functions for creating blocks (rectangle, circle, group, etc.)
- **`src/core/renderer-immediate.ts`**: Main `ImmediateRenderer` class with render loop
- **`src/core/context.ts`**: Canvas 2D context wrapper (`Canvas2DContext`)
- **`src/events.ts`**: Event handling system (`EventManager`)
- **`src/performance.ts`**: Frustum culling and performance monitoring
- **`src/transform.ts`**: 2D matrix transform utilities
- **`src/hit-test.ts`**: Transform-aware hit detection for events
- **`src/GUI/`**: Higher-level UI components (controls, themes)

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

## Code Conventions

### General Coding Style

- TypeScript only, no JavaScript files
- Uses strict TypeScript (`strict: true`)
- **Always use semicolons** (`;`)
- **Use explicit return types** for functions
- **Prefer destructuring** over direct property access
- **Hungarian notation** for geometric variables (see `hungarian-notation.md`)
- **Guard Clause / Early Return** pattern for better readability
- **No console.log** in production code
- **No inline CSS** - use CSS Modules or styled components

### File Organization

- Core rendering logic lives in `src/core/`
- Higher-level GUI components in `src/GUI/`
- Examples are standalone HTML files in `examples/` that import from `vitrine`
- Vite alias resolves `'vitrine'` imports to `./src/index.ts` in dev mode

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

Examples follow this structure:
1. Import from `'vitrine'` (resolves to `./src/index.ts`)
2. Create `ImmediateRenderer` instance
3. Define a `render()` function that builds a block tree and calls `renderer.render(scene)`
4. Call `requestAnimationFrame(render)` for animation loop
5. See `examples/gallery.js` for the comprehensive demo showcase

## Common Tasks

### Adding a new block type

1. Define props interface in `src/core/types.ts` extending `BaseBlockProps`
2. Add enum value to `BlockType`
3. Create factory function in `src/core/blocks.ts`
4. Add rendering logic in `src/core/renderer-immediate.ts` (in the main render switch)
5. Export from `src/index.ts`

### Adding a new example

1. Create `.html` file in `examples/` directory
2. Import from `'vitrine'` (Vite alias handles this)
3. Add entry to `gallery.js` if it should appear in the demo gallery
4. To add to Vite build, update `vite.config.ts` rollupOptions.input

### Debugging rendering issues

1. Use `renderer.getPerformanceStats()` to check if blocks are being culled unexpectedly
2. Check transform hierarchy - parent transforms affect children
3. Verify coordinate space - blocks use relative coordinates within their parent
4. Use `visible: false` prop to hide blocks without removing them from the tree
