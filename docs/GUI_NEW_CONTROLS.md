## New Complex GUI Controls

To avoid unbounded growth in shared GUI files, all **new complex controls** must be implemented in a dedicated module named after the control.

Example: a `ColorPicker` control must live in `packages/gui/src/GUI/color-picker.ts`.

### Required structure

Each complex control module must contain:

1. The control-specific props type (for example `ColorPickerProps`)
2. The control factory function (for example `colorpicker(...)`)
3. The control transform function (for example `transformColorPicker(...)`)

### Shared file touch policy

Shared files should only receive small registration changes:

- `packages/gui/src/GUI/types.ts`
  - Add enum entry to `GUIControlType`
  - Add type-map registration in `GUIPropsByType`
- `packages/gui/src/GUI/controls.ts`
  - Add a minimal export/forwarder for the new factory
- `packages/gui/src/GUI/transform.ts`
  - Add switch dispatch to the module transform function
  - Add fallback size mapping if needed
- `packages/gui/src/GUI/constants.ts`
  - Usually no changes needed for co-located complex-control defaults
- `packages/gui/src/GUI/themes.ts`
  - Add default style entries for each built-in theme

### Default values ownership

For new complex controls, defaults must be co-located in the control module (for example `DEFAULTS` in `packages/gui/src/GUI/color-picker.ts`) and imported directly by code that needs them, with contextual aliasing at import sites (for example `DEFAULTS as colorPickerDefaults`).

### Scope

- This rule applies to **new controls**.
- Existing controls can remain as-is unless explicitly migrated.

### Implementation notes

- Follow repository conventions (semicolons, explicit return types, explicit `.ts` relative imports).
- Keep module APIs controlled and minimal.
- Prefer reusable helper functions inside the control module for pointer mapping and value conversion.