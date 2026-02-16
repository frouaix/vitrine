# Vitrine

[![CI](https://github.com/frouaix/vitrine/actions/workflows/ci.yml/badge.svg)](https://github.com/frouaix/vitrine/actions/workflows/ci.yml)
[![Deploy to GitHub Pages](https://github.com/frouaix/vitrine/actions/workflows/deploy.yml/badge.svg)](https://github.com/frouaix/vitrine/actions/workflows/deploy.yml)

**Immediate-mode graphics library for TypeScript** with declarative block-based DSL, optimized for rendering tens of thousands of visual elements in productivity applications.

## 🎨 [Interactive Demo Gallery](https://frouaix.github.io/vitrine/)

Explore 12 interactive examples including data visualization, productivity apps, particle systems, UI components, and games.

## Features

✅ **Immediate Mode Rendering** - No retained scene graph, full control every frame  
✅ **Declarative DSL** - Function-based API for describing visual hierarchies  
✅ **Rich Primitives** - Rectangle, Circle, Ellipse, Line, Arc, Path, Text, Image  
✅ **Interactive Events** - Click, hover, drag with transform-aware hit testing  
✅ **High Performance** - Frustum culling, optimized for 10k+ blocks at 60 FPS  
✅ **Hierarchical Transforms** - Relative coordinates with 2D matrix transforms  
✅ **Full TypeScript** - Type-safe API with complete type definitions

> **Note**: The WebGL renderer is currently non-functional. Use `ImmediateRenderer` (Canvas 2D) for all rendering.

## Naming Conventions

This project uses Hungarian-style naming for geometry and style fields. See [.github/hungarian-notation.md](.github/hungarian-notation.md) for details.

## Import Conventions

- Use explicit `.ts` extensions for all relative TypeScript imports and exports (for example `./foo.ts`, `../bar.ts`).
- Keep package imports extensionless (for example `vitrine`, `react`).

## Installation

```bash
pnpm install
```

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

## Examples

Run `pnpm dev` to explore the [demo gallery](examples/gallery.html) with 12 interactive examples, or try individual demos:
- **[basic.html](examples/basic.html)** - Basic shapes and hierarchy
- **[events.html](examples/events.html)** - Interactive events (click, hover, drag)
- **[primitives.html](examples/primitives.html)** - All primitive types
- **[performance.html](examples/performance.html)** - 10k+ blocks performance test

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
image({ x, y, src, dx, dy, ... })

// Containers
group({ x, y, rotation, scaleX, scaleY, opacity, ... }, children)
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
- `onClick` - Click event
- `onPointerDown` / `onPointerUp` - Pointer press/release
- `onPointerMove` - Pointer movement
- `onHover` - Hover state
- `onDrag` - Drag interaction

### Performance

```typescript
const renderer = new ImmediateRenderer({
  enableCulling: true  // Frustum culling (default: true)
});

// Get performance stats
const stats = renderer.getPerformanceStats();
console.log(stats.fps, stats.blocksRendered, stats.blocksCulled);
```

## Development

```bash
pnpm install         # Install dependencies
pnpm dev             # Start dev server with gallery
pnpm build           # Compile TypeScript library
pnpm build:examples  # Build examples for production
pnpm deploy          # Deploy to GitHub Pages
pnpm clean           # Remove build artifacts
```

## Deployment

The demo gallery is automatically deployed to GitHub Pages at [https://frouaix.github.io/vitrine/](https://frouaix.github.io/vitrine/)

This section was touched in a trivial docs-only change to validate the deployment path after push.

To deploy manually:
```bash
pnpm run deploy
```

This builds the examples with Vite and pushes to the `gh-pages` branch.

### Branch Protection

The `main` branch should be protected with the following rules:
- ✅ **Required CI checks**: `test / Build Library and Examples`, `lint / Type Check`
- 🚫 **Force pushes blocked**
- 🚫 **Branch deletion blocked**
- 🔀 **Pull request required before merge**

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch naming and PR workflow.

## Architecture

Vitrine uses an immediate-mode rendering model where the visual hierarchy is re-described each frame. This provides:

- **Simplicity** - No complex state management or lifecycle
- **Flexibility** - Easy integration with any state management (React, Vue, etc.)
- **Performance** - Optimized rendering pipeline with culling
- **Predictability** - What you describe is what you get

## Contributing

Contributions are welcome.

- See [CONTRIBUTING.md](CONTRIBUTING.md) for workflow, validation, and branch policy
- See [.github/copilot-instructions.md](.github/copilot-instructions.md) for coding conventions

## License

[MIT](LICENSE.md)
