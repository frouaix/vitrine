# GUI Controls Reference

This document describes the higher-level GUI DSL that ships in the `vitrine-gui` package. The GUI DSL provides ready-made interactive controls (buttons, sliders, text boxes, …) and layout primitives built on top of the [core block language](BLOCK_DSL.md).

---

## 1. Overview

The GUI layer sits on top of Vitrine's core blocks. You describe a control tree using GUI factory functions, then call `transformGUIControl()` to convert it into a core `Block` tree that the `ImmediateRenderer` can draw.

```typescript
import { ImmediateRenderer } from 'vitrine';
import {
  vstack, button, slider, checkbox, label,
  transformGUIControl, getTheme
} from 'vitrine-gui';

const renderer = new ImmediateRenderer({ canvas, width: 800, height: 600 });
const theme = getTheme('light');

let volume = 0.5;

function render(): void {
  const ui = vstack({ x: 20, y: 20, duSpacing: 12 }, [
    label({ stText: 'Volume' }),
    slider({ value: volume, min: 0, max: 1, step: 0.01,
             onChange: v => { volume = v; } }),
    button({ stLabel: 'Reset', onClick: () => { volume = 0.5; } })
  ]);

  renderer.render(transformGUIControl(ui, { theme }));
  requestAnimationFrame(render);
}

render();
```

---

## 2. Common Base Properties (`GUIBaseProps`)

All GUI controls extend `GUIBaseProps`:

| Property | Type | Description |
|----------|------|-------------|
| `x` | `number` | X position in the parent's coordinate space |
| `y` | `number` | Y position in the parent's coordinate space |
| `dx` | `number` | Explicit width override |
| `dy` | `number` | Explicit height override |
| `fVisible` | `boolean` | When `false`, the control is hidden |
| `fEnabled` | `boolean` | When `false`, the control is rendered in its disabled style and ignores input |
| `id` | `string` | Optional identifier |
| `className` | `string` | Class name used to look up a named style in the active theme |

### Sizing

If `dx` and `dy` are omitted, each control uses its built-in default size. Layout containers (`hstack`, `vstack`, `grid`) compute their size automatically from their children.

---

## 3. Theme System

Themes control the visual style of every control. Three themes are built in:

| Name | Description |
|------|-------------|
| `'light'` | Clean white / blue — the default |
| `'dark'` | Dark background with subdued colors |
| `'colorful'` | Warm yellow / pink palette |

```typescript
import { getTheme } from 'vitrine-gui';

const theme = getTheme('dark');  // or 'light', 'colorful'
```

### `ThemeDefinition` structure

```typescript
interface ThemeDefinition {
  name: string;
  styles: {
    [className: string]: ControlStyle;   // named styles (e.g. 'primary-button')
  };
  defaults: {
    [controlType: string]: ControlStyle; // per-control-type defaults
  };
}
```

### `ControlStyle` properties

| Property | Type | Description |
|----------|------|-------------|
| `colBg` | `string` | Background colour |
| `colBgActive` | `string` | Background colour when pressed/active |
| `colBgChecked` | `string` | Background colour when checked (checkbox, radio) |
| `colBgDisabled` | `string` | Background colour when disabled |
| `colBgHover` | `string` | Background colour on hover |
| `colBorder` | `string` | Border colour |
| `colBorderFocus` | `string` | Border colour when focused |
| `colSliderThumb` | `string` | Slider thumb colour |
| `colSliderTrack` | `string` | Slider track colour |
| `colText` | `string` | Text colour |
| `colTextDisabled` | `string` | Text colour when disabled |
| `borderWidth` | `number` | Border width in logical units |
| `borderRadius` | `number` | Corner radius in logical units |
| `fontSize` | `number` | Font size in logical units |
| `fontFamily` | `string` | CSS font family string |
| `duPadding` | `number` | Internal padding in logical units |

### Named styles and `className`

The `className` prop on any control selects a named entry from `theme.styles`. The button variants below use this mechanism:

```typescript
button({ stLabel: 'Delete', className: 'danger-button' })
button({ stLabel: 'Save',   className: 'primary-button' })
```

The built-in themes ship `'primary-button'` and `'danger-button'` named styles.

---

## 4. Generic Factory

The low-level `control()` factory can create any control type:

```typescript
import { control, GUIControlType } from 'vitrine-gui';

const btn = control(GUIControlType.Button, { stLabel: 'OK' });
```

All specific factory functions (`button()`, `slider()`, etc.) delegate to `control()`.

---

## 5. Interactive Controls

### 5.1 `button`

A push button.

```typescript
button(props: ButtonProps): GUIControl
```

| Prop | Type | Description |
|------|------|-------------|
| `stLabel` | `string` | Button label text |
| `variant` | `'primary' \| 'secondary' \| 'danger'` | Visual variant (maps to a named theme style) |
| `onClick` | `() => void` | Fired when the button is clicked |
| `onHover` | `(event: VitrinePointerEvent) => void` | Fired on hover |

```typescript
button({ stLabel: 'Submit', variant: 'primary', onClick: () => submitForm() })
```

---

### 5.2 `checkbox`

A two-state toggle with an optional label.

```typescript
checkbox(props: CheckBoxProps): GUIControl
```

| Prop | Type | Description |
|------|------|-------------|
| `fChecked` | `boolean` | Current checked state |
| `stLabel` | `string` | Label text displayed beside the checkbox |
| `onChange` | `(fChecked: boolean) => void` | Fired when the state changes |
| `onHover` | `(event: VitrinePointerEvent) => void` | Fired on hover |

```typescript
let fAccepted = false;
checkbox({
  fChecked: fAccepted,
  stLabel: 'I accept the terms',
  onChange: v => { fAccepted = v; }
})
```

---

### 5.3 `radiobutton`

A single radio button. Use multiple radio buttons with the same `group` to create a mutually exclusive selection.

```typescript
radiobutton(props: RadioButtonProps): GUIControl
```

| Prop | Type | Description |
|------|------|-------------|
| `fChecked` | `boolean` | Whether this button is selected |
| `stLabel` | `string` | Label text |
| `stValue` | `string` | The value this button represents |
| `group` | `string` | Group name — shared by all radio buttons in the same logical group |
| `onChange` | `(stValue: string) => void` | Fired when this button becomes selected, with its `stValue` |
| `onHover` | `(event: VitrinePointerEvent) => void` | Fired on hover |

```typescript
let size = 'medium';

vstack({ duSpacing: 8 }, [
  radiobutton({ stLabel: 'Small',  stValue: 'small',  group: 'size', fChecked: size === 'small',  onChange: v => { size = v; } }),
  radiobutton({ stLabel: 'Medium', stValue: 'medium', group: 'size', fChecked: size === 'medium', onChange: v => { size = v; } }),
  radiobutton({ stLabel: 'Large',  stValue: 'large',  group: 'size', fChecked: size === 'large',  onChange: v => { size = v; } })
])
```

---

### 5.4 `slider`

A draggable slider for selecting a value in a range.

```typescript
slider(props: SliderProps): GUIControl
```

| Prop | Type | Description |
|------|------|-------------|
| `value` | `number` | Current value |
| `min` | `number` | Minimum value (default `0`) |
| `max` | `number` | Maximum value (default `100`) |
| `step` | `number` | Snap increment (default `1`) |
| `orientation` | `'horizontal' \| 'vertical'` | Layout orientation (default `'horizontal'`) |
| `onChange` | `(value: number) => void` | Fired continuously while dragging |
| `onHover` | `(event: VitrinePointerEvent) => void` | Fired on hover |

```typescript
let brightness = 80;
slider({ value: brightness, min: 0, max: 100, step: 1,
         onChange: v => { brightness = v; } })
```

