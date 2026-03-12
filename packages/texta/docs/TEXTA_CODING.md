# Attributed Text Coding Plan (`texta`)

## Scope

This plan defines a TDD-first implementation roadmap for an independent package named `texta`.

1. `texta` is built and validated independently from `vitrine` core.
1. `vitrine` core integration is intentionally deferred until `texta` APIs and behavior are stable.
1. The feature domain is attributed text (semantic + render forms), storage modes, styling operations, and theming transform.

## Objectives

1. Deliver a robust attributed-text model with fast paths (`fastCodeUnit`, `fastCodePoint`) and fallback (`segmentedGrapheme`).
1. Enforce grapheme-correct public APIs while preserving performant internal representations.
1. Support deterministic style dictionary interning and efficient range style operations.
1. Provide semantic-to-render theming transformation as a pure mapping step.
1. Use TDD to lock behavior before implementation details.

## Package Strategy

## Phase 0: Independent Package Setup

Create a new workspace package:

1. Path: `packages/texta/`
1. Name: `texta`
1. Build target: TypeScript library output (ESM + types)
1. Initial dependency policy:
1. Keep runtime dependencies minimal.
1. Allow Unicode segmentation helper dependency only if native platform support is insufficient.
1. No dependency on `vitrine` packages.

Suggested layout:

1. `packages/texta/src/index.ts`
1. `packages/texta/src/types.ts`
1. `packages/texta/src/model.ts`
1. `packages/texta/src/segmentation.ts`
1. `packages/texta/src/dictionary.ts`
1. `packages/texta/src/style-ops.ts`
1. `packages/texta/src/theming.ts`
1. `packages/texta/src/render-bridges.ts`
1. `packages/texta/src/invariants.ts`
1. `packages/texta/src/errors.ts`
1. `packages/texta/test/*.test.ts`

## Naming and Conventions

Use conventions already adopted in the design notes:

1. Dictionaries/maps: `mpKey_Value`
1. Ranges/arrays/enumerations: `rg*`
1. Indices/iterators: `i*`
1. Keep style property names as standard render names (`fontFamily`, `fontSize`, etc.).

Public terminology:

1. Use "attributed text".
1. Avoid "rich text" and "document" in types and API names.

## TDD Approach

Test cycle for every feature:

1. Write failing tests first.
1. Implement minimal behavior to pass tests.
1. Refactor while preserving green tests.
1. Add invariant/property-style tests for edge cases.

Test layers:

1. Unit tests: narrow functions (segmentation, interning, range mutation).
1. Scenario tests: end-to-end attributed-text edits and transforms.
1. Regression tests: lock known Unicode and style edge cases.
1. Performance guard tests: asymptotic and coarse thresholds (non-flaky).

## Detailed Milestones

## Execution Tracker (Task IDs + Estimates)

Status legend:

1. `[ ]` not started
1. `[-]` in progress
1. `[x]` done

Tracker maintenance rule:

1. When a `TX-*` task is committed, update its status in this table in the same commit.

Effort legend (engineer-days):

1. `S`: 0.5 to 1.5
1. `M`: 2 to 4
1. `L`: 5 to 8

Priority order: `P0` (must), `P1` (next), `P2` (later in phase)

| ID | Task | Milestone | Priority | Estimate | Depends On | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `TX-001` | Scaffold `packages/texta` package and test runner | Phase 0 | `P0` | `M` | - | `[x]` |
| `TX-002` | Configure TS build outputs and package exports | Phase 0 | `P0` | `S` | `TX-001` | `[x]` |
| `TX-003` | Add baseline CI test job for `texta` only | Phase 0 | `P0` | `S` | `TX-001` | `[x]` |
| `TX-010` | Define core types (`AttributedTextValue`, `StyleEntry`) | 1 | `P0` | `S` | `TX-001` | `[x]` |
| `TX-011` | Implement runtime invariants and validation errors | 1 | `P0` | `M` | `TX-010` | `[x]` |
| `TX-012` | Write invariant-focused unit tests and immutability tests | 1 | `P0` | `M` | `TX-010` | `[x]` |
| `TX-020` | Implement storage-mode detection (`fastCodeUnit`, `fastCodePoint`, `segmentedGrapheme`) | 2 | `P0` | `M` | `TX-011` | `[x]` |
| `TX-021` | Implement grapheme/code-point/UTF-16 conversion helpers | 2 | `P0` | `L` | `TX-020` | `[x]` |
| `TX-022` | Add multilingual segmentation regression tests | 2 | `P0` | `M` | `TX-021` | `[x]` |
| `TX-030` | Implement style normalization and stable hashing | 3 | `P0` | `M` | `TX-010` | `[x]` |
| `TX-031` | Implement dictionary interning + collision resolution | 3 | `P0` | `M` | `TX-030` | `[x]` |
| `TX-032` | Add ref-count tracking and safe cleanup hooks | 3 | `P1` | `M` | `TX-031` | `[x]` |
| `TX-040` | Implement `applyStyle` (`merge` and `replace`) | 4 | `P0` | `M` | `TX-031`, `TX-021` | `[x]` |
| `TX-041` | Implement run coalescing and touched-range optimization | 4 | `P0` | `M` | `TX-040` | `[x]` |
| `TX-042` | Add range-operation edge-case test suite | 4 | `P0` | `M` | `TX-040` | `[x]` |
| `TX-050` | Implement insert/delete/replace text operations | 5 | `P0` | `L` | `TX-021`, `TX-011` | `[ ]` |
| `TX-051` | Implement mode promotion logic on edits | 5 | `P0` | `M` | `TX-050` | `[ ]` |
| `TX-052` | Add mixed-edit sequence regression tests | 5 | `P0` | `M` | `TX-051`, `TX-040` | `[ ]` |
| `TX-060` | Define semantic/render style conventions and types | 6 | `P0` | `S` | `TX-010` | `[ ]` |
| `TX-061` | Implement semantic -> render theming transform pipeline | 6 | `P0` | `M` | `TX-060`, `TX-031` | `[ ]` |
| `TX-062` | Implement theming cache and remap reuse | 6 | `P1` | `M` | `TX-061` | `[ ]` |
| `TX-070` | Implement render bridge API (runs/spans/decorations) | 7 | `P0` | `M` | `TX-041`, `TX-021` | `[ ]` |
| `TX-071` | Add storage-mode fast conversion helpers | 7 | `P1` | `M` | `TX-070` | `[ ]` |
| `TX-072` | Add bridge contract tests for renderer consumption | 7 | `P0` | `M` | `TX-070` | `[ ]` |
| `TX-080` | Add invariant fuzz tests and malformed-input tests | 8 | `P0` | `M` | `TX-052`, `TX-042` | `[ ]` |
| `TX-081` | Add benchmark harness and baseline scenarios | 8 | `P0` | `M` | `TX-070`, `TX-051` | `[ ]` |
| `TX-082` | Define benchmark thresholds and CI reporting | 8 | `P1` | `S` | `TX-081`, `TX-003` | `[ ]` |

Milestone effort rollup (initial estimate):

| Milestone | Included Tasks | Total Size |
| --- | --- | --- |
| Phase 0 | `TX-001..003` | `M` |
| 1 | `TX-010..012` | `M-L` |
| 2 | `TX-020..022` | `L` |
| 3 | `TX-030..032` | `M-L` |
| 4 | `TX-040..042` | `M-L` |
| 5 | `TX-050..052` | `L` |
| 6 | `TX-060..062` | `M` |
| 7 | `TX-070..072` | `M-L` |
| 8 | `TX-080..082` | `M` |

Suggested next sprint slice:

1. `TX-030`, `TX-031`, `TX-032`
1. `TX-040`, `TX-041`, `TX-042`

## Milestone 1: Core Types and Invariants (TDD)

Deliverables:

1. `AttributedTextValue` type and related `StyleEntry` types.
1. `rgStorageMode` with values:
1. `fastCodeUnit`
1. `fastCodePoint`
1. `segmentedGrapheme`
1. Validation/invariant utilities.

Tests first:

1. Reject invalid value shapes.
1. Require aligned `rgIdStyleRef` length for current mode.
1. Ensure `idStyleDefault` exists in `mpId_StyleEntry`.
1. Verify immutable update semantics for all public operations.

Acceptance criteria:

1. Type-level and runtime invariants are explicit and enforced.
1. Invalid states fail with deterministic error messages.

## Milestone 2: Segmentation and Mode Detection (TDD)

Deliverables:

1. Mode detection for input text.
1. Grapheme boundary mapping utilities.
1. Conversion helpers between grapheme/code-point/UTF-16 offsets.

Tests first:

1. ASCII samples select `fastCodeUnit`.
1. Surrogate pair-only samples can select `fastCodePoint`.
1. Combining marks, ZWJ sequences, and flags force `segmentedGrapheme`.
1. Boundary conversion correctness for representative multilingual cases.

Acceptance criteria:

1. Public indexing remains grapheme-correct in all modes.
1. Fast modes skip full segmentation where valid.

## Milestone 3: Style Dictionary Interning (TDD)

Deliverables:

1. Dictionary manager over `mpId_StyleEntry`.
1. Interning via normalization + hash + structural equality.
1. Reference counting and optional cleanup hooks.

Tests first:

1. Equivalent style objects intern to same id.
1. Distinct style objects produce distinct ids.
1. Hash collisions are safely resolved by deep equality.
1. Reference counters update correctly on rewrites.

Acceptance criteria:

1. Interning is deterministic and id-stable for value lifetime.
1. Cleanup never removes referenced style entries.

## Milestone 4: Style Range Operations (TDD)

Deliverables:

1. `applyStyle(iStart, iEnd, stylePatch, rgMode)` with `merge` and `replace`.
1. Run coalescing after updates.
1. Mode-aware index conversion.

Tests first:

1. Merge semantics preserve unspecified properties.
1. Replace semantics overwrite entire style entry.
1. Empty ranges are no-op (unless explicitly typing-state API later).
1. Operations across line breaks and mixed scripts behave correctly.
1. Partial-grapheme boundaries are normalized/rejected per policy.

Acceptance criteria:

1. Complexity is linear in touched region/run count.
1. Adjacent identical style ids are coalesced post-update.

## Milestone 5: Edit Operations and Mode Promotion (TDD)

Deliverables:

1. Insert/delete/replace text operations.
1. Promotion logic:
1. `fastCodeUnit -> fastCodePoint`
1. `fastCodeUnit|fastCodePoint -> segmentedGrapheme`
1. Optional deferred demotion policy hooks.

Tests first:

1. Inserting simple BMP text preserves current fast mode when valid.
1. Inserting surrogate pairs promotes only when required.
1. Inserting complex grapheme clusters triggers segmented mode.
1. Style refs remain aligned after every edit.

Acceptance criteria:

1. Promotions are correct and localized.
1. No index corruption after mixed edit sequences.

## Milestone 6: Theming Transform (TDD)

Deliverables:

1. Semantic value type conventions (`AttributedTextValueSemantic`).
1. Render value type conventions (`AttributedTextValueRender`).
1. Theme transform pipeline from symbolic properties to concrete render properties.
1. Mapping caches (`mpIdStyleSemantic_IdStyleRender`) keyed by semantic version + theme context.

Tests first:

1. Transform preserves `strText` and grapheme boundaries.
1. Deterministic precedence order:
1. token patch
1. variant patch
1. state patch
1. explicit semantic overrides
1. Same input + theme gives stable output ids.
1. Theme change without text change rewrites only style mappings.

Acceptance criteria:

1. Transform is pure and deterministic.
1. No segmentation/text mutation during theming.

## Milestone 7: Rendering Bridge API (TDD)

Deliverables:

1. Read-only bridge APIs for renderers (run extraction, line input spans, decoration ranges).
1. Storage-mode-specific fast conversion helpers.

Tests first:

1. Run extraction correctness across all storage modes.
1. Boundary conversion for caret and selection ranges.
1. Bridge outputs are stable under no-op updates.

Acceptance criteria:

1. Core renderer can consume bridge outputs without knowing internal storage details.

## Milestone 8: Hardening and Benchmarks (TDD + Perf)

Deliverables:

1. Regression corpus for Unicode edge cases.
1. Property/invariant fuzz tests for edit + style operations.
1. Benchmark suite for representative workloads.

Tests first:

1. Random edit sequences preserve invariants.
1. No crashes on malformed external inputs.
1. Performance checkpoints for:
1. large ASCII value (fast path)
1. emoji-heavy value (fastCodePoint/segmented mix)
1. complex-script value (segmented)

Acceptance criteria:

1. Reliability and performance are measurable before integration.

## Test Matrix (Minimum)

Unicode coverage:

1. ASCII + Latin BMP
1. Surrogate pairs (emoji)
1. Combining marks
1. ZWJ sequences
1. Regional indicator flags
1. Indic/complex-script examples

Operation coverage:

1. Create/normalize value
1. Insert/delete/replace text
1. Apply style merge/replace
1. Theme transform
1. Run extraction

## CI and Quality Gates

1. `texta` tests run in CI independently of `vitrine` core.
1. Required gates before integration:
1. 100% pass on deterministic test suite.
1. No unresolved invariant-test failures.
1. Benchmarks within expected envelopes for baseline scenarios.

## Integration Plan with `vitrine` Core (After Stabilization)

Integration preconditions:

1. `texta` API freeze for v1 surface.
1. Stable serialization format decisions.
1. Baseline performance confirmed.

Integration steps:

1. Add `texta` as dependency in core package.
1. Add adapter layer in core to consume `texta` rendering bridge outputs.
1. Migrate one demo path first (feature-flagged).
1. Expand adoption after parity validation.

Non-goals for initial integration:

1. Re-architecting existing renderer beyond adapter boundaries.
1. Theme-system redesign outside attributed-text mapping scope.

## Initial Backlog (Implementation Order)

1. Set up `packages/texta` scaffolding and test runner.
1. Implement Milestone 1 with strict invariant tests.
1. Implement Milestone 2 mode detection + boundary conversions.
1. Implement Milestone 3 dictionary interning.
1. Implement Milestone 4 style operations.
1. Implement Milestone 5 edit ops + promotion.
1. Implement Milestone 6 theming transform.
1. Implement Milestone 7 rendering bridge.
1. Implement Milestone 8 hardening and benchmarks.

## Risks and Mitigations

1. Risk: Unicode boundary bugs in mixed scripts.
1. Mitigation: regression corpus + fuzz invariants + explicit boundary APIs.
1. Risk: Overhead from frequent mode promotions.
1. Mitigation: localized checks, one-way promotion by default, optional lazy demotion.
1. Risk: Style dictionary growth from high style churn.
1. Mitigation: deterministic interning + reference counting + cleanup policy.
1. Risk: Theme transform complexity drift.
1. Mitigation: strict precedence rules + transform purity tests.
