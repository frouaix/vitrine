# Coordinate Systems in Vitrine

This document explains the coordinate spaces used by Vitrine, the naming
conventions for coordinate variables, and how transforms compose. Start with
the simple case (nested groups, no camera), then see how a camera transform
fits in.

---

## 1. Overview of coordinate spaces

A pointer event travels through five coordinate spaces before it reaches your
block's event handler:

```
  Browser window        Canvas buffer        Logical           Scene            Local
  (CSS pixels)          (physical pixels)    (÷ pixelRatio)    (camera⁻¹)      (block⁻¹)
 ┌──────────────┐      ┌──────────────┐     ┌────────────┐   ┌────────────┐   ┌────────────┐
 │  xw, yw      │ ──▶  │  xc, yc      │ ──▶ │  x, y      │──▶│  xs, ys    │──▶│  xl, yl    │
 │ event.clientX │      │ CSS × DPR    │     │ xc / ratio │   │ inverse of │   │ inverse of │
 │ event.clientY │      │              │     │            │   │ camera mat │   │ all parent │
 │              │      │              │     │            │   │            │   │ + block mat│
 └──────────────┘      └──────────────┘     └────────────┘   └────────────┘   └────────────┘
```

| Suffix | Space | How it is computed |
|--------|-------|--------------------|
| `w` | **Window** | Raw `event.clientX / clientY` in CSS pixels. |
| `c` | **Canvas buffer** | `(xw − canvasRect.left) × (canvas.width / canvasRect.width)`. This converts from the CSS layout box to the physical pixel buffer, accounting for `devicePixelRatio`. |
| *(none)* | **Logical** | `xc / pixelRatio`. This is the coordinate space the renderer uses internally; all block positions are expressed in logical units. |
| `s` | **Scene** | Apply the *inverse* of the full camera matrix (pixelRatio × translate × scale) to `(xc, yc)`. Scene coordinates are stable in the world regardless of camera pan/zoom. |
| `l` | **Local** | Apply the *inverse* of the cumulative parent + block transform to the logical position. `(xl, yl)` is relative to the block's own origin. |

### Source locations

| Conversion | File | Method |
|------------|------|--------|
| window → canvas | `src/events.ts` | `getCanvasCoordinates()` |
| canvas → logical | `src/events.ts` | `convertCanvasToLogicalCoordinates()` |
| canvas → scene | `src/events.ts` | `convertCanvasToSceneCoordinates()` |
| logical → local | `src/hit-test.ts` | `HitTester.hitTest()` (via `Matrix2D.invert()`) |

---

## 2. Variable naming conventions (Hungarian notation)

Vitrine uses short prefixes so that the coordinate space of every variable is
immediately visible:

| Prefix | Meaning | Example |
|--------|---------|---------|
| `x`, `y` | A position coordinate | `xs`, `yl` |
| `dx`, `dy` | A size / dimension (delta) | `dxRect`, `dyClip` |
| `du` | A generic distance (dimensionless units) | `duRadius` |
| `pt` | A point object `{ xc, yc }` | `ptcDragStart` |

Coordinate-space suffixes are appended to the prefix:

| Suffix | Space | Example variable |
|--------|-------|------------------|
| `w` | window (CSS) | `xwPointer`, `ywCanvas` |
| `c` | canvas buffer | `xc`, `yc`, `ptcDragStart` |
| `s` | scene | `xs`, `ys` |
| `l` | local (block) | `xl`, `yl`, `dxl` |

A variable named `ptcDragStart` is therefore a **point** (`pt`) in **canvas
buffer** (`c`) space, captured at the start of a drag.

---

## 3. Transform hierarchy (no camera)

### 3.1 How block transforms compose

Each block may declare `{ x, y, rotation, scaleX, scaleY, skewX, skewY }`.
These are composed into a single `Matrix2D` in fixed order:

```
blockMatrix = Identity
    .translate(x, y)       // 1. position
    .rotate(rotation)      // 2. rotate around new origin
    .scaleXY(scaleX, scaleY)  // 3. scale
    .skewXY(skewX, skewY)     // 4. skew
```

> This is also the order used by `TransformStack.apply()` in `src/transform.ts`
> and `HitTester.getBlockTransform()` in `src/hit-test.ts`.

Parent transforms are multiplied first, then the child's block transform.
The cumulative world matrix for a block is:

```
worldMatrix = rootTransform × parent₁ × parent₂ × … × blockMatrix
```

### 3.2 Example: nested groups

Consider this block tree (no camera):

```typescript
group({ x: 100, y: 50 }, [            // groupA
  group({ x: 20, y: 10, rotation: 0.5 }, [  // groupB
    rectangle({ x: 5, y: 5, dx: 30, dy: 20 })  // rect
  ])
])
```

