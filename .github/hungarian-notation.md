# Hungarian Notation

## Geometric variables

All variables denoting coordinates should include the coordinate system they refer to
- xl, yl: local coordinate system of an object
- xp, yp: coordinate system of the parent container
- xc, yc: coordinate system of the enclosing canvas
- xw, yw: coordinate system of the browser / window

Widths are denoted using dx, using the same coordinate system convention (dxl, dxp, dxc, dxw).
Heights are similarly denoted using dy (dyl, dyp, dyc, dyw).

## Dimensions

- Use `dx*` for horizontal extents (width-like values).
- Use `dy*` for vertical extents (height-like values).
- Use `du*` for scalar dimensions that can apply in both directions (radius, spacing, padding, stroke thickness, corner size, etc.).

Examples:
- `dxp`, `dyp`: size in parent coordinates.
- `duRadius`, `duPadding`, `duSpacing`, `duBorderWidth`.

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
- Legacy `width`/`height` may be accepted only as temporary compatibility aliases.
- Do not introduce new user-facing `width`/`height` fields in GUI APIs.

## Exceptions

- Keep platform/system type names unchanged (DOM, Canvas, browser APIs), e.g. `window.innerWidth`, `HTMLCanvasElement.width`, `CanvasRenderingContext2D` APIs.
- Internal strings that are not user-facing should NOT use the `st` prefix (for example ids, class names, enum discriminator values, keys).
