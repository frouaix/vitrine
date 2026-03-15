# Tables Package Design

## Scope

`vitrine-tables` provides a table data model and layout contracts.

It does not perform canvas drawing directly. Rendering is delegated through adapter interfaces so Vitrine core (or other renderers) can consume computed table geometry.

## Requirements Baseline

1. Model only table structure and layout constraints.
2. Support typical table layout degrees of freedom.
3. Allow each cell content to be a Vitrine core tree.
4. Define an extensibility model so Vitrine core can delegate sizing and positioning logic.

## Non-Goals (Initial Phase)

1. No direct markdown parsing in this package.
2. No direct dependency on Canvas2D or WebGL context APIs.
3. No opinionated visual theme defaults.

## Core Model

The package centers on `TableModel<TCellContent>` with:

1. `columns`: sizing directives (`auto`, `fixed`, `minmax`) and width constraints.
2. `header`, `body`, `footer`: row/cell sections.
3. Cell coordinates (`row`, `col`) and spans (`rowSpan`, `colSpan`).
4. Box model values (`padding`, `border`) for per-cell layout impact.

Cell content type is generic (`TCellContent`). In Vitrine usage, this can be instantiated as a block-tree payload.

## Layout Extensibility

The key extension points are:

1. `TableCellMeasurer<TCellContent>`
2. `TableLayoutEngine<TCellContent>`
3. `TableRenderDelegate<TCellContent, TRenderNode>`

`TableCellMeasurer` isolates intrinsic measurement logic (min/max width and min height) from table-level distribution logic.

`TableLayoutEngine` computes final frames for columns, rows, and cells under constraints (`availableWidth`, optional `availableHeight`).

`TableRenderDelegate` maps cell content and computed cell frame to renderer-native nodes.

This separation allows Vitrine core to own rendering while delegating table sizing/positioning to `vitrine-tables`.

## Integration Shape with Vitrine Core

Planned integration in core renderer pipeline:

1. Construct `TableModel<BlockTreePayload>` from higher-level source (for example markdown table AST).
2. Provide a Vitrine-specific measurer that measures intrinsic cell content sizes.
3. Run `TableLayoutEngine.layout(...)` to get `TableLayoutResult`.
4. For each cell layout frame, invoke `TableRenderDelegate.renderCell(...)` to produce block subtrees.
5. Compose resulting cell subtrees into the scene graph.

The table package remains reusable because it does not import Vitrine types directly.

## Initial Layout Algorithm Direction

Start with a deterministic two-pass algorithm:

1. Intrinsic pass: measure all cells and aggregate per-column min/max requirements.
2. Distribution pass: solve final column widths within available width.
3. Row pass: compute row heights from placed cell content and spans.
4. Placement pass: emit absolute frames for columns, rows, and cells.

## Reference Engine (Current)

`src/engine.ts` contains `ReferenceTableLayoutEngine`, a deterministic baseline implementation.

Current behavior:

1. Computes intrinsic requirements from all cells via `TableCellMeasurer`.
2. Supports `colSpan` and `rowSpan` by distributing intrinsic requirements over spanned tracks.
3. Applies column constraints (`minWidth`, `maxWidth`, and `fixed` `px` widths).
4. Distributes extra width in two steps: `fr` tracks first, then non-fixed flexible tracks.
5. Produces absolute geometry for columns, rows, and cells in `TableLayoutResult`.

Current limits (expected for this phase):

1. No percentage width units yet.
2. Overflow policy is host-managed (layout can exceed available width).
3. No diagnostics object yet for invalid span overlap; input is assumed valid.

## Deterministic Fixture

`src/__fixtures__/reference-layout-fixture.ts` provides a deterministic sample model and measurer for quick verification:

1. `createReferenceLayoutFixtureModel()`
2. `createReferenceLayoutFixtureMeasurer()`
3. `runReferenceLayoutFixture(availableWidth?)`
4. `assertReferenceLayoutFixture(result)`

The fixture validates core expectations (fixed-width column behavior and `colSpan` width aggregation) and acts as a stable baseline while the engine evolves.

For overflow cases, support policy options in later iterations:

1. Horizontal overflow (scroll/pan handled by host scene).
2. Width clamping and reflow.
3. Ellipsis or clipping policies delegated to content renderer.

## Open Design Questions

1. Should column sizing support percentage units in addition to `px`, `fr`, `auto`?
2. Should row virtualization be in this package or host-level?
3. How should span conflict resolution be reported (throw vs diagnostics object)?
4. Should constraints include writing mode (LTR/RTL) now or later?

## Milestones

1. M1: Stable model and interfaces (current phase).
2. M2: Reference layout engine implementation.
3. M3: Vitrine adapter (measurer + render delegate).
4. M4: Markdown table integration in demo.
