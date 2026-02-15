# Core Module

This directory contains the core DSL (Domain-Specific Language) and rendering engine for Vitrine.

## Overview

The core module provides:
- **Type system** - Type definitions for all visual blocks and their properties
- **DSL** - Factory functions for creating block descriptors declaratively
- **Rendering** - Immediate-mode rendering engine with Canvas 2D support
- **Context** - Rendering context abstraction for different rendering backends

## Files

### `types.ts`
Defines the core type system:
- `Block` - The fundamental unit representing a visual element
- `BlockType` - Enumeration of all available block types (Rectangle, Circle, Text, etc.)
- `BaseBlockProps` - Common properties for all blocks (transforms, events, opacity, etc.)
- Specific props interfaces for each block type (RectangleProps, CircleProps, etc.)

```typescript
interface Block {
  type: BlockType;
  props: BaseBlockProps;
  children?: Block[];
}
```

### `blocks.ts`
Factory functions for creating block descriptors:
- `rectangle()` - Creates rectangle blocks
- `circle()` - Creates circle blocks
- `ellipse()` - Creates ellipse blocks
- `line()` - Creates line blocks
- `text()` - Creates text blocks
- `path()` - Creates path blocks (SVG-like)
- `arc()` - Creates arc blocks
- `image()` - Creates image blocks
- `group()` - Creates container groups with transforms
- `layer()` - Creates layers with blend modes

These functions provide the declarative API for describing visual hierarchies.

```typescript
const scene = group({ x: 100, y: 100 }, [
  rectangle({ dx: 50, dy: 50, fill: 'red' }),
  circle({ x: 60, y: 0, radius: 25, fill: 'blue' })
]);
```

### `renderer-immediate.ts`
The main immediate-mode rendering engine:
- `ImmediateRenderer` - Core renderer class that processes block trees and renders them to canvas
- Handles the render loop, transform management, and coordinate transformations
- Integrates with event system and performance optimizations
- Supports culling, event handling, and performance monitoring

```typescript
const renderer = new ImmediateRenderer({ 
  canvas, 
  width: 800, 
  height: 600,
  enableCulling: true 
});

function render() {
  renderer.render(scene);
  requestAnimationFrame(render);
}
```

### `context.ts`
Rendering context abstraction:
- `RenderContext` - Interface for rendering backends
- `Canvas2DContext` - Canvas 2D implementation
- Manages transform stack, opacity, and drawing primitives
- Provides a unified API for different rendering backends

### `renderer.ts`
Legacy renderer classes (maintained for backwards compatibility):
- `Renderer` - Abstract base class
- `Canvas2DRenderer` - Legacy Canvas 2D renderer
- `RendererType` - Enumeration of renderer types

## Design Principles

### Immediate Mode Rendering
The core uses an immediate-mode rendering model where the visual hierarchy is completely re-described each frame. This provides:
- **Simplicity** - No complex state management or lifecycle
- **Flexibility** - Easy integration with any state management library
- **Predictability** - What you describe is exactly what gets rendered

### Block-Based DSL
The declarative block-based DSL separates visual description from rendering:
- Blocks are plain data structures (no classes or methods)
- Factory functions provide a clean, functional API
- Easy to serialize, transform, and compose
- Type-safe with full TypeScript support

### Hierarchical Structure
Blocks form a tree structure:
- Parent blocks can contain children via `group()` and `layer()`
- Transforms (position, rotation, scale) are inherited down the hierarchy
- Events bubble up from children to parents

## Usage Example

```typescript
import { ImmediateRenderer, group, rectangle, circle, text } from 'vitrine';

const renderer = new ImmediateRenderer({ canvas });

function render() {
  const scene = group({ x: 0, y: 0 }, [
    // A red rectangle
    rectangle({ 
      x: 50, 
      y: 50, 
      width: 100, 
      height: 100, 
      fill: '#ff0000',
      onClick: () => console.log('clicked!')
    }),
    
    // A rotated group with a blue circle
    group({ x: 200, y: 200, rotation: Math.PI / 4 }, [
      circle({ radius: 40, fill: '#0000ff' }),
      text({ x: 0, y: 60, text: 'Hello!', fontSize: 16 })
    ])
  ]);
  
  renderer.render(scene);
  requestAnimationFrame(render);
}

render();
```

## Integration Points

The core module integrates with:
- **Transform system** (`../transform.ts`) - Matrix math and transform stacks
- **Event system** (`../events.ts`) - User interaction handling
- **Performance** (`../performance.ts`) - Culling and optimization
- **Hit testing** (`../hit-test.ts`) - Pointer event detection

These supporting modules remain in the parent `src/` directory to separate concerns.
