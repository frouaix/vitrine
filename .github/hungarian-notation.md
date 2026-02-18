# Hungarian Notation

## Geometric variables

All variables denoting coordinates should include the coordinate system they refer to
- xl, yl: local coordinate system of an object (after all parent+block transforms inverted)
- xp, yp: coordinate system of the parent container
- xs, ys: scene coordinate system (root of scene graph, after camera inverse, before block transforms)
- xc, yc: coordinate system of the enclosing canvas buffer
- xw, yw: coordinate system of the browser / window (CSS pixels)

Widths are denoted using dx, using the same coordinate system convention (dxl, dxp, dxc, dxw).
Heights are similarly denoted using dy (dyl, dyp, dyc, dyw).

## Dimensions

- Use `dx*` for horizontal extents (width-like values).
- Use `dy*` for vertical extents (height-like values).
- Use `du*` for scalar dimensions that can apply in both directions (radius, spacing, padding, stroke thickness, corner size, etc.).

Examples:
- `dxp`, `dyp`: size in parent coordinates.
- `duRadius`, `duPadding`, `duSpacing`, `duBorderWidth`.

## Unitless numbers

- Unitless numeric intermediates should NOT use geometric prefixes (`x*`, `y*`, `dx*`, `dy*`, `du*`).
- Use conventional math names for unitless values.

Examples:
- `cos`, `sin`, `det`, `invDet`, `t`, `scale`.

## Colors

- All color properties, fields, and variables must start with `col`.

Examples:
- `colText`, `colBorder`, `colBg`, `colTrackFill`, `colThumbStroke`.

## Booleans

- All boolean variables, properties, and fields must start with `f`.

Examples:
- `fVisible`, `fEnabled`, `fChecked`, `fHovered`, `fAutoPlay`.

## Strings

- All user-facing strings must start with `st`.
- This applies to user-visible labels, titles, placeholders, and displayed text.

Examples:
- `stLabel`, `stTitle`, `stPlaceholder`, `stText`, `stDefault`.

## GUI props convention

- Public GUI size props should use `dx` and `dy`.
- Public GUI layout/content spacing props should use `duSpacing` and `duPadding`.
- Do not introduce new user-facing `width`/`height` fields in GUI APIs.

## Function names

- Functions returning `Rs` must start with `rs`.

## `Rs` values

- Variables whose value type is `Rs` must start with `rs`.

Examples:
- `rsControl`, `rsStack`, `rsGrid`.
- `rsChild`, `rsPanel`, `rsContent`.

## Exceptions

- Keep platform/system type names unchanged (DOM, Canvas, browser APIs), e.g. `window.innerWidth`, `HTMLCanvasElement.width`, `CanvasRenderingContext2D` APIs.
- Internal strings that are not user-facing should NOT use the `st` prefix (for example ids, class names, enum discriminator values, keys).