---

### 5.5 `textbox`

A single-line or multi-line text input field.

```typescript
textbox(props: TextBoxProps): GUIControl
```

| Prop | Type | Description |
|------|------|-------------|
| `stValue` | `string` | Current text value |
| `stPlaceholder` | `string` | Placeholder text shown when empty |
| `fMultiline` | `boolean` | Enable multi-line input |
| `maxLength` | `number` | Maximum character count |
| `onChange` | `(stValue: string) => void` | Fired when the text changes |
| `onFocus` | `() => void` | Fired when the field gains focus |
| `onBlur` | `() => void` | Fired when the field loses focus |
| `onClick` | `(event: VitrinePointerEvent) => void` | Fired on click |
| `onHover` | `(event: VitrinePointerEvent) => void` | Fired on hover |

```typescript
let name = '';
textbox({ stValue: name, stPlaceholder: 'Enter your name',
          onChange: v => { name = v; } })
```

---

### 5.6 `dropdown`

A single-selection dropdown menu.

```typescript
dropdown(props: DropdownProps): GUIControl
```

| Prop | Type | Description |
|------|------|-------------|
| `stValue` | `string` | Currently selected option value |
| `options` | `Array<{ stLabel?: string; value: string }>` | List of available options |
| `stPlaceholder` | `string` | Text shown when no option is selected |
| `fOpen` | `boolean` | Whether the dropdown is currently open |
| `onChange` | `(stValue: string) => void` | Fired when the selection changes |
| `onToggle` | `(fOpen: boolean) => void` | Fired when the dropdown is opened or closed |
| `onClick` | `(event: VitrinePointerEvent) => void` | Fired on click |
| `onHover` | `(event: VitrinePointerEvent) => void` | Fired on hover |

```typescript
let country = 'fr';
let fOpen = false;

dropdown({
  stValue: country,
  fOpen,
  options: [
    { stLabel: 'France',         value: 'fr' },
    { stLabel: 'United Kingdom', value: 'uk' },
    { stLabel: 'Germany',        value: 'de' }
  ],
  onChange:  v => { country = v; fOpen = false; },
  onToggle:  v => { fOpen = v; }
})
```

---

### 5.7 `colorpicker`

An HSV colour picker with optional preset swatches and a live preview.

```typescript
colorpicker(props: ColorPickerProps): GUIControl
```

| Prop | Type | Description |
|------|------|-------------|
| `hue` | `number` | Current hue (0–360) |
| `saturation` | `number` | Current saturation (0–1) |
| `value` | `number` | Current brightness value (0–1) |
| `presets` | `string[]` | Array of preset CSS colour strings shown as quick-pick swatches |
| `fShowPreview` | `boolean` | Show a live colour preview swatch |
| `fShowPresets` | `boolean` | Show the preset swatches row |
| `onChange` | `(change: ColorPickerChange) => void` | Fired when the colour changes |
| `onHover` | `(event: VitrinePointerEvent) => void` | Fired on hover |

The `ColorPickerChange` object passed to `onChange`:

```typescript
interface ColorPickerChange {
  hue: number;        // 0–360
  saturation: number; // 0–1
  value: number;      // 0–1
  stHex: string;      // e.g. '#3b82f6'
  stRgb: string;      // e.g. 'rgb(59, 130, 246)'
}
```

```typescript
let hue = 200;
let saturation = 0.8;
let value = 0.9;

colorpicker({
  hue, saturation, value,
  fShowPreview: true,
  fShowPresets: true,
  presets: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6'],
  onChange: c => { hue = c.hue; saturation = c.saturation; value = c.value; }
})
```

---

## 6. Content Controls

### 6.1 `label`

A non-interactive text label.

```typescript
label(props: LabelProps): GUIControl
```

| Prop | Type | Description |
|------|------|-------------|
| `stText` | `string` | Text content |
| `fontSize` | `number` | Font size override |
| `fontWeight` | `'normal' \| 'bold'` | Font weight |
| `align` | `'left' \| 'center' \| 'right'` | Text alignment |

