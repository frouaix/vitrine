# Plan: Render Blocks To PDF

## Problem statement

Vitrine currently renders an immediate-mode block tree to Canvas 2D. We want a PDF export path that lets applications reuse the same block DSL to produce printable, shareable, deterministic output without re-implementing their UI in a second document-specific system.

The exported result must be suitable for real documents, not just screenshots. That means we need to preserve vector quality where possible, support text with stable pagination, and define clear behavior for blocks and runtime features that do not map naturally to static PDF output.

## Goals

1. Allow any app that relies on the Vitrine block tree to export a block tree to PDF.
1. Preserve Vitrine's existing authoring model: users describe a block tree, then choose a renderer target.
1. Keep output deterministic for the same scene, page settings, and asset set.
1. Prefer vector output for primitives, paths, lines, and text where practical.
1. Support single-page and multi-page document generation.
1. Make page size, margins, scaling, and pagination explicit rather than implicit.
1. Define a clear compatibility contract for blocks and props that are partially supported or unsupported in PDF.

## Non-goals

1. Reproducing every browser canvas behavior bit-for-bit in PDF.
1. Exporting interactive event handlers, hover state, drag logic, or runtime pointer behavior.
1. Preserving animation over time in the PDF itself.
1. Building a full document-layout engine from scratch before shipping an initial export API.
1. Supporting every CSS-like paint capability on day one, especially features that have no direct PDF equivalent.

## Constraints from the current architecture

1. Vitrine is immediate-mode. The visual tree is described fresh each render rather than retained.
1. The current engine is centered around `ImmediateRenderer` and a Canvas-2D-style drawing context.
1. Transforms are hierarchical and already expressed as affine matrices, which is a good fit for PDF graphics state operations.
1. Some blocks depend on measurement during render, especially `Text`, `Texta`, and `ContentSized` wrappers that rely on measured child bounds.
1. Event handling and hit testing are irrelevant to the final PDF, but some render-time caches may still be useful to compute exact layout.
1. Images, fonts, wrapping, clipping, and text metrics are the hardest cross-target fidelity areas.

## Proposed architecture

### High-level shape

Introduce a second rendering backend rather than trying to serialize the current canvas implementation.

Recommended structure:

1. `PdfDocumentRenderer`
1. `PdfRenderContext`
1. `PdfPaginationEngine` or a smaller pagination coordinator owned by the renderer
1. `PdfAssetRegistry` for fonts and images
1. `PdfExportOptions` / `PdfPageOptions` / `PdfRenderResult`

The important decision is that PDF should be a first-class rendering target, not a canvas screenshot path.

### Renderer responsibilities

`PdfDocumentRenderer` should:

1. Accept a root block tree and PDF export options.
1. Own page creation, page transforms, pagination, and document finalization.
1. Traverse blocks similarly to `ImmediateRenderer`, but emit PDF drawing commands instead of canvas commands.
1. Reuse the same transform conventions and alignment semantics where possible.
1. Maintain a per-render layout cache for measured blocks, similar in spirit to the current hit-test/layout cache.

### Context abstraction

Add a dedicated PDF drawing context rather than forcing `Canvas2DContext` to grow PDF-specific behavior.

Recommended API direction:

1. Keep a small shared drawing contract where it is genuinely target-agnostic.
1. Let `ImmediateRenderer` continue to depend on the canvas context implementation.
1. Let `PdfDocumentRenderer` depend on a PDF-native context optimized for document output.

Reasoning:

1. Canvas and PDF are similar enough for primitives and transforms.
1. They diverge materially on text, images, clip state, pagination, and serialization lifecycle.
1. Forcing one context interface to cover both too early will either leak PDF concerns into canvas or encode canvas assumptions into PDF.

### Backend choice

We need one concrete PDF writer implementation underneath `PdfRenderContext`.

Practical options:

1. Use a mature PDF library and adapt Vitrine drawing calls onto it.
1. Build a minimal in-house PDF writer.

Recommendation:

1. Start with a mature library unless there is a strong constraint against it.
1. Wrap it behind a thin internal adapter so Vitrine owns the public export API, not the vendor surface.

Decision criteria:

1. Font embedding support.
1. Text measurement options.
1. Image embedding support.
1. Browser and Node compatibility requirements.
1. Bundle size impact for browser-side export.
1. License compatibility.

## Rendering model design

### Scene-to-document mapping

Define PDF export as rendering a scene into one or more pages using an explicit viewport model.

Each export should specify:

1. Page size.
1. Margins or printable content box.
1. Units.
1. A scaling mode.
1. Pagination strategy.
1. Background policy.

Recommended coordinate model:

1. Keep Vitrine world units as author units.
1. Apply a single root transform from scene coordinates into page content coordinates.
1. Treat each page as a clipped content box with its own origin.

### Pagination strategies

PDF export cannot assume one page forever. Pagination must be an explicit strategy.

Candidate modes:

1. `single-page-fit`
2. `single-page-scale-1`
3. `paginate-vertical`
4. `paginate-horizontal`
5. `paginate-both`
6. `custom`

Recommended initial scope:

1. `single-page-fit`
1. `single-page-scale-1`
1. `paginate-vertical`

This gives a viable MVP for dashboards, reports, and long documents without immediately solving every large-canvas scenario.

### Multi-page behavior

For paginated modes we need a clear slicing rule.

Recommended approach for v1:

1. Render the same root scene into each page with a page-local clip.
1. Offset the root transform for the visible page slice.
1. Do not automatically reflow block layout between pages.

Implication:

1. Pagination is viewport slicing, not semantic document layout.
1. This keeps Vitrine aligned with its existing immediate-mode model.
1. If semantic document flow is needed later, that should be a higher-level package or DSL layer.

## Block support strategy

### Expected support by block type

Likely straightforward:

1. `Rectangle`
1. `Circle`
1. `Ellipse`
1. `Line`
1. `Path`
1. `Group`
1. `Layer`
1. `ContentSized`

Likely medium complexity:

1. `Text`
1. `Texta`
1. `Image`
1. `Arc`
1. clipping
1. opacity
1. transforms

Needs explicit policy:

1. `Portal`
1. patterns and gradients if they exist in the broader style model
1. browser-native image objects not available in Node
1. any runtime-only convenience that relies on DOM measurement or asynchronous asset state

### Portal semantics

Critical decision:

1. Preserve portal rendering order semantics exactly.
1. Disallow portals in PDF export.
1. Flatten portals before render.

Recommendation:

1. Preserve portal semantics if possible by collecting portal children and rendering them in the same order as the canvas renderer.
1. If that becomes complex, explicitly document partial support rather than silently changing draw order.

## Text and font design

Text is the highest-risk area for PDF fidelity.

### Text measurement

We must decide whether PDF export:

1. Reuses current canvas/browser measurement.
1. Uses the PDF backend's text metrics.
1. Uses a shared Vitrine text measurement abstraction.

Recommendation:

1. Move toward a shared measurement abstraction used by both canvas and PDF renderers.
1. Do not rely on browser canvas metrics if Node-side export must be supported.

Why this matters:

1. Wrapping, alignment, and page breaks depend on stable measurement.
1. If canvas and PDF use different metrics, exported output will shift.
1. `Texta` and `ContentSized` already expose the cost of inconsistent measurement paths.

### Font handling

Critical decisions before implementation:

1. How are fonts registered for export.
1. Whether font embedding is required or optional.
1. What happens when a requested font is unavailable.
1. Whether browser and Node use the same font registration API.

Recommended design:

1. Introduce a `PdfFontRegistry` or generic asset registry.
1. Require explicit font registration for non-standard fonts.
1. Support fallback chains.
1. Fail loudly or warn loudly when falling back, depending on export strictness mode.

Suggested strictness modes:

1. `strict`: throw on missing assets or unsupported font references.
1. `warn`: continue with fallbacks and return warnings.

### Texta

`Texta` needs a dedicated export path, not just plain text dumping.

Requirements:

1. Preserve run-level styling.
1. Preserve wrapping and line metrics.
1. Preserve fill, stroke, opacity, background runs where supported.
1. Clearly define unsupported style properties up front.

Recommended principle:

1. Only support features we can measure and emit deterministically.
1. Narrowing style support is acceptable if it is explicit and documented.

## Images and assets

### Image sourcing

Critical decision:

1. What forms of image source are legal for PDF export.

Likely source types:

1. URL string
1. data URL
1. binary buffer / Uint8Array
1. HTMLImageElement or ImageBitmap in browser contexts

Recommendation:

1. Normalize image inputs into a PDF asset registry before render.
1. Resolve all async asset loading before page emission begins.
1. Return a deterministic export error if an image is missing or unresolved.

### Asset preflight

Add a preflight step that:

1. walks the block tree
1. collects referenced images and fonts
1. validates that required assets are loadable
1. returns a list of warnings or failures before the document is written

This avoids failing halfway through a multi-page export.

## Styles, paint, and graphics state

We need explicit support tables for the following properties:

1. fill
1. stroke
1. strokeWidth
1. opacity
1. clip
1. shadows if any are used
1. gradients/patterns if supported elsewhere

Recommendation for v1:

1. Support solid-color fill and stroke.
1. Support opacity through graphics state.
1. Support clip rectangles first, arbitrary clip paths later.
1. Defer shadows, patterns, and advanced paint until after core text/image export is stable.

## Export API proposal

Suggested top-level API shapes:

```ts
export interface PdfExportOptions {
	page: PdfPageOptions;
	pagination?: PdfPaginationOptions;
	assets?: PdfAssetOptions;
	strictness?: 'strict' | 'warn';
	background?: 'transparent' | 'white' | { fill: string };
}

export interface PdfPageOptions {
	size: 'A4' | 'Letter' | { width: number; height: number };
	margin?: number | { top: number; right: number; bottom: number; left: number };
	unit?: 'pt' | 'mm' | 'in' | 'px';
}

export interface PdfPaginationOptions {
	mode: 'single-page-fit' | 'single-page-scale-1' | 'paginate-vertical';
	scale?: number;
}

export interface PdfRenderWarning {
	code: string;
	message: string;
	blockType?: BlockType;
}

export interface PdfRenderResult {
	data: Uint8Array;
	pageCount: number;
	warnings: PdfRenderWarning[];
}

export function renderToPdf(scene: Block, options: PdfExportOptions): Promise<PdfRenderResult>;
```

Notes:

1. Return bytes, not a side effect.
1. Include warnings in the result instead of hiding degradations.
1. Keep page and pagination config explicit.

## Implementation phases

### Phase 0: design lock

Before code starts, lock the following:

1. backend library choice
1. browser vs Node support target for v1
1. font registration model
1. pagination modes in scope
1. strictness and warning policy
1. supported block/style matrix for v1

### Phase 1: document skeleton

1. Create the export package or core module location.
1. Define `PdfExportOptions`, page config, and result types.
1. Introduce the PDF backend adapter and document lifecycle.
1. Render empty documents and simple page backgrounds.

### Phase 2: primitives and transforms

1. Add transform stack support.
1. Add rectangle, circle, ellipse, line, path, and arc rendering.
1. Add fill, stroke, stroke width, opacity, and clip rectangle.
1. Add page content-box transform mapping.

### Phase 3: text

1. Implement `Text` rendering and measurement.
1. Define and implement font registration.
1. Support wrapping, alignment, and baseline semantics.
1. Validate against current canvas behavior on representative examples.

### Phase 4: texta

