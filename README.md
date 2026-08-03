# <img src="branding/logo-32.png" alt="Vitrine logo" width="32" height="32"> Vitrine

[![CI](https://github.com/frouaix/vitrine/actions/workflows/ci.yml/badge.svg)](https://github.com/frouaix/vitrine/actions/workflows/ci.yml)
[![Deploy to GitHub Pages](https://github.com/frouaix/vitrine/actions/workflows/deploy.yml/badge.svg)](https://github.com/frouaix/vitrine/actions/workflows/deploy.yml)

**Immediate-mode graphics library for TypeScript** — a declarative, block-based DSL for canvas rendering, optimized for productivity applications that need to render tens of thousands of visual elements at 60 FPS.

### 🎨 [Interactive Demo Gallery](https://frouaix.github.io/vitrine/)

Explore 12+ interactive examples including data visualization, productivity apps, particle systems, UI components, and games.

## Features

✅ **Immediate Mode Rendering** — No retained scene graph; the visual hierarchy is re-described each frame  
✅ **Declarative DSL** — Pure function-based API for describing visual hierarchies  
✅ **Rich Primitives** — Rectangle, Circle, Ellipse, Line, Arc, Path, Text, Texta, Image  
✅ **Interactive Events** — Click, hover, drag, tooltips with transform-aware hit testing  
✅ **High Performance** — Frustum culling, optimized for 10k+ blocks at 60 FPS  
✅ **Hierarchical Transforms** — Nested coordinate spaces with full 2D affine matrices  
✅ **Full TypeScript** — Type-safe API with complete type definitions  
✅ **Zero Dependencies** — No runtime dependencies; only TypeScript, Vite, and gh-pages as dev tooling

## Packages

Vitrine is organized as a pnpm workspace monorepo with several publishable packages, plus a private demo package:

| Package | Directory | npm name | Description |
|---------|-----------|----------|-------------|
| Core | `packages/core` | `vitrine` | Block tree, rendering, events, hit-testing, frustum culling — zero GUI dependencies |
| GUI | `packages/gui` | `vitrine-gui` | High-level GUI controls, theming, layout, and `VitrineComponent` |
| Layout & Pagination | `packages/layout-pagination` | `vitrine-layout-pagination` | Renderer-agnostic document layout and pagination contracts |
| Tables | `packages/tables` | `vitrine-tables` | Table layout model and extension contracts |
| Tables Adapter | `packages/tables-vitrine` | `vitrine-tables-adapter` | Vitrine adapter for table rendering |
| Texta | `packages/texta` | `texta` | Attributed text engine for semantic and render transformations |
| Demo | `packages/demo` | *(private)* | Gallery of interactive demos; not published to npm |

**Typical usage**: Use `vitrine` for core rendering. Add `vitrine-gui` for interactive controls (buttons, sliders, calendars, …). The table and texta packages are specialized extensions for complex layouts and rich text.

## Architecture

Vitrine uses an immediate-mode rendering model: every frame, your code builds a tree of lightweight block descriptors using factory functions (`rectangle()`, `circle()`, `group()`, …). The renderer walks that tree, applies hierarchical transforms, and draws to a Canvas 2D context. Because there is no retained scene graph, there is no lifecycle to manage — what you describe is exactly what gets rendered.

Portal blocks allow overlay content (tooltips, dropdown menus) to render above the main scene. An integrated event system performs transform-aware hit testing so pointer events are delivered in block-local coordinates.

> **Note**: A WebGL renderer stub exists but is currently non-functional. Use `ImmediateRenderer` (Canvas 2D) for all rendering.

---

## Installation

### Core package

```bash
npm install vitrine
# or
pnpm add vitrine
```

### GUI controls (optional)

```bash
npm install vitrine vitrine-gui
# or
pnpm add vitrine vitrine-gui
```

```typescript
// Core rendering — shapes, transforms, events
import { ImmediateRenderer, rectangle, circle, group } from 'vitrine';

// GUI controls — buttons, sliders, calendars, themes
import { button, slider, transformGUIControl, getTheme } from 'vitrine-gui';
```

### Local development (co-evolution workflow)

When developing Vitrine alongside a consuming application, use `pnpm link` so that changes to Vitrine are immediately reflected without re-publishing:

```bash
# In the Vitrine repository — build and register the package globally
pnpm build
pnpm link --global

# In the consuming application — link to the local Vitrine build
pnpm link --global vitrine
```

After changing Vitrine source code, run `pnpm build` in the Vitrine repository to update `dist/` and the changes will be visible immediately in the consuming app.

Alternatively, reference the local package directly by path:

```bash
# In the consuming application
pnpm add file:../vitrine
```

---

## Quick Start

```typescript
import { ImmediateRenderer, rectangle, circle, text, group } from 'vitrine';

const renderer = new ImmediateRenderer({ 
  canvas: document.getElementById('canvas'),
  width: 800, 
  height: 600 
});

function render() {
  const scene = group({ x: 0, y: 0 }, [
    rectangle({ 
      x: 100, 
      y: 100, 
      dx: 200, 
      dy: 150, 
      fill: '#ff6b6b',
      cornerRadius: 10,
      onClick: () => console.log('Clicked!')
    }),
    
    circle({ 
      x: 400, 
      y: 175, 
      radius: 75, 
      fill: '#4dabf7',
      onHover: () => console.log('Hovering!')
    }),
    
    group({ x: 400, y: 400, rotation: Math.PI / 4 }, [
      rectangle({ x: -50, y: -50, dx: 100, dy: 100, fill: '#51cf66' })
    ])
  ]);

  renderer.render(scene);
  requestAnimationFrame(render);
}

render();
```

## API Overview

### Block Types

```typescript
// Shapes
rectangle({ x, y, dx, dy, fill, stroke, cornerRadius, ... })
circle({ x, y, radius, fill, stroke, ... })
ellipse({ x, y, radiusX, radiusY, fill, stroke, ... })
line({ x1, y1, x2, y2, stroke, strokeWidth, ... })
arc({ x, y, radius, startAngle, endAngle, fill, stroke, ... })
path({ x, y, pathData, fill, stroke, ... })

// Content
text({ x, y, text, fontSize, font, fill, align, ... })
texta({ x, y, texta, align, baseline, fill, ... })
image({ x, y, src, dx, dy, ... })

// Containers
group({ x, y, rotation, scaleX, scaleY, opacity, ... }, children)
link({ href, ... }, children)  // opens URL in new tab on click
```

### Transforms

All blocks support:
- **Position**: `x`, `y`
- **Rotation**: `rotation` (radians)
- **Scale**: `scaleX`, `scaleY`
- **Skew**: `skewX`, `skewY`
- **Opacity**: `opacity` (0-1)

### Events

All blocks support event handlers:
- `onClick` — Click event
- `onPointerDown` / `onPointerUp` — Pointer press/release
- `onPointerMove` — Pointer movement
- `onHover` — Hover state change
- `onDrag` — Drag interaction
- `tooltip` — Function returning a string or block tree, displayed on hover

### Performance

#### Frustum Culling

```typescript
const renderer = new ImmediateRenderer({
  enableCulling: true  // Frustum culling (default: true)
});

// Get performance stats
const stats = renderer.getPerformanceStats();
console.log(stats.fps, stats.blocksRendered, stats.blocksCulled);
```

#### Render Scheduling (VitrineComponent)

`VitrineComponent` supports configurable render scheduling to reduce idle CPU usage:

```typescript
import { VitrineComponent } from 'vitrine-gui';

// Continuous rendering (default, backward-compatible)
const c1 = VitrineComponent.gui(() => /* ... */, {
  renderMode: 'continuous'  // Always run RAF (typical for animated scenes)
});

// On-demand rendering (update only when state changes)
const c2 = VitrineComponent.gui(() => /* ... */, {
  renderMode: 'onDemand'  // Render only when invalidated
});

// Auto mode (continuous by default; explicit control if needed)
const c3 = VitrineComponent.gui(() => /* ... */, {
  renderMode: 'auto'  // Starts continuous; with beginAnimation()/endAnimation(), RAF stops when idle
});

// Explicit animation lifecycle (for power users)
c3.beginAnimation();
// ...update animation state...
c3.endAnimation();  // Stops RAF when animation count reaches zero

// Manual invalidation for state changes
c3.invalidate();
```

See [docs/BLOCK_DSL.md § 9.4](docs/BLOCK_DSL.md#94-render-modes) for render mode details.

## Examples

Try the live demos on GitHub Pages:
- **[Gallery](https://frouaix.github.io/vitrine/gallery.html)** — 12+ interactive demos
- **[Calendar](https://frouaix.github.io/vitrine/calendar.html)** — Month and day calendar views
- **[Camera Controls](https://frouaix.github.io/vitrine/camera-controls.html)** — Pan and zoom
- **[Basic](https://frouaix.github.io/vitrine/basic.html)** — Core blocks, transforms, and SVG image rendering
- **[Events](https://frouaix.github.io/vitrine/events.html)** — Click, hover, drag
- **[Texta](https://frouaix.github.io/vitrine/texta.html)** — Attributed text rendering examples
- **[Performance](https://frouaix.github.io/vitrine/performance.html)** — 10k+ blocks stress test

Or run locally with `pnpm dev` (opens the gallery at localhost:8080).

---

## Development

```bash
pnpm install         # Install dependencies
pnpm dev             # Start dev server with gallery
pnpm build           # Compile TypeScript library
pnpm lint            # Run type checks (tsc --noEmit)
pnpm build:examples  # Build examples for production
pnpm deploy          # Deploy demo gallery to GitHub Pages
pnpm clean           # Remove build artifacts
```

## Documentation

| Document | Description |
|----------|-------------|
| [docs/BLOCK_DSL.md](docs/BLOCK_DSL.md) | Core block language: all block types, transform hierarchy, event system, and event bubbling |
| [docs/GUI_CONTROLS.md](docs/GUI_CONTROLS.md) | GUI controls reference: interactive controls, layout, themes, and rendering lifecycle |
| [docs/COORDINATES.md](docs/COORDINATES.md) | Coordinate spaces, Hungarian notation, camera transform, and `VitrinePointerEvent` |
| [docs/GUI_NEW_CONTROLS.md](docs/GUI_NEW_CONTROLS.md) | Architecture guide for adding new complex GUI controls |

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) for workflow, validation, and branch policy, and [.github/copilot-instructions.md](.github/copilot-instructions.md) for coding conventions.

## License

[MIT](LICENSE.md)