```typescript
label({ stText: 'Settings', fontSize: 18, fontWeight: 'bold' })
```

---

### 6.2 `guiImage`

A scaled image control.

```typescript
guiImage(props: GUIImageProps): GUIControl
```

| Prop | Type | Description |
|------|------|-------------|
| `src` | `string \| HTMLImageElement` | Image source URL or pre-loaded element |
| `fit` | `'cover' \| 'contain' \| 'fill'` | How the image fills the control bounds |

```typescript
guiImage({ src: '/logo.png', dx: 120, dy: 60, fit: 'contain' })
```

---

### 6.3 `panel`

A rectangular container with an optional title bar and border, used to group related controls visually.

```typescript
panel(props: PanelProps, children?: GUIControl[]): GUIControl
```

| Prop | Type | Description |
|------|------|-------------|
| `stTitle` | `string` | Optional title text shown in a header bar |
| `duPadding` | `number` | Internal padding (overrides theme default) |

```typescript
panel({ stTitle: 'Options', dx: 300, dy: 200 }, [
  checkbox({ fChecked: true, stLabel: 'Enable notifications' }),
  slider({ value: 75 })
])
```

---

## 7. Layout Controls

Layout controls arrange their children automatically. You must provide a `children` array.

### 7.1 `hstack` / `vstack`

Lays children out in a horizontal or vertical line respectively.

```typescript
hstack(props: StackLayoutProps, children: GUIControl[]): GUIControl
vstack(props: StackLayoutProps, children: GUIControl[]): GUIControl
```

| Prop | Type | Description |
|------|------|-------------|
| `duSpacing` | `number` | Gap between children (default `8`) |
| `duPadding` | `number` | Padding around the children area (default `8`) |
| `alignment` | `'start' \| 'center' \| 'end' \| 'stretch'` | Cross-axis alignment |

The stack's own `dx`/`dy` are computed automatically from children if not specified.

```typescript
hstack({ duSpacing: 12 }, [
  button({ stLabel: 'Cancel' }),
  button({ stLabel: 'OK', variant: 'primary' })
])
```

---

### 7.2 `grid`

Arranges children in a column-based grid.

```typescript
grid(props: GridProps, children: GUIControl[]): GUIControl
```

| Prop | Type | Description |
|------|------|-------------|
| `cColumns` | `number` | Number of columns (default `3`) |
| `duSpacing` | `number` | Gap between cells (default `8`) |
| `duPadding` | `number` | Padding around the grid (default `8`) |

Children are placed left-to-right, top-to-bottom. Each column is sized to the widest child in that column; each row to the tallest child in that row.

```typescript
grid({ cColumns: 3, duSpacing: 10 }, [
  ...colorSwatches.map(col => guiImage({ src: col, dx: 40, dy: 40 }))
])
```

---

### 7.3 `carousel`

A paged container that shows one child at a time with optional auto-play.

```typescript
carousel(props: CarouselProps, children: GUIControl[]): GUIControl
```

| Prop | Type | Description |
|------|------|-------------|
| `currentIndex` | `number` | Index of the currently displayed child |
| `fAutoPlay` | `boolean` | Enable automatic cycling through children |
| `interval` | `number` | Auto-play interval in milliseconds (default `3000`) |
| `onIndexChange` | `(index: number) => void` | Fired when the visible child changes |

```typescript
let slideIndex = 0;

carousel({ currentIndex: slideIndex, onIndexChange: i => { slideIndex = i; } }, [
  panel({ stTitle: 'Slide 1', dx: 400, dy: 250 }),
  panel({ stTitle: 'Slide 2', dx: 400, dy: 250 }),
  panel({ stTitle: 'Slide 3', dx: 400, dy: 250 })
])
```

---

## 8. Calendar Controls