```
  Logical space (0,0)
  ┌─────────────────────────────────────────────────┐
  │                                                 │
  │        groupA origin (100, 50)                  │
  │        ┌───────────────────────┐                │
  │        │                       │                │
  │        │   groupB origin       │                │
  │        │   (120, 60) in logical│                │
  │        │   ╲                   │                │
  │        │    ╲  rotated 0.5 rad │                │
  │        │     ╲                 │                │
  │        │      ┌──────┐        │                │
  │        │      │ rect │        │                │
  │        │      │(5,5) │ ← local coords          │
  │        │      └──────┘        │                │
  │        └───────────────────────┘                │
  └─────────────────────────────────────────────────┘
```

**Forward path** (rendering): the renderer walks the tree, composing
transforms on a `TransformStack`, and calls `ctx.setTransform()` with the
cumulative matrix before drawing each block.

**Inverse path** (hit testing): given a logical point `(x, y)`, the hit
tester computes `inverse(worldMatrix).transformPoint(x, y)` to get the
block-local coordinates `(xl, yl)`, then checks whether `(xl, yl)` falls
within the block's shape (e.g., `0 ≤ xl ≤ dx && 0 ≤ yl ≤ dy` for a
rectangle).

### 3.3 The Matrix2D class

The `Matrix2D` class in `src/transform.ts` stores a 2×3 affine matrix:

```
| a  c  e |       a,d = scale/rotate
| b  d  f |       b,c = rotate/skew
| 0  0  1 |       e,f = translate
```

Key operations:

```typescript
m.translate(dx, dy)       // append translation
m.rotate(angle)           // append rotation (radians)
m.scaleXY(sx, sy)         // append non-uniform scale
m.skewXY(skewX, skewY)    // append skew (tangent values)
m.multiply(other)         // matrix composition: this × other
m.transformPoint(x, y)    // apply matrix to a point → { x, y }
m.invert()                // compute inverse matrix (null if singular)
```

The `TransformStack` wraps `Matrix2D` with `save()`/`restore()` semantics,
mirroring the Canvas2D context stack.

---

## 4. Camera transform

### 4.1 What the camera does

The camera is *not* a special subsystem — it is a regular `group()` block
inserted at the root of the scene tree via `renderer.camera(children)`:

```typescript
renderer.render(
  group({}, [
    renderer.camera([        // ← camera group injected here
      rectangle({ x: 200, y: 100, dx: 50, dy: 50 }),
      // ... scene content ...
    ]),
  ])
);
```

Internally, `camera()` returns:

```typescript
group({
  x: cameraX,          // pan translation
  y: cameraY,
  scaleX: cameraZoom,  // uniform zoom
  scaleY: cameraZoom
}, children)
```

### 4.2 Camera convention: Translate × Scale

The camera uses **Translate then Scale** ordering:

```
cameraMatrix = Identity.translate(cameraX, cameraY).scale(zoom, zoom)
```

This means:

```
  screen = world × zoom + translate
  world  = (screen − translate) / zoom
```

```
  World space                Camera transform            Screen (logical) space
 ┌──────────────────┐                                  ┌──────────────────────┐
 │                  │       screen = world * zoom       │                      │
 │   ╔══════╗       │           + translate             │          ╔══════╗    │
 │   ║block ║       │  ─────────────────────────▶       │          ║block ║    │
 │   ║(200,100)     │                                   │          ║      ║    │
 │   ╚══════╝       │       world = (screen − translate)│          ╚══════╝    │
 │                  │              / zoom               │    shifted & scaled  │
 │                  │  ◀─────────────────────────       │                      │
 └──────────────────┘                                  └──────────────────────┘
```

### 4.3 The full scene transform

For hit testing, the `EventManager` needs the combined transform that maps
logical coordinates to canvas buffer coordinates. The renderer builds and
syncs this:

```typescript
// In renderer.camera():
const cameraTransform = Matrix2D.identity()
  .translate(this.cameraX, this.cameraY)
  .scaleXY(this.cameraZoom, this.cameraZoom);

const fullTransform = Matrix2D.identity()
  .scaleXY(this.pixelRatio, this.pixelRatio)   // DPI scaling
  .multiply(cameraTransform);                   // camera pan+zoom

this.eventManager.setCameraTransform(fullTransform);
```

The `EventManager` inverts this to convert canvas-buffer coordinates to
scene coordinates:

```typescript
// In convertCanvasToSceneCoordinates():
const inverse = this.sceneTransform.invert();
return inverse.transformPoint(xc, yc);   // → { xs, ys }
```

### 4.4 Wheel zoom: keeping the world point under the cursor

