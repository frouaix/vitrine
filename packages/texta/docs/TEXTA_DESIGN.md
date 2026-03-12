# Attributed Text

## Goals

1. Support efficient attributed text in core language
1. Data model based on character attributes with decent memory efficiency
1. Support text selection using pointer, with simple copy/paste within the same tree
1. Extensible data model, supporting fonts and colors but also arbitrary properties

## Principles

1. Not a markup approach
1. Styling is index-aligned metadata, not inline markup: each text unit has a style reference id, and ids resolve through a scoped style dictionary. Public APIs should index by grapheme cluster (user-visible characters); internal storage may map those indices to UTF-16 offsets.

## Draft Review Comments

1. Rendering should be described as run-based (merge adjacent characters with same style key), then line layout on runs.

## Implementation Plan (Architecture Notes)

### 1) Data Model

Define an attributed-text value as three coordinated parts:

1. `strText`: logical text content.
1. `rgIdStyleRef`: per-index style reference stream, aligned with `strText` indexing unit.
1. `mpId_StyleEntry`: map from style reference id to style property set.

Proposed shape (conceptual, not code):

Naming convention used in this design note:

1. Maps/dictionaries: `mpKey_Value` (for example `mpId_StyleEntry`).
1. Ranges/arrays/enumerations: `rg*` (for example `rgIdStyleRef`, `rgMode`).
1. Indices/iterators: `i*` (for example `iStart`, `iEnd`, `iCur`).

1. `AttributedTextValue`
1. `iVersion`: monotonically increasing integer for cache invalidation.
1. `rgUnits`: `"grapheme" | "codePoint"` (recommended: `"grapheme"`).
1. `rgStorageMode`: `"fastCodeUnit" | "fastCodePoint" | "segmentedGrapheme"`.
1. `strText`: raw UTF-16 JS string.
1. `rgSegGraphemeToUtf16`: optional cached segmentation table from JS indices to logical units.
1. `rgIdStyleRef`: compact array-like structure (`Uint16Array`/`Uint32Array` or compact string encoding).
1. `mpId_StyleEntry`: table of `StyleEntry` objects keyed by numeric id.
1. `idStyleDefault`: required fallback style id.

`StyleEntry` should support both known and extensible fields:

1. Known core props: `fontFamily`, `fontSize`, `fontWeight`, `fontStyle`, `lineHeight`, `letterSpacing`, `fill`, `stroke`, `opacity`, `underline`, `strikethrough`.
1. Open extension bag: `mpProp_Custom: Record<string, unknown>`.
1. Normalized form for equality: canonical key order and canonical values (for interning and hashing).

### 2) Character Encoding and Indexing Policy

Recommendation:

1. Store text in JS UTF-16 string.
1. Expose attributed-text APIs in grapheme-cluster indices.
1. Maintain a segmentation cache mapping grapheme index to UTF-16 start/end offsets.

Fast-path representation requirement:

1. Support two optimized modes when every grapheme cluster is trivially 1:1 with a lower-level unit.
1. `fastCodeUnit`: every grapheme is exactly one UTF-16 code unit (typical ASCII/BMP-without-combining cases).
1. `fastCodePoint`: every grapheme is exactly one Unicode code point (allows surrogate pairs, but disallows combining/ZWJ/regional-indicator clusters).
1. `segmentedGrapheme`: general mode for complex grapheme clusters.

Mode invariants:

1. In `fastCodeUnit`, `iGrapheme == iUtf16` for all boundaries.
1. In `fastCodePoint`, `iGrapheme == iCodePoint` for all boundaries.
1. In `segmentedGrapheme`, boundaries are resolved via `rgSegGraphemeToUtf16` / `mpIGrapheme_RgUtf16`.

Mode transitions (edit-time):

1. Start in the cheapest valid mode (`fastCodeUnit` preferred, else `fastCodePoint`, else `segmentedGrapheme`).
1. On insert/replace, validate only the changed slice plus small neighbor context.
1. If invariants break, promote once to the next required mode:
1. `fastCodeUnit` -> `fastCodePoint` when surrogate pairs appear but still one code point per grapheme.
1. `fastCodeUnit` or `fastCodePoint` -> `segmentedGrapheme` when combining marks, ZWJ sequences, flags, or similar complex clusters appear.
1. Promotion cost is accepted as edit-local overhead; read/render paths remain fast between promotions.

Demotion policy (optional):

1. Do not demote automatically on every edit (avoids churn).
1. Optionally run lazy/full recompute to demote when profitable.

Why this is recommended:

