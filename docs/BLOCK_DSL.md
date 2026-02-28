# Core Block Language Reference

This document describes the core block-based DSL used to describe visual hierarchies in Vitrine. It covers all block types, their properties, the transform system, the event system (including event bubbling), portals, tooltips, and performance controls.

---

## 1. Overview

Vitrine uses an **immediate-mode rendering** model. Every frame, your code calls factory functions to build a tree of lightweight *block descriptors*. The renderer then walks that tree, applies hierarchical transforms, and draws to a Canvas 2D context. There is no retained scene graph: what you describe each frame is exactly what is drawn.

```typescript
import { ImmediateRenderer, group, rectangle, circle, text } from 'vitrine';

const renderer = new ImmediateRenderer({ canvas, width: 800, height: 600 });

function render(): void {
  renderer.render(
    group({}, [
      rectangle({ x: 50, y: 50, dx: 200, dy: 100, fill: '#3498db' }),
      circle({ x: 350, y: 100, radius: 50, fill: '#e74c3c' }),
      text({ x: 50, y: 200, text: 'Hello Vitrine', fontSize: 24, fill: '#111' })
    ])
  );
  requestAnimationFrame(render);
}

render();
```

---

## 2. Common Base Properties

All block types extend `BaseBlockProps`, which provides the following optional fields:

| Property | Type | Description |
|----------|------|-------------|
| `x` | `number` | X position in the parent's local coordinate space |
| `y` | `number` | Y position in the parent's local coordinate space |
| `rotation` | `number` | Rotation angle in **radians**, applied around `(x, y)` |
| `scaleX` | `number` | Horizontal scale factor (default `1`) |
| `scaleY` | `number` | Vertical scale factor (default `1`) |
| `skewX` | `number` | Horizontal skew (tangent units) |
| `skewY` | `number` | Vertical skew (tangent units) |
| `opacity` | `number` | Opacity in the range `0`–`1` (default `1`) |
| `visible` | `boolean` | When `false`, the block and its children are skipped entirely |
| `disableCulling` | `boolean` | When `true`, the block is never culled by the frustum optimizer |
| `shadow` | `ShadowProps` | Drop shadow (`{ offsetX, offsetY, blur, color }`) |
| `filter` | `string` | CSS filter string applied to the block and its children (e.g. `'blur(4px)'`, `'grayscale(1)'`, `'brightness(1.5) contrast(2)'`) — see [§10.5](#105-css-filter) |
| `id` | `string` | Optional identifier (not used by the renderer, but useful for debugging) |
| `tooltip` | `() => string \| Block` | Tooltip factory — see [§7 Tooltips](#7-tooltips) |
| `onClick` | `(event: VitrinePointerEvent) => void` | Click handler |
| `onPointerDown` | `(event: VitrinePointerEvent) => void` | Pointer press handler |
| `onPointerUp` | `(event: VitrinePointerEvent) => void` | Pointer release handler |
| `onPointerMove` | `(event: VitrinePointerEvent) => void` | Pointer move handler |
| `onHover` | `(event: VitrinePointerEvent) => void` | Hover state change handler |
| `onDrag` | `(event: VitrinePointerEvent) => void` | Drag handler |

---

## 3. Block Types

### 3.0 Fill and stroke properties

All block types that support colour accept `FillStyle` for both `fill` and `stroke`. A `FillStyle` is one of:

| Value | Description |
|-------|-------------|
| `string` | CSS colour string: `'#3498db'`, `'rgba(255,0,0,0.5)'`, `'hsl(200, 80%, 60%)'`, etc. |
| `LinearGradientDescriptor` | Linear gradient — created with `linearGradient()` |
| `RadialGradientDescriptor` | Radial gradient — created with `radialGradient()` |
| `ConicGradientDescriptor` | Conic gradient — created with `conicGradient()` |
| `PatternDescriptor` | Tiled image/canvas pattern — created with `pattern()` |

See [§10 Gradients & Patterns](#10-gradients--patterns) for the factory functions.

All blocks with a `stroke` prop also inherit the following line-style properties from `StrokeProps`:

| Property | Type | Description |
|----------|------|-------------|
| `strokeWidth` | `number` | Stroke width in logical units (default `1`) |
| `lineCap` | `'butt' \| 'round' \| 'square'` | Line end cap style (default `'butt'`) |
| `lineJoin` | `'bevel' \| 'round' \| 'miter'` | Line corner join style (default `'miter'`) |
| `lineDash` | `number[]` | Dash pattern — alternating dash and gap lengths, e.g. `[10, 5]` |
| `lineDashOffset` | `number` | Phase offset for the dash pattern (animate this to march ants) |

```typescript
// Dashed animated border
rectangle({
  x: 10, y: 10, dx: 200, dy: 80,
  stroke: '#3498db', strokeWidth: 2,
  lineDash: [12, 6], lineDashOffset: dashPhase,  // dashPhase incremented each frame
  lineJoin: 'round', cornerRadius: 8
})
```

---

### 3.1 `rectangle`

A filled or stroked axis-aligned rectangle.

```typescript
rectangle(props: RectangleProps, children?: Block[]): Block
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `dx` | `number` | ✅ | Width |
| `dy` | `number` | ✅ | Height |
| `fill` | `FillStyle` | | Fill (colour, gradient, or pattern) |
| `stroke` | `FillStyle` | | Stroke (colour, gradient, or pattern) |
| `strokeWidth` | `number` | | Stroke width in logical units |
| `lineCap` | `LineCap` | | Line end cap (`'butt'`, `'round'`, `'square'`) |
| `lineJoin` | `LineJoin` | | Line join (`'miter'`, `'round'`, `'bevel'`) |
| `lineDash` | `number[]` | | Dash pattern, e.g. `[8, 4]` |
| `lineDashOffset` | `number` | | Dash phase offset |
| `cornerRadius` | `number` | | Rounded corner radius |

```typescript
rectangle({ x: 10, y: 10, dx: 120, dy: 60, fill: '#3498db', cornerRadius: 8 })
```

---

### 3.2 `circle`

A circle centred at `(x, y)`.

```typescript
circle(props: CircleProps, children?: Block[]): Block
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `radius` | `number` | ✅ | Radius in logical units |
| `fill` | `FillStyle` | | Fill (colour, gradient, or pattern) |
| `stroke` | `FillStyle` | | Stroke |
| `strokeWidth` | `number` | | Stroke width |
| `lineCap` | `LineCap` | | Line end cap |
| `lineJoin` | `LineJoin` | | Line join |
| `lineDash` | `number[]` | | Dash pattern |
| `lineDashOffset` | `number` | | Dash phase offset |

```typescript
circle({ x: 200, y: 150, radius: 40, fill: '#e74c3c' })
```

---

### 3.3 `ellipse`

An ellipse centred at `(x, y)` with independent horizontal and vertical radii.

```typescript
ellipse(props: EllipseProps, children?: Block[]): Block
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `radiusX` | `number` | ✅ | Horizontal radius |
| `radiusY` | `number` | ✅ | Vertical radius |
| `fill` | `FillStyle` | | Fill (colour, gradient, or pattern) |
| `stroke` | `FillStyle` | | Stroke |
| `strokeWidth` | `number` | | Stroke width |
| `lineCap` | `LineCap` | | Line end cap |
| `lineJoin` | `LineJoin` | | Line join |
| `lineDash` | `number[]` | | Dash pattern |
| `lineDashOffset` | `number` | | Dash phase offset |

---

### 3.4 `line`

A straight line segment.

```typescript
line(props: LineProps, children?: Block[]): Block
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `x1` | `number` | ✅ | Start X |
| `y1` | `number` | ✅ | Start Y |
| `x2` | `number` | ✅ | End X |
| `y2` | `number` | ✅ | End Y |
| `stroke` | `FillStyle` | ✅ | Stroke (colour, gradient, or pattern) |
| `strokeWidth` | `number` | | Stroke width |
| `lineCap` | `LineCap` | | Line end cap (`'butt'`, `'round'`, `'square'`) |
| `lineDash` | `number[]` | | Dash pattern |
| `lineDashOffset` | `number` | | Dash phase offset |

> **Note**: `x1/y1` and `x2/y2` are in the block's local coordinate space. The `x/y` transform props on the block itself shift the entire line.

---

### 3.5 `arc`

A circular arc segment centred at `(x, y)`.

```typescript
arc(props: ArcProps, children?: Block[]): Block
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `radius` | `number` | ✅ | Radius |
| `startAngle` | `number` | ✅ | Start angle in radians |
| `endAngle` | `number` | ✅ | End angle in radians |
| `fill` | `FillStyle` | | Fill (fills the arc segment to the centre) |
| `stroke` | `FillStyle` | | Stroke |
| `strokeWidth` | `number` | | Stroke width |
| `lineCap` | `LineCap` | | Line end cap |
| `lineDash` | `number[]` | | Dash pattern |
| `lineDashOffset` | `number` | | Dash phase offset |
| `fillRule` | `'nonzero' \| 'evenodd'` | | Fill rule for the closed arc shape (default `'nonzero'`) |

---

### 3.6 `path`

A freeform shape described with an SVG path string.

```typescript
path(props: PathProps, children?: Block[]): Block
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `pathData` | `string` | ✅ | SVG path commands (`M`, `L`, `C`, `Z`, …) |
| `closed` | `boolean` | | Auto-close the path |
| `fill` | `FillStyle` | | Fill (colour, gradient, or pattern) |
| `stroke` | `FillStyle` | | Stroke |
| `strokeWidth` | `number` | | Stroke width |
| `lineCap` | `LineCap` | | Line end cap |
| `lineJoin` | `LineJoin` | | Line join |
| `lineDash` | `number[]` | | Dash pattern |
| `lineDashOffset` | `number` | | Dash phase offset |
| `fillRule` | `'nonzero' \| 'evenodd'` | | Fill rule (default `'nonzero'`). Use `'evenodd'` to punch holes in overlapping sub-paths |

```typescript
path({ x: 0, y: 0, pathData: 'M 0 0 L 100 0 L 50 80 Z', fill: '#9b59b6' })
```

---

### 3.7 `text`

Text rendered on the canvas.

```typescript
text(props: TextProps, children?: Block[]): Block
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `text` | `string` | ✅ | The text to render |
| `fontSize` | `number` | | Font size in logical units |
| `font` | `string` | | Full CSS font string (overrides `fontSize`) |
| `fill` | `FillStyle` | | Text fill (colour, gradient, or pattern) |
| `stroke` | `FillStyle` | | Text stroke |
| `strokeWidth` | `number` | | Text stroke width |
| `align` | `'left' \| 'center' \| 'right' \| 'start' \| 'end'` | | Horizontal alignment |
| `baseline` | `'top' \| 'middle' \| 'bottom' \| 'alphabetic' \| 'hanging'` | | Vertical baseline |

```typescript
text({ x: 10, y: 30, text: 'Score: 42', fontSize: 20, fill: '#fff', baseline: 'top' })
```

---

### 3.8 `image`

A raster image drawn to the canvas.

```typescript
image(props: ImageProps, children?: Block[]): Block
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `src` | `string \| HTMLImageElement` | ✅ | URL or pre-loaded `HTMLImageElement` |
| `dx` | `number` | ✅ | Width |
| `dy` | `number` | ✅ | Height |
| `sx` | `number` | | Source crop X (must be provided together with `sy`, `sw`, `sh`) |
| `sy` | `number` | | Source crop Y |
| `sw` | `number` | | Source crop width |
| `sh` | `number` | | Source crop height |

When `sx`/`sy`/`sw`/`sh` are all provided the renderer calls the nine-argument form of `drawImage`, cropping the source before scaling to the destination rectangle. This enables sprite-sheet rendering.

```typescript
// Draw tile at column 2, row 1 of a 50×50 sprite sheet
image({
  x: 100, y: 100, dx: 64, dy: 64,
  src: spriteSheet,
  sx: 2 * 50, sy: 1 * 50, sw: 50, sh: 50
})
```

Pre-loading the image via `HTMLImageElement` is recommended for smooth animation (avoids a frame of blank while the image loads).

---

### 3.9 `group`

An invisible container that establishes a new local coordinate space for its children. Use `group` to compose transforms (position, rotation, scale) that apply to a subtree.

```typescript
group(props: GroupProps, children: Block[]): Block
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `clip` | `boolean` | | When `true`, clips children to the bounding rectangle defined by `dx × dy` (requires the group to also have `dx`/`dy` via `BaseBlockProps`) |

```typescript
group({ x: 200, y: 100, rotation: Math.PI / 6 }, [
  rectangle({ dx: 80, dy: 40, fill: '#27ae60' }),
  circle({ x: 100, radius: 20, fill: '#e67e22' })
])
```

---

### 3.10 `layer`

A compositing layer. Internally the renderer renders the layer's children into an off-screen buffer and then composites that buffer with the specified blend mode.

```typescript
layer(props: LayerProps, children: Block[]): Block
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `blendMode` | `BlendMode` | | CSS blend mode: `'normal'`, `'multiply'`, `'screen'`, `'overlay'`, `'darken'`, `'lighten'` |
| `cache` | `boolean` | | Cache the layer contents and skip re-rendering when unchanged |

---

### 3.11 `portal`

Renders its children in the **overlay layer**, above all normal scene content. Used for tooltips, dropdown menus, and any content that must appear on top of everything else regardless of its position in the tree.

```typescript
portal(props: PortalProps, children: Block[]): Block
```

`PortalProps` only inherits from `BaseBlockProps` — there are no portal-specific properties.

```typescript
group({}, [
  rectangle({ x: 100, y: 100, dx: 200, dy: 50, fill: '#2c3e50' }),
  portal({}, [
    // This text renders above ALL other blocks, including sibling rectangles
    // drawn after this portal in the same group.
    text({ x: 110, y: 115, text: 'Overlay', fill: '#fff', fontSize: 16 })
  ])
])
```

> **Hit testing**: portals are tested for pointer events *before* the main scene, in reverse declaration order (last portal declared = topmost).

### 3.12 `link`

Convenience factory that wraps children in a clickable group. Clicking opens `href` in a new tab via `window.open()`. The visual content can be any blocks — text, images, shapes, or composites.

```typescript
link(props: LinkProps & GroupProps, children: Block[]): Block
```

| Prop | Type | Description |
|------|------|-------------|
| `href` | `string` | **Required.** URL to open on click. |

All `BaseBlockProps` (transforms, opacity, events) are also available.

```typescript
// Simple text link
link({ href: 'https://github.com' }, [
  text({ text: 'Visit GitHub', fontSize: 14, fill: '#228be6' })
])

// Image link
link({ href: 'https://example.com', x: 100, y: 50 }, [
  image({ src: myImage, dx: 120, dy: 80 })
])

// Card-style link with shapes and text
link({ href: 'https://example.com', x: 200, y: 100 }, [
  rectangle({ dx: 200, dy: 60, fill: '#228be6', cornerRadius: 8 }),
  text({ x: 100, y: 30, text: 'Click me', fill: '#fff', align: 'center', baseline: 'middle' })
])
```

> **Note**: `link()` returns a `Group` block — no new block type is introduced. An additional `onClick` handler can be provided and will be called after the URL is opened.

---

## 4. Transform Hierarchy

Transforms are **hierarchical**: a child block's transform is applied on top of all its ancestor transforms.

### 4.1 Transform composition order

For each block, the local matrix is composed as:

```
blockMatrix = Identity
  .translate(x, y)          // 1. position
  .rotate(rotation)          // 2. rotate
  .scaleXY(scaleX, scaleY)  // 3. scale
  .skewXY(skewX, skewY)     // 4. skew
```

The **world matrix** for a block is the cumulative product:

```
worldMatrix = rootMatrix × parentMatrix₁ × parentMatrix₂ × … × blockMatrix
```

### 4.2 Coordinate spaces

See [COORDINATES.md](COORDINATES.md) for a detailed breakdown of coordinate spaces (window, canvas buffer, logical, scene, block-local), how they are computed, and when to use each in event handlers.

### 4.3 Camera

The camera is a regular `group` block returned by `renderer.camera(children)`. It applies a translate-then-scale transform so the scene can be panned and zoomed. See [COORDINATES.md § 4](COORDINATES.md) for details.

---

## 5. Event System

### 5.1 Overview

The `EventManager` intercepts `pointerdown`, `pointerup`, `pointermove`, `click`, and `pointerleave` events on the canvas and translates them into calls to block event handlers.

All event handlers receive a `VitrinePointerEvent`, which extends the browser's `PointerEvent` with Vitrine-specific coordinate fields:

| Field | Type | Description |
|-------|------|-------------|
| `xl` | `number` | Block-local X (all transforms inverted) |
| `yl` | `number` | Block-local Y (all transforms inverted) |
| `xs` | `number` | Scene X (camera inverse applied; this is a world-stable position that is not affected by individual block transforms) |
| `ys` | `number` | Scene Y (camera inverse applied; this is a world-stable position that is not affected by individual block transforms) |

Use `xl`/`yl` for intra-block queries (e.g. *where inside this button was clicked*). Use `xs`/`ys` for world-stable operations (e.g. *drag-to-move an object*).

### 5.2 Event bubbling

Vitrine implements **manual upward bubbling**: when a pointer event hits a block, the event system walks from the hit block up through its ancestors and dispatches the event to the **nearest block that has a handler for that event type**.

This means:
- You do **not** need to add handlers to every block — a parent can catch events from any descendant.
- Only the nearest ancestor with a matching handler receives the event; the search stops there.
- Bubbling applies independently for each event type. A `click` handler on a parent does not suppress a separate `onDrag` handler on a different ancestor.

```typescript
// The outer group has an onClick handler.
// Clicking anywhere inside the inner rectangle triggers the group's onClick,
// because the rectangle has no handler of its own.
group({
  x: 50, y: 50,
  onClick: () => console.log('group clicked')
}, [
  rectangle({ dx: 100, dy: 100, fill: '#3498db' }),  // no onClick here
  circle({ x: 110, radius: 20, fill: '#e74c3c' })    // no onClick here
])
```

The bubbling algorithm for each pointer event type:

1. Hit-test the scene at the pointer position → produces a `HitTestResult` containing the **hit block** and its ordered list of **ancestor blocks** (leaf-to-root).
2. Check the hit block for a handler with the matching key (e.g. `onClick`).
3. If not found, check ancestors from the innermost to the outermost.
4. Dispatch to the first block found, then stop.

### 5.3 Hover

`onHover` fires when the pointer enters a block's hit area (when the hovered block changes). It is subject to the same bubbling rules: the nearest ancestor with `onHover` handles the event.

When the pointer enters a block that (or whose ancestor) has `onClick`, `onDrag`, or `onHover`, the canvas cursor is automatically set to `pointer`. It resets to `default` when moving over non-interactive blocks.

### 5.4 Drag

Drag is initiated by `onDrag`. When `pointerdown` hits a block (or ancestor) with an `onDrag` handler, that block is marked as the *dragged block*. Subsequent `pointermove` events call the dragged block's `onDrag` directly, even if the pointer has moved outside the block's bounds. Drag ends on `pointerup` or `pointerleave`.

During a drag, `event.xs` and `event.ys` always reflect the current pointer position in scene coordinates — ideal for computing drag deltas.

```typescript
let blockX = 100;
let blockY = 100;
let dragStartXs = 0;
let dragStartYs = 0;
let origX = 0;
let origY = 0;

rectangle({
  x: blockX, y: blockY, dx: 80, dy: 40, fill: '#3498db',
  onPointerDown: (e: VitrinePointerEvent) => {
    dragStartXs = e.xs!;
    dragStartYs = e.ys!;
    origX = blockX;
    origY = blockY;
  },
  onDrag: (e: VitrinePointerEvent) => {
    blockX = origX + (e.xs! - dragStartXs);
    blockY = origY + (e.ys! - dragStartYs);
  }
})
```

### 5.5 Portal hit testing

Portal blocks are hit-tested **before** the main scene, in reverse declaration order (the last-declared portal has the highest z-order and is checked first). Once a portal captures an event, the main scene is not tested.

### 5.6 Compound objects and the sibling trap

A common mistake when building compound objects (e.g. a custom button made of a background rectangle and a label) is placing the visual parts as **siblings** and attaching the event handler to only one of them:

```typescript
// ❌ WRONG — sibling trap
// Clicking the text label hits the text block first.
// Bubbling walks text → group (skipping the rectangle, which is a sibling, not an ancestor).
// The rectangle's onClick is never reached.
group({ x: 100, y: 100 }, [
  rectangle({ dx: 120, dy: 40, fill: '#3498db', onClick: handleClick }),
  text({ x: 20, y: 24, text: 'Click me', fill: '#fff' })
])
```

Because bubbling only travels **up the ancestor chain**, events that hit a sibling block never reach handlers on another sibling. The two correct refactors are:

**Option A — put the handler on the wrapping group** (preferred when two or more shapes share the same hit area):

```typescript
// ✅ CORRECT — handler on the parent group
// Clicking anywhere inside the group (rectangle or text) bubbles to the group's onClick.
group({ x: 100, y: 100, onClick: handleClick }, [
  rectangle({ dx: 120, dy: 40, fill: '#3498db' }),
  text({ x: 20, y: 24, text: 'Click me', fill: '#fff' })
])
```

**Option B — nest the content inside the interactive block** (preferred when one block is the logical container):

```typescript
// ✅ CORRECT — text is a child of the clickable rectangle
// Clicking the text bubbles up: text → rectangle (handler found, stops here).
rectangle({ x: 100, y: 100, dx: 120, dy: 40, fill: '#3498db', onClick: handleClick }, [
  text({ x: 20, y: 24, text: 'Click me', fill: '#fff' })
])
```

**Rule of thumb**: for any compound block where multiple visual elements should respond to the same event, either (a) place the handler on their nearest common ancestor, or (b) make the interactive-area block the structural parent of the decorative content blocks.

---

## 6. `ImmediateRenderer`

### 6.1 `RendererConfig`

All configuration options are optional.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `canvas` | `HTMLCanvasElement` | new canvas element | Canvas to render into. If omitted, a new `<canvas>` is created and accessible via `getCanvas()`. |
| `width` | `number` | `800` | Logical canvas width in CSS pixels |
| `height` | `number` | `600` | Logical canvas height in CSS pixels |
| `pixelRatio` | `number` | `window.devicePixelRatio` | Device pixel ratio override. The physical buffer is `width × pixelRatio` wide. |
| `enableEvents` | `boolean` | `true` | Attaches pointer event listeners for click/hover/drag. Set to `false` for purely visual renderers. |
| `enableCulling` | `boolean` | `true` | Enables frustum culling — skip blocks outside the viewport each frame. |
| `debugHoverOutline` | `boolean` | `false` | Draws a magenta outline around the currently hovered block. Useful during development. |
| `enableCameraControls` | `boolean` | `false` | Enables built-in mouse-wheel pan/zoom controls (see [§6.4](#64-built-in-camera-controls)). |

```typescript
const renderer = new ImmediateRenderer({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
  width: 1200,
  height: 800,
  enableCulling: true,
  enableCameraControls: true
});
```

### 6.2 Public methods

| Method | Returns | Description |
|--------|---------|-------------|
| `render(block: Block)` | `void` | Renders one frame. Typically called inside a `requestAnimationFrame` loop. |
| `getCanvas()` | `HTMLCanvasElement` | Returns the canvas element (useful when no canvas was provided in config). |
| `resize(width, height)` | `void` | Resize the renderer and update the canvas size. |
| `destroy()` | `void` | Remove all event listeners and release resources. Call when unmounting. |
| `camera(children: Block[])` | `Block` | Wraps children in a camera group (pan/zoom). Also syncs the camera transform to the event system for correct hit testing. See [§6.3](#63-camera). |
| `getCameraTransform()` | `{ x, y, zoom }` | Get the current camera state. |
| `setCameraTransform(x, y, zoom)` | `void` | Set the camera state programmatically. |
| `getPerformanceStats()` | `PerformanceStats` | Returns `{ fps, blocksRendered, blocksCulled, renderTime }`. |
| `setDebugHoverOutline(enabled)` | `void` | Toggle the debug hover outline at runtime. |
| `getDebugHoverOutline()` | `boolean` | Returns the current debug outline state. |

### 6.3 Camera

`renderer.camera(children)` wraps a set of blocks in a camera group that applies the current pan and zoom state. Wrap your entire scene with it to enable panning and zooming.

```typescript
function render(): void {
  renderer.render(
    group({}, [
      renderer.camera([
        // All scene content goes here — positions are in world/scene coordinates
        rectangle({ x: 0, y: 0, dx: 100, dy: 100, fill: '#3498db' })
      ])
    ])
  );
  requestAnimationFrame(render);
}
```

The camera transform follows **Translate × Scale** ordering:

```
screen = world × zoom + translate
world  = (screen − translate) / zoom
```

Use `setCameraTransform(x, y, zoom)` to jump to a position programmatically:

```typescript
renderer.setCameraTransform(0, 0, 1);   // reset
renderer.setCameraTransform(-200, -150, 2);  // pan and zoom in
```

### 6.4 Built-in camera controls

When `enableCameraControls: true` is set, the renderer attaches a wheel event listener that handles pan and zoom automatically:

| Input | Action |
|-------|--------|
| Mouse wheel | Scroll vertically (pan) |
| Shift + mouse wheel | Scroll horizontally (pan) |
| Ctrl + mouse wheel | Zoom towards the cursor position |

The zoom level is clamped to the range `[0.1, 10]`.

When using `enableCameraControls`, you must still call `renderer.camera(children)` in your render function so that the camera group is injected into the scene each frame.

### 6.5 Debug hover outline

Setting `debugHoverOutline: true` (or calling `setDebugHoverOutline(true)`) draws a magenta outline around whichever block the pointer is currently hovering over. This is useful for diagnosing hit-testing issues and verifying that event handlers are attached to the expected blocks.

```typescript
const renderer = new ImmediateRenderer({
  canvas, width: 800, height: 600,
  debugHoverOutline: true
});
```

### 6.6 Frustum culling

When `enableCulling: true` (the default), the renderer skips blocks whose bounding box does not intersect the canvas viewport. Culled blocks are not drawn and their children are not visited.

Set `disableCulling: true` on an individual block to force it to be rendered even when outside the viewport.

### 6.7 Performance stats

```typescript
const stats = renderer.getPerformanceStats();
console.log(stats.fps, stats.blocksRendered, stats.blocksCulled, stats.renderTime);
```

### 6.8 Optimization tips

- Pre-allocate block arrays outside the render loop. Avoid creating new arrays on every frame.
- Use `visible: false` to hide blocks without removing them from the tree — they are skipped cheaply.
- Use `layer({ cache: true }, [...])` to cache subtrees that do not change every frame.

---

## 7. Tooltips

Any block can declare a `tooltip` prop — a factory function returning either a plain string or a `Block` tree.

```typescript
rectangle({
  x: 100, y: 100, dx: 80, dy: 40, fill: '#3498db',
  tooltip: () => 'Click to confirm'
})
```

When the pointer hovers over a block with a `tooltip`, the `ImmediateRenderer` renders the result at the pointer's scene position (on top of all content, using the portal system). The tooltip is cleared immediately when the pointer leaves.

The `tooltip` prop is subject to the same bubbling rules as other handlers: if the hovered block has no `tooltip`, the nearest ancestor with a `tooltip` is used.

---

## 8. `VitrinePointerEvent` Quick Reference

```typescript
type VitrinePointerEvent = PointerEvent & {
  xl?: number;   // block-local X (all transforms inverted)
  yl?: number;   // block-local Y
  xs?: number;   // scene X (camera inverse applied)
  ys?: number;   // scene Y
};
```

| Coordinate | Best for |
|------------|----------|
| `xl`, `yl` | Where inside the block was the pointer (e.g. relative click position within a button) |
| `xs`, `ys` | World-stable drag/drop (position is unaffected by camera pan or zoom) |
| `event.clientX/Y` | Positioning browser-level overlays (CSS tooltips, context menus) |

---

## 9. `VitrineComponent`

`VitrineComponent` wraps a single Vitrine render function in its own `<canvas>` element. It manages the canvas lifecycle, render loop, and device pixel ratio, making it easy to embed Vitrine inside any HTML page or JavaScript framework (React, Vue, etc.).

### 9.1 Creating a component

Use the static factory methods to choose the rendering mode:

```typescript
import { VitrineComponent, vstack, button, label, lightTheme } from 'vitrine-gui';

// GUI mode: render function returns a GUIControl tree
const myComponent = VitrineComponent.gui(
  () => vstack({ duSpacing: 8, duPadding: 12 }, [
    label({ stText: 'Hello from a component!' }),
    button({ stLabel: 'Click me' })
  ]),
  { width: 300, height: 120, theme: lightTheme }
);

// Block mode: render function returns a raw Block tree
const animatedComponent = VitrineComponent.block(
  () => {
    const t = Date.now() / 1000;
    return group({}, [
      rectangle({ dx: 300, dy: 200, fill: '#1a1a2e' }),
      circle({ x: 150 + Math.cos(t) * 60, y: 100 + Math.sin(t) * 40, radius: 30, fill: '#e94560' })
    ]);
  },
  { width: 300, height: 200 }
);
```

### 9.2 `VitrineComponentConfig`

| Option | Type | Description |
|--------|------|-------------|
| `width` | `number` | Canvas width in CSS pixels. If omitted in GUI mode, auto-sized from the root control. |
| `height` | `number` | Canvas height in CSS pixels. If omitted in GUI mode, auto-sized from the root control. |
| `theme` | `ThemeDefinition` | Theme for GUI controls (GUI mode only). Defaults to `lightTheme`. |
| `pixelRatio` | `number` | Device pixel ratio override. |
| `rendererConfig` | `Partial<RendererConfig>` | Additional options forwarded to `ImmediateRenderer`. |

### 9.3 Lifecycle

```typescript
// Mount — creates a <canvas>, appends it to the container, starts the render loop
myComponent.mount(document.getElementById('my-container')!);

// Resize at any time
myComponent.resize(400, 200);

// Update the render function (takes effect on the next frame)
myComponent.setRenderFunction(() => /* new tree */);

// Update the theme (GUI mode only)
myComponent.setTheme(darkTheme);

// Unmount — stops the render loop, removes the canvas, releases event listeners
myComponent.unmount();

// Check if currently mounted
if (myComponent.isMounted()) { /* ... */ }

// Get the underlying canvas element
const canvas = myComponent.getCanvas();
```

### 9.4 Auto-sizing

In GUI mode, if `width` or `height` is omitted from the config, the component calls `rsControl()` on the root control to compute the canvas size from the control's natural dimensions:

```typescript
// No width/height needed — sized automatically from the vstack's natural dimensions
const compact = VitrineComponent.gui(
  () => vstack({ duSpacing: 8, duPadding: 12 }, [
    label({ stText: 'Auto-sized' }),
    button({ stLabel: 'OK', dx: 200, dy: 36 })
  ])
);
compact.mount(document.getElementById('container')!);
```

---

## 10. Gradients & Patterns

All `fill` and `stroke` props accept a `FillStyle` value, which can be a plain CSS colour string **or** one of the descriptors below.

Factory functions are exported from `'vitrine'`:

```typescript
import { linearGradient, radialGradient, conicGradient, pattern, stop } from 'vitrine';
```

### 10.1 Linear gradient

```typescript
linearGradient(x0, y0, x1, y1, stops): LinearGradientDescriptor
```

| Argument | Type | Description |
|----------|------|-------------|
| `x0`, `y0` | `number` | Gradient start point in block-local coordinates |
| `x1`, `y1` | `number` | Gradient end point in block-local coordinates |
| `stops` | `ColorStop[]` | Array of colour stops (see [`stop()`](#the-stop-helper)) |

```typescript
// Left-to-right blue → red
rectangle({
  x: 20, y: 20, dx: 200, dy: 80,
  fill: linearGradient(0, 0, 200, 0, [
    stop(0,   '#4dabf7'),
    stop(1,   '#ff6b6b')
  ]),
  cornerRadius: 8
})

// Gradient stroke on a circle
circle({
  x: 300, y: 100, radius: 50,
  stroke: linearGradient(-50, 0, 50, 0, [
    stop(0, '#51cf66'),
    stop(1, '#845ef7')
  ]),
  strokeWidth: 4
})
```

### 10.2 Radial gradient

```typescript
radialGradient(x0, y0, r0, x1, y1, r1, stops): RadialGradientDescriptor
```

| Argument | Type | Description |
|----------|------|-------------|
| `x0`, `y0` | `number` | Centre of the inner (start) circle |
| `r0` | `number` | Radius of the inner circle (use `0` for a point source) |
| `x1`, `y1` | `number` | Centre of the outer (end) circle |
| `r1` | `number` | Radius of the outer circle |
| `stops` | `ColorStop[]` | Colour stops |

```typescript
// Sphere shading effect
circle({
  x: 100, y: 100, radius: 60,
  fill: radialGradient(
    -15, -20, 5,   // small inner circle (highlight)
    0, 0, 60,      // full-radius outer circle
    [
      stop(0,   '#ffffff'),
      stop(0.6, '#4dabf7'),
      stop(1,   '#1864ab')
    ]
  )
})
```

### 10.3 Conic gradient

```typescript
conicGradient(startAngle, x, y, stops): ConicGradientDescriptor
```

| Argument | Type | Description |
|----------|------|-------------|
| `startAngle` | `number` | Start angle in radians |
| `x`, `y` | `number` | Centre of the gradient (block-local) |
| `stops` | `ColorStop[]` | Colour stops where offset `0` = `startAngle`, offset `1` = `startAngle + 2π` |

```typescript
// Colour wheel
circle({
  x: 200, y: 200, radius: 80,
  fill: conicGradient(0, 0, 0, [
    stop(0,    '#ff6b6b'),
    stop(0.17, '#ffd43b'),
    stop(0.33, '#51cf66'),
    stop(0.5,  '#4dabf7'),
    stop(0.67, '#845ef7'),
    stop(1,    '#ff6b6b')
  ])
})

// Animated sweep for a loading spinner:
circle({
  x: cx, y: cy, radius: 40,
  fill: conicGradient(t * 2, 0, 0, [   // t incremented each frame
    stop(0,   '#4dabf7'),
    stop(0.5, '#ff6b6b'),
    stop(1,   '#4dabf7')
  ])
})
```

### 10.4 Pattern

```typescript
pattern(image, repetition?): PatternDescriptor
```

| Argument | Type | Description |
|----------|------|-------------|
| `image` | `HTMLImageElement \| HTMLCanvasElement` | Source image or canvas |
| `repetition` | `'repeat' \| 'repeat-x' \| 'repeat-y' \| 'no-repeat'` | Tile mode (default `'repeat'`) |

```typescript
const tileImg = new Image();
tileImg.src = '/tile.png';

rectangle({
  x: 0, y: 0, dx: 400, dy: 300,
  fill: pattern(tileImg, 'repeat')
})
```

### The `stop()` helper

```typescript
stop(offset: number, color: Color): ColorStop
```

`offset` is a value from `0` to `1` representing the position along the gradient axis. Multiple stops at the same offset create a hard colour transition.

```typescript
// Rainbow with a hard stop at 50%
linearGradient(0, 0, 100, 0, [
  stop(0,    '#ff6b6b'),
  stop(0.5,  '#ff6b6b'),   // same offset = hard stop
  stop(0.5,  '#4dabf7'),
  stop(1,    '#4dabf7')
])
```

### 10.5 CSS filter

The `filter` prop on `BaseBlockProps` accepts any CSS filter string and is applied to the entire block (including children):

```typescript
// Blur
rectangle({ x: 10, y: 10, dx: 100, dy: 40, fill: '#4dabf7', filter: 'blur(4px)' })

// Grayscale image
image({ dx: 200, dy: 120, src: photo, filter: 'grayscale(1)' })

// Multiple filters (space-separated)
circle({ x: 100, y: 100, radius: 40, fill: '#ff6b6b',
         filter: 'brightness(1.4) contrast(1.2)' })

// Animated hue rotation
circle({ x: cx, y: cy, radius: 30, fill: '#ff6b6b',
         filter: `hue-rotate(${Math.floor(t * 60) % 360}deg)` })
```

Supported CSS filter functions include: `blur`, `brightness`, `contrast`, `grayscale`, `hue-rotate`, `invert`, `opacity`, `saturate`, `sepia`, `drop-shadow`.