When the user zooms with Ctrl+wheel, the camera adjusts translation so the
world point under the cursor stays fixed:

```typescript
// Current world position under pointer:
const worldX = (logicalX - cameraX) / cameraZoom;
const worldY = (logicalY - cameraY) / cameraZoom;

// After zoom, keep the same world point at the same screen position:
// logicalX = worldX * newZoom + newCameraX
// → newCameraX = logicalX - worldX * newZoom
cameraX = logicalX - worldX * newZoom;
cameraY = logicalY - worldY * newZoom;
cameraZoom = newZoom;
```

---

## 5. VitrinePointerEvent

All event handlers receive a `VitrinePointerEvent`, which extends the
browser's `PointerEvent` with pre-computed coordinates:

```typescript
type VitrinePointerEvent = PointerEvent & {
  xl?: number;   // block-local X (all transforms inverted)
  yl?: number;   // block-local Y
  xs?: number;   // scene X (camera-inverse applied, before block transforms)
  ys?: number;   // scene Y
};
```

These fields are set by `EventManager.decoratePointerEvent()`, which copies
them from the `HitTestResult`.

### When to use which coordinate

| Coordinate | Use case |
|------------|----------|
| `xl, yl` | Drawing relative to a block (e.g., where inside a button was clicked). |
| `xs, ys` | World-stable operations (e.g., drag-to-move an object in scene space). These are unaffected by camera pan/zoom. |
| `event.clientX/Y` | Positioning browser-level UI (tooltips, overlays) in CSS pixels. |

### Example: dragging a block in scene space

```typescript
let dragStartXs = 0;
let dragStartYs = 0;
let origX = 0;
let origY = 0;

rectangle({
  x: blockX, y: blockY, dx: 80, dy: 40,
  fill: '#3498db',
  onPointerDown: (e: VitrinePointerEvent) => {
    dragStartXs = e.xs!;  // scene coords — stable during camera changes
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

---

## 6. Putting it all together

### Full coordinate pipeline

```
  ┌──────────────────────────────────────────────────────────────────┐
  │                         FORWARD (Rendering)                      │
  │                                                                  │
  │  Block-local coords        apply block transforms                │
  │  (xl, yl)            ──────────────────────────▶  Logical space  │
  │                               apply camera                      │
  │                          ──────────────────────▶  Canvas buffer  │
  │                              × pixelRatio                        │
  │                          ──────────────────────▶  Physical pixels│
  └──────────────────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────────────────┐
  │                         INVERSE (Hit testing)                    │
  │                                                                  │
  │  Browser event                                                   │
  │  (xw, yw)     ──▶ getCanvasCoordinates() ──▶  (xc, yc)         │
  │                                                                  │
  │  (xc, yc)     ──▶ ÷ pixelRatio           ──▶  logical (x, y)   │
  │                                                                  │
  │  (xc, yc)     ──▶ sceneTransform⁻¹       ──▶  (xs, ys)         │
  │                                                                  │
  │  logical (x,y) ──▶ worldMatrix⁻¹          ──▶  (xl, yl)         │
  │                     (cumulative block                            │
  │                      transforms inverted)                        │
  └──────────────────────────────────────────────────────────────────┘
```

### Example with camera + nested groups

```typescript
const renderer = new ImmediateRenderer(canvas);

function renderFrame(): void {
  renderer.render(
    group({}, [
      renderer.camera([
        // Scene content — positions are in world/scene coordinates
        group({ x: 300, y: 200, rotation: Math.PI / 6 }, [
          rectangle({
            x: 0, y: 0, dx: 100, dy: 60,
            fill: '#2ecc71',
            onClick: (e: VitrinePointerEvent) => {
              // xl, yl: relative to rectangle's top-left (0..100, 0..60)
              // xs, ys: world position, unaffected by camera or group rotation
              console.log(`local: (${e.xl}, ${e.yl})  scene: (${e.xs}, ${e.ys})`);
            }
          })
        ])
      ])
    ])
  );
  requestAnimationFrame(renderFrame);
}
renderFrame();
```

For this click, the coordinate pipeline resolves:

1. **Window** `(xw, yw)` — the raw `clientX/clientY` from the browser.
2. **Canvas** `(xc, yc)` — adjusted for canvas position and DPI.
3. **Logical** `(x, y)` — divided by `pixelRatio`; used for hit testing entry.
4. **Scene** `(xs, ys)` — camera inverse applied to `(xc, yc)`; stable
   world position; set on the event as `e.xs, e.ys`.
5. **Local** `(xl, yl)` — full inverse of camera group × rotated group ×
   rectangle; gives position relative to the rect's origin; set on the event
   as `e.xl, e.yl`.
