# Vitrine Layout & Pagination

`vitrine-layout-pagination` is a renderer-agnostic package for describing document-like layout trees and turning them into paginated results.

It exists to solve two related problems:

1. **Presentation pages** — explicit slide/page sequences with fixed geometry or aspect ratio for browser previews.
2. **Flow documents** — semantic document content that should paginate across pages instead of being sliced arbitrarily by viewport.

The package does **not** render to canvas or PDF directly. Instead, it produces a paginated model that other layers can preview or export.

## Package architecture

The code is split into three model files plus an engine:

| File | Responsibility |
| --- | --- |
| `src/common.ts` | Shared node types, geometry/inset types, break policies, and layout-node typing helpers |
| `src/flow.ts` | Top-level document modes: flow documents and presentation documents |
| `src/pagination.ts` | Page specs, resolved page geometry, fragments, pages, diagnostics, and pagination results |
| `src/measure.ts` | Measurement contracts for custom/measured content |
| `src/engine.ts` | Validation, document preparation, and the current MVP pagination/layout algorithm |

## Document modes

### 1. Presentation documents

Presentation documents are explicit page sequences:

- each slide is already a page
- page geometry is fixed
- preview scaling is a display concern, not a layout concern

Use this mode for browser-authored slide decks or other page-by-page experiences.

### 2. Flow documents

Flow documents are semantic content trees:

- content is laid out into a page body region
- pages may repeat background/header/footer/foreground artifacts
- the engine decides where page breaks occur

Use this mode for markdown-like or document-like content that should paginate meaningfully.

## Layout node model

The node typing pattern mirrors core Vitrine block typing:

1. `LayoutNodeType` is the discriminant enum
2. `LayoutNodePropsByType` maps each node kind to its prop shape
3. `LayoutNodeForType<T>` produces one concrete node shape
4. `LayoutNode` is the mapped discriminated union over all node types

This gives the same benefits as core `BlockType` / `BlockPropsByType`:

- exhaustive switching on `kind`
- precise per-node props
- strongly typed `LayoutNodeOfType<T>`
- a consistent mental model across packages

Core node kinds currently supported:

- `stack`
- `box`
- `spacer`
- `pageBreak`
- `text`
- `table`
- `measured`
- `fixed`

## Core concepts

### Page spec

`PageSpec` defines authored page geometry:

- `width`
- `height`
- `unit`
- optional `margins`

`resolvePageSpec(...)` turns that into a `ResolvedPageSpec` with an explicit `contentBox`.

### Fragments

Pagination output is fragment-based:

- a fragment belongs to a page
- a fragment has a `rect`
- a fragment may be associated with a `nodeId`
- a fragment may represent a repeated page artifact (`header`, `footer`, etc.)

This fragment model is the bridge between semantic layout and future preview/export adapters.

### Measurement

Measured content is delegated through `LayoutMeasureDelegate`:

- the engine supplies available width/height and current page geometry
- the delegate returns intrinsic size and optional render data

This keeps the package renderer-agnostic while still allowing text, tables, and custom content to participate in layout.

## Current engine behavior

The current `PaginatedLayoutEngine` is intentionally an MVP.

### Preparation phase

`prepareLayoutDocument(...)`:

1. validates the document
2. resolves page geometry
3. normalizes document shape into a prepared form used by layout

### Presentation path

For `kind: 'presentation'`:

1. each slide becomes exactly one page
2. page geometry is copied from the resolved page spec
3. optional background/foreground artifacts are injected per page

This path is simple because page boundaries are explicit in the authored model.

### Flow path

For `kind: 'flow'`:

1. the engine measures optional header and footer nodes
2. it reserves those heights from the page content box to form the page `bodyBox`
3. it traverses the body tree vertically
4. it emits fragments into pages
5. it inserts repeated background/header/footer/foreground artifacts on each page

## Current core algorithms

### 1. Text height estimation

The engine currently estimates text height using:

- `fontSize`
- `lineHeight`
- a simple character-per-line heuristic based on available width

This is intentionally lightweight. It is good enough for the current MVP and can later be replaced or augmented by a richer text measurement integration.

### 2. Vertical stack layout

`stack` is the main flow primitive today:

1. apply stack padding
2. lay out children top-to-bottom
3. insert `gap` between children
4. accumulate child heights to advance the vertical cursor

This is the main algorithm for markdown-like flow content right now.

### 3. Box sizing

`box` computes height as:

1. child height
2. plus top/bottom padding
3. then clamped by optional `minHeight` / `maxHeight`
4. or overridden by explicit `height`

In the current engine, `box` behaves like a contained vertical block in the flow.

### 4. Page breaking

Current page breaking is deliberately simple:

1. compute the next node’s total estimated height
2. compare it with remaining space in the current page `bodyBox`
3. if it does not fit, advance to the next page
4. if a node exceeds the full body height of a page, emit a diagnostic
5. explicit `pageBreak` nodes always force a new page
6. `breakBefore: 'page'` and `breakAfter: 'page'` are respected

This gives deterministic pagination without yet implementing advanced fragmentation.

### 5. Repeated page artifacts

Flow documents may define:

- `background`
- `header`
- `footer`
- `foreground`

The engine injects these per page in two phases:

1. start-of-page artifacts (`background`, `header`)
2. end-of-page artifacts (`footer`, `foreground`)

That preserves a sensible layering order relative to body fragments.

## Diagnostics

The engine emits `PaginationDiagnostic` entries for layout conditions that need attention, such as:

- missing measurement delegates for measured/table nodes
- nodes taller than a page body region
- other pagination anomalies

Diagnostics are part of the public result so adapters and applications can surface or inspect them.

## Current limitations

This is still an MVP engine. It does **not** yet provide:

- rich inline/text fragmentation
- widow/orphan control
- keep-with-next / avoid-break-inside enforcement beyond type-level support
- table-specific pagination behavior
- automatic Vitrine rendering adapters in this package
- PDF output
- semantic markdown parsing or markdown-to-layout conversion

## Example

```ts
import {
  createPaginatedLayoutEngine,
  type LayoutDocument
} from 'vitrine-layout-pagination';

const document: LayoutDocument<'title' | 'body'> = {
  kind: 'flow',
  id: 'doc-1',
  page: {
    width: 612,
    height: 792,
    unit: 'pt'
  },
  body: {
    kind: 'stack',
    gap: 16,
    children: [
      {
        kind: 'text',
        id: 'title',
        text: 'Hello'
      },
      {
        kind: 'text',
        id: 'body',
        text: 'Paginated content'
      }
    ]
  }
};

const engine = createPaginatedLayoutEngine();
const result = engine.layout(document);
```

## Intended next steps

Likely next areas of work:

1. richer flow fragmentation
2. stronger measurement integration for text/texta/tables
3. preview adapters for Vitrine block trees
4. semantic markdown/document builders
5. PDF export integration based on the paginated result