1. Pointer selection and caret motion should match user-visible characters.
1. Styling ranges over grapheme units avoids splitting a visible character.
1. Rendering pipeline can still consume UTF-16 slices after translating grapheme ranges to string offsets.

Fallback option:

1. Code-point indexing is simpler than grapheme indexing but still fails for combining sequences.
1. UTF-16 code-unit indexing should be avoided for public APIs.

### 2.1) Code Point vs Grapheme Cluster (With Examples)

Quick definitions:

1. Code point: a single Unicode scalar value (for example `U+0061` for `a`, `U+1F600` for `grinning face`).
1. Grapheme cluster: what a user typically sees as one character on screen, which may contain multiple code points.

Why this matters:

1. Code-point indexing avoids UTF-16 surrogate-pair corruption.
1. Grapheme indexing matches user-visible cursor movement, selection, delete/backspace, and style ranges.

Examples comparison:

| Sample | Composition | Code points | Grapheme clusters | If indexed by code point | If indexed by grapheme |
| --- | --- | ---: | ---: | --- | --- |
| `a` | Basic Latin letter | 1 | 1 | Same behavior as grapheme | Same behavior as code point |
| `😀` | Single emoji (`U+1F600`) encoded as surrogate pair in UTF-16 | 1 | 1 | Works correctly | Works correctly |
| `x̄` | `x` + combining macron (`U+0304`) | 2 | 1 | Caret/style can split base and diacritic | Treated as one visible character |
| `🇫🇷` | Regional indicator pair | 2 | 1 | Delete may remove half-flag | Delete removes full flag |
| `👨‍👩‍👧‍👦` | Multiple emoji joined with ZWJ | Multiple | 1 | Style/caret can land on internal joiners | Entire sequence handled as one unit |
| `क्ष` | Devanagari conjunct sequence | Multiple | Typically 1 | Cursor movement can feel unnatural | Cursor movement matches visible unit |

Practical implications for our APIs:

1. Public selection and style ranges should be grapheme-based.
1. Internal storage may still be UTF-16 text for compatibility/performance.
1. We need a segmentation map:
1. `mpIGrapheme_RgUtf16` (`iGrapheme` -> UTF-16 start/end offsets).
1. Optional reverse map for hit-testing and caret placement.
1. In fast modes, segmentation lookups can be skipped entirely and replaced with direct arithmetic.

Rule of thumb:

1. If an operation should match what users see, use grapheme clusters.
1. If an operation is low-level text storage or interop, use UTF-16 offsets internally.
1. Code-point indexing is an improvement over code units, but still not sufficient for editor-grade UX.

### 3) Managing Property Dictionary Entries

Dictionary strategy:

1. Keep style ids stable for the value lifetime.
1. Add entry on first use of a normalized style set.
1. Reuse existing id when an equivalent style set already exists.
1. Track reference counts per style id for optional compaction/GC.

Is hash-consing necessary?

1. Not strictly necessary for first version if values are small.
1. Recommended for medium/large values because style sets repeat frequently and deduplication directly reduces memory and improves run merging.
1. Practical recommendation: use lightweight interning from day one (hash-consing of normalized style sets), with periodic cleanup of unreferenced entries.

Suggested intern flow:

1. Normalize proposed style object (`styleNormalized`).
1. Compute stable hash/fingerprint (`sHash`).
1. Lookup candidate ids by hash (`mpHash_rgIdStyleCandidate`).
1. Resolve collisions via structural equality.
1. Return existing id or insert new `StyleEntry`.

### 4) Theming Transformation (Semantic -> Rendering)

Goal:

1. Represent theming as a pure transformation from symbolic attributed text to rendering attributed text.
1. Keep semantic intent stable while allowing multiple visual themes.

Two-layer model:

1. `AttributedTextValueSemantic`: style entries contain symbolic properties (for example `token = "heading"`, `emphasis = "strong"`, `state = "disabled"`).
1. `AttributedTextValueRender`: style entries contain concrete rendering properties (for example `fontFamily`, `fontSize`, `fontWeight`, `fill`, `opacity`).

Theme mapping objects:

1. `mpToken_StylePatch`: maps semantic tokens to rendering style patches.
1. `mpState_StylePatch`: maps interaction/context states to rendering style patches.
1. `mpVariant_StylePatch`: optional per-component variant patches.

Transformation contract:

1. Input: `AttributedTextValueSemantic` + theme mapping tables + optional context.
1. Output: `AttributedTextValueRender` with the same `strText` and grapheme boundaries.
1. The transform must not change grapheme segmentation or textual content.

Algorithm outline:

1. Reuse `strText` and segmentation metadata from input value.
1. Iterate semantic style ids and resolve semantic props through theme maps.
1. Build concrete style object by deterministic precedence:
1. base token patch -> variant patch -> state patch -> explicit semantic overrides.
1. Intern resulting concrete style into render dictionary (`mpId_StyleEntry`).
1. Rewrite `rgIdStyleRef` from semantic ids to concrete render ids.
1. Return transformed value plus cache key metadata.

Caching strategy:

1. Cache per `(iVersionSemantic, idTheme, rgModeTheme, iDpiBucket)`.
1. Recompute only style-id mappings when text is unchanged and only theme/context changes.
1. Reuse prior mapping table `mpIdStyleSemantic_IdStyleRender` when possible.

HTML analogy (scope-limited):

1. Semantic properties are analogous to semantic elements/classes.
1. Rendering properties are analogous to computed style used for painting.
1. This design keeps semantics and rendering separate while remaining immediate-mode.

### 5) Rendering Algorithms

Pipeline:

1. Input: viewport, `AttributedTextValue`, layout constraints.
1. Build style runs: scan `rgIdStyleRef` and coalesce adjacent equal ids.
1. Resolve runs to shaped/measured spans using style properties.
1. Perform line breaking from spans into visual lines.
1. Emit draw commands in immediate-mode block tree.
1. Render decorations (selection background, underline, caret) with same coordinate model.

Storage-mode aware rendering:

1. `fastCodeUnit`: convert grapheme ranges to UTF-16 via direct index identity.
1. `fastCodePoint`: use code-point iteration table (no full grapheme segmentation required).
1. `segmentedGrapheme`: use `mpIGrapheme_RgUtf16` lookups for boundary conversion.

Important caches:

1. Segmentation cache keyed by `iVersionText`.
1. Run cache keyed by `(iVersionText, iVersionStyle)`.
1. Measurement cache keyed by `(sFontSignature, sTextSlice)`.
1. Layout cache keyed by `(nWidth, rgWrapMode, iVersionText, iVersionStyle)`.

Incremental rendering notes:

1. On localized edits, rebuild only affected run window.
1. Invalidate line layout from first changed line forward until layout stabilizes.
1. Keep visible-line culling for performance when values are large.

### 6) Applying Styles to Character Ranges

Operation definition:

1. `applyStyle(iStart, iEnd, stylePatch, rgMode)` where `rgMode` is `merge` or `replace`.
1. Range is half-open `[iStart, iEnd)` in grapheme indices.

Algorithm (merge mode):

1. Validate and normalize range.
1. Convert grapheme indices to internal style-ref indices (`iStartRef`, `iEndRef`) according to `rgStorageMode`.
1. Iterate affected indices or affected runs using `iCur`.
1. For each current style id, compute merged style object: `styleMerged = merge(styleCur, stylePatch)`.
1. Intern merged style object in dictionary to get `idStyleTarget`.
1. Rewrite `rgIdStyleRef` with `idStyleTarget`.
1. Coalesce adjacent equal ids.
1. Bump `iVersion` and emit change metadata.

Algorithm (replace mode):

1. Intern `stylePatch` once to `idStyleTarget`.
1. Assign `idStyleTarget` across range using `iCur`.
1. Coalesce and bump `iVersion`.

Complexity target:

1. `O(k)` where `k` is number of touched units or runs.
1. Prefer run-based mutation for large uniform ranges.

Edge cases:

1. Empty range: no-op unless treated as typing style state update.
1. Range crossing line breaks: allowed, same algorithm.
1. Partial grapheme selection: disallow by snapping to grapheme boundaries.
1. Unknown custom properties: preserve in merge unless explicitly removed.
1. Insert/replace that introduces complex graphemes: allow one-time promotion to `segmentedGrapheme` before applying style updates.

### 7) Phased Delivery Plan

1. Phase 1: finalize model and indexing semantics (grapheme policy, style dictionary format, API contracts).
1. Phase 2: implement semantic->render theming transformation pipeline.
1. Phase 3: implement non-editing pipeline (load value, run building, layout, render).
1. Phase 4: implement range-style operations and selection mapping.
1. Phase 5: add incremental invalidation and performance instrumentation.

### 8) Open Decisions to Resolve Early

1. Do we store `rgIdStyleRef` as typed arrays (preferred) or encoded string for compactness?
1. Maximum expected unique style combinations per attributed-text value?
1. Grapheme segmentation implementation and caching policy.
1. Merge semantics for property removal (`null`, `undefined`, explicit delete op).
1. Whether `mpId_StyleEntry` scope is per attributed-text value, per subtree, or renderer-wide.
