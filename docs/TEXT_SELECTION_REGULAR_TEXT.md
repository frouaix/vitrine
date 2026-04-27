# Text Selection for Regular `text()` Blocks

This guide explains how to enable text selection when using regular Vitrine `text()` blocks (not `texta()`).

## 1. Enable selection on the component

Create your component with `selectionConfig.enabled: true`:

```ts
import { VitrineComponent } from 'vitrine-gui';

const component = VitrineComponent.block(buildScene, {
  width: 800,
  height: 400,
  renderMode: 'auto',
  selectionConfig: {
    enabled: true,
    caretColor: '#dc2626',
    selectionColor: 'rgba(59, 130, 246, 0.2)',
    caretWidth: 2
  }
});
```

## 2. Give selectable `text()` blocks stable `id` values

Selection hit-testing and overlays are keyed by block `id`.

```ts
import { group, text } from 'vitrine';

function buildScene() {
  return group({}, [
    text({
      id: 'paragraph-1',
      x: 40,
      y: 60,
      text: 'Click and drag to select this text.',
      fontSize: 18,
      baseline: 'top'
    })
  ]);
}
```

If a `text()` block has no `id`, it is not selectable.

## 3. Pointer + keyboard behavior

- Pointer down/move/up drives caret placement and drag selection.
- Keyboard navigation (`ArrowLeft/Right/Up/Down`, `Shift+Arrow`, `Home`, `End`, `Ctrl/Cmd+A`) is handled by `TextSelectionManager`.
- The canvas is focusable; clicking the canvas gives it focus for keyboard navigation.

## 4. Coordinate space contract

Character bounds are handled in **scene/CSS coordinates** (the same coordinate system as your block positions), not raw canvas buffer pixels.

## 5. Automatic bounds provider (default path)

For regular `text()` blocks, `VitrineComponent` automatically builds and updates a character bounds provider from the block tree each frame.

It uses renderer-compatible layout rules (font, wrapping, alignment, baseline, transforms), so typical usage does not require manual bounds wiring.

## 6. Custom bounds provider (optional)

You can override the automatic provider when needed:

```ts
const selectionManager = component.getSelectionManager();

selectionManager?.setCharacterBoundsProvider((blockId, charIndex) => {
  // Return { x, y, width, height } in scene/CSS coordinates, or null.
  return null;
});
```

Use this only for custom rendering paths where automatic `text()` extraction is insufficient.

## Current scope

- Automatic adapter support is for regular `text()` blocks with `id`.
- Cross-block selections are not supported.
- `texta()` requires custom handling if you need selection behavior equivalent to `text()`.