1. Implement run-based `Texta` export.
1. Reuse a shared measurement pipeline where possible.
1. Support backgrounds, fill, stroke, line height, wrapping, and alignment.
1. Validate on markdown and texta demos.

### Phase 5: images and assets

1. Implement asset preflight.
1. Add image embedding.
1. Validate Node and browser source forms.

### Phase 6: pagination and polish

1. Implement `single-page-fit` and `paginate-vertical`.
1. Add warnings for clipped or unsupported content.
1. Produce end-to-end examples and docs.

## Validation plan

We need more than unit tests. PDF export needs structural and visual confidence.

Recommended validation layers:

1. unit tests for transform mapping, pagination math, style mapping, and option parsing
1. golden or snapshot tests for PDF structure where stable enough
1. rasterized visual regression tests for exported PDFs on representative scenes
1. example-driven manual validation using existing demos: primitives, text, texta, markdown, tables
1. deterministic byte-or-structure tests for simple cases where backend output is stable

## Risks

### Measurement drift

Canvas and PDF text metrics may not match exactly. This can break wrapping, alignment, `ContentSized`, and multi-page slicing.

Mitigation:

1. centralize measurement logic
1. require explicit font registration
1. use the same measurement source for export layout and export draw

### Unsupported paint features

Advanced fills or effects may not map cleanly.

Mitigation:

1. publish a support matrix
1. return warnings on degradation
1. keep v1 scope intentionally narrow

### Async asset loading

Images and fonts may not be ready at export time.

Mitigation:

1. explicit preflight
1. strict/warn modes
1. no implicit background loading during final write

### Browser and Node divergence

If export must run in both environments, asset access and measurement strategies diverge quickly.

Mitigation:

1. decide environment scope before implementation
1. isolate environment-specific adapters behind the same export API

## Critical decisions to take before starting

These need answers before implementation begins, because they change the shape of the system rather than just the details.

1. Is v1 browser-only, Node-only, or both?
1. Which PDF backend library will be used?
1. Is vector fidelity mandatory for all primitives, or is selective raster fallback acceptable?
1. Is pagination viewport slicing only, or do we want semantic reflow in v1?
1. What is the font registration and embedding model?
1. What is the missing-asset policy: fail, warn, or fallback?
1. Which block types are guaranteed supported in v1, and which are explicitly unsupported?
1. Are portals preserved semantically or banned from PDF export?
1. What advanced paint features are in scope for v1?
1. Do we require byte-stable output for CI snapshots, or only visually stable output?

## Open issues

1. Page units need to be normalized against Vitrine's scene units without surprising users.
1. We need a documented story for exporting content larger than a page in both axes.
1. Text baseline behavior must be validated against the chosen backend, especially for mixed fonts and `Texta` runs.
1. Image decoding and embedding may require different code paths in browser and Node.
1. `ContentSized` and any future measurement-driven blocks need an export-time layout cache strategy.
1. Table-heavy and markdown-heavy exports may expose pagination gaps quickly.
1. The package boundary is not decided yet: core package addition versus separate PDF package.

## Recommended starting decision set

If we want the fastest path to a usable first version, the recommended decisions are:

1. v1 supports both Node and browser only if the backend can do so cleanly; otherwise ship Node first.
1. pagination is viewport slicing, not semantic reflow.
1. v1 supports primitives, text, texta, images, groups, layers, and content-sized blocks.
1. v1 supports solid-color paint, opacity, transforms, and rectangle clipping.
1. missing fonts and images are warnings in default mode and errors in strict mode.
1. non-standard fonts require explicit registration.
1. advanced paint and shadows are deferred.
1. portals are supported only if ordering semantics can be preserved without special-case complexity; otherwise explicitly reject them in v1.

## Deliverables

1. PDF export API and public docs.
1. Asset registration and preflight flow.
1. Reference examples covering single-page, multipage, text-heavy, and image-heavy scenes.
1. Validation tests for transform mapping, pagination, and visual correctness.
1. A published compatibility matrix for supported blocks and props.

