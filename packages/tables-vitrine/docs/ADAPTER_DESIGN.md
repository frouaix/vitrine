# Vitrine Tables Adapter

## Purpose

`vitrine-tables-adapter` binds `vitrine-tables` contracts to Vitrine block output while keeping `vitrine-tables` itself renderer-agnostic.

## What this package provides

1. `createVitrineTableCellMeasurer(...)`
2. `createVitrineTableRenderDelegate(...)`
3. `buildVitrineBlocksFromTableLayout(...)`

## Design notes

1. Cell content shape is `VitrineTableCellContent` with `blocks: Block[]`.
2. Intrinsic measurement is delegated to caller via optional callback; fallback can be embedded in cell content.
3. Render delegate returns Vitrine `group(...)` blocks positioned by `TableCellLayout`.
4. `buildVitrineBlocksFromTableLayout` stitches per-cell delegate output into a root group for scene integration.

## Intentional limits (phase 1)

1. No automatic text measurement adapter yet.
2. No virtualization.
3. No span-overlap diagnostics.