### 8.1 `calendarDayView`

Renders a day or multi-day column view with timed events.

```typescript
calendarDayView(props: CalendarDayViewProps): GUIControl
```

| Prop | Type | Description |
|------|------|-------------|
| `rgEvent` | `CalendarEvent[]` | Array of events to display |
| `dateStart` | `Date` | First date to show |
| `cDay` | `number` | Number of days to show (1 = single day, 7 = week) |
| `hourStart` | `number` | First hour of the visible time range (default `0`) |
| `hourEnd` | `number` | Last hour of the visible time range (default `24`) |
| `onNavigate` | `(dateRange: DateRange) => void` | Fired when the user navigates to a new date range |

---

### 8.2 `calendarMonthView`

Renders a monthly calendar grid.

```typescript
calendarMonthView(props: CalendarMonthViewProps): GUIControl
```

| Prop | Type | Description |
|------|------|-------------|
| `rgEvent` | `CalendarEvent[]` | Array of events to display |
| `dateStart` | `Date` | First date of the month |
| `cMonth` | `number` | Number of months to show |
| `dayStartWeek` | `number` | Day of week to start on: `0` = Sunday, `1` = Monday (default `1`) |
| `onNavigate` | `(dateRange: DateRange) => void` | Fired when the user navigates to a new date range |

### `CalendarEvent` shape

```typescript
interface CalendarEvent {
  id: string;
  stTitle: string;
  dateStart: Date;
  dateEnd?: Date;
  stLocation?: string;
  stNotes?: string;
  stUrl?: string;
  colEvent: string;  // CSS colour string for this event
}
```

---

## 9. Converting GUI Controls to Core Blocks

GUI controls are pure data descriptors. To render them, convert the root control to a `Block` tree with `transformGUIControl()`, then pass the result to `renderer.render()`.

```typescript
import { transformGUIControl, getTheme } from 'vitrine-gui';

const theme = getTheme('light');

function render(): void {
  const ui = vstack({ x: 20, y: 20 }, [ /* ... */ ]);
  renderer.render(transformGUIControl(ui, { theme }));
  requestAnimationFrame(render);
}
```

### Size queries

Use `rsControl(control)` to measure the pixel dimensions of a control *before* rendering it — useful for manually positioning controls relative to each other:

```typescript
import { rsControl } from 'vitrine-gui';

const btn = button({ stLabel: 'OK' });
const { width, height } = rsControl(btn);
// position another control below it:
const lbl = label({ stText: 'Done', y: height + 4 });
```

---

## 10. Rendering Lifecycle

The typical rendering loop for a GUI-heavy application:

```typescript
import { ImmediateRenderer } from 'vitrine';
import {
  vstack, button, checkbox, slider, label,
  transformGUIControl, getTheme
} from 'vitrine-gui';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const renderer = new ImmediateRenderer({ canvas, width: 800, height: 600 });
const theme = getTheme('light');

// Mutable UI state — stored outside the render function
let volume = 0.7;
let fMuted = false;

function render(): void {
  const ui = vstack({ x: 20, y: 20, duSpacing: 16 }, [
    label({ stText: 'Audio Settings', fontSize: 20, fontWeight: 'bold' }),
    slider({ value: volume, min: 0, max: 1, step: 0.01,
             fEnabled: !fMuted,
             onChange: v => { volume = v; } }),
    checkbox({ fChecked: fMuted, stLabel: 'Mute',
               onChange: v => { fMuted = v; } })
  ]);

  renderer.render(transformGUIControl(ui, { theme }));
  requestAnimationFrame(render);
}

render();
```

Key points:
1. **State lives outside the render function** and is mutated by `onChange` / `onClick` callbacks.
2. **`render()` is called every frame** via `requestAnimationFrame`. The state is read each frame to produce the UI — this is the immediate-mode pattern.
3. **`transformGUIControl()` is called inside `render()`** — do not cache the result across frames if state may have changed.
