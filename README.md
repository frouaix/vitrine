# Vitrine

**Immediate-mode graphics library for TypeScript** with declarative block-based DSL, optimized for rendering tens of thousands of visual elements in productivity applications.

## 🎨 [Interactive Demo Gallery](examples/gallery.html)

**[View Live Demos](examples/gallery.html)** - 12 interactive examples showcasing:
- 📊 Data Visualization (charts, gauges, scatter plots)
- 📋 Productivity Apps (kanban, mind maps)
- 🎨 Creative Graphics (particles, patterns, animations)
- 🎮 Interactive Games (snake)

## Features

✅ **Immediate Mode Rendering** - No retained scene graph, full control every frame  
✅ **Declarative DSL** - Function-based API for describing visual hierarchies  
✅ **Rich Primitives** - Rectangle, Circle, Ellipse, Line, Arc, Path, Text, Image  
✅ **Interactive Events** - Click, hover, drag with transform-aware hit testing  
✅ **High Performance** - Frustum culling, optimized for 10k+ blocks at 60 FPS  
✅ **Hierarchical Transforms** - Relative coordinates with 2D matrix transforms  
✅ **Full TypeScript** - Type-safe API with complete type definitions

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
      width: 200, 
      height: 150, 
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
      rectangle({ x: -50, y: -50, width: 100, height: 100, fill: '#51cf66' })
    ])
  ]);

  renderer.render(scene);
  requestAnimationFrame(render);
}

render();
```

## Examples

**[🎨 Interactive Demo Gallery](examples/gallery.html)** - Comprehensive showcase with 12 diverse demos

Individual examples:
- **[basic.html](examples/basic.html)** - Basic shapes and hierarchy
- **[events.html](examples/events.html)** - Interactive events (click, hover, drag)
- **[primitives.html](examples/primitives.html)** - All primitive types
- **[performance.html](examples/performance.html)** - 10k+ blocks performance test

Demo categories:
- **Data Visualization**: Bar charts, line charts, pie charts, scatter plots, gauges
- **Productivity**: Kanban boards, mind maps with node connections
- **Creative**: Particle systems (2k particles), geometric patterns, analog clock
- **UI Components**: HSV color picker with sliders
- **Games**: Snake game with keyboard controls

## API Overview

### Block Types

```typescript
// Shapes
rectangle({ x, y, width, height, fill, stroke, cornerRadius, ... })
circle({ x, y, radius, fill, stroke, ... })
ellipse({ x, y, radiusX, radiusY, fill, stroke, ... })
line({ x1, y1, x2, y2, stroke, strokeWidth, ... })
arc({ x, y, radius, startAngle, endAngle, fill, stroke, ... })
path({ x, y, pathData, fill, stroke, ... })

// Content
text({ x, y, text, fontSize, font, fill, align, ... })
image({ x, y, src, width, height, ... })

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

## Build

```bash
pnpm build      # Compile TypeScript
pnpm dev        # Watch mode
pnpm clean      # Remove build artifacts
```

## Architecture

Vitrine uses an immediate-mode rendering model where the visual hierarchy is re-described each frame. This provides:

- **Simplicity** - No complex state management or lifecycle
- **Flexibility** - Easy integration with any state management (React, Vue, etc.)
- **Performance** - Optimized rendering pipeline with culling
- **Predictability** - What you describe is what you get

## License

MIT
