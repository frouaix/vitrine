export type {
  AttributedTextValue,
  AttributedTextValueRender,
  AttributedTextValueSemantic,
  RenderStyleEntry,
  RgStorageMode,
  RgUnits,
  SemanticStyleEntry,
  SemanticStyleMeta,
  StyleEntry
} from "./types.ts";

export {
  TextaValidationError,
  throwTextaValidationError,
  type TextaValidationErrorCode
} from "./errors.ts";

export { validateAttributedTextValue } from "./invariants.ts";

export {
  convertICodePointToIUtf16,
  convertIGraphemeToIUtf16,
  convertIUtf16ToICodePoint,
  convertIUtf16ToIGrapheme,
  detectRgStorageMode,
  getRgCodePointBoundaryUtf16,
  getRgGraphemeBoundaryUtf16,
  getRgGraphemeSegment
} from "./segmentation.ts";

export {
  cleanupUnreferencedStyles,
  computeStyleHash,
  createStyleDictionaryState,
  createStyleDictionaryStateFromEntries,
  getStyleRefCount,
  getStyleEntryById,
  internStyleEntry,
  releaseStyleId,
  retainStyleId,
  normalizeStyleEntry,
  stringifyNormalizedStyleEntry,
  type StyleDictionaryState,
  type NormalizedStyleEntry
} from "./dictionary.ts";

export {
  applyStyle,
  getRgStyleRun,
  type RgStyleApplyMode,
  type StyleRun
} from "./style-ops.ts";

export { deleteTextRange, insertText, replaceTextRange } from "./text-ops.ts";

export {
  transformSemanticToRender,
  createThemingCache,
  transformSemanticToRenderWithCache,
  type ThemingTransformConfig,
  type ThemingTransformCacheOptions,
  type ThemingCache,
  type ThemingCacheEntry,
  type ThemingTransformWithCacheResult
} from "./theming.ts";

export {
  getRenderBridgeSpan,
  getRgRenderBridgeRun,
  getRgRenderDecorationRange,
  getRgRenderBridgeBoundaryUtf16,
  convertRenderBridgeIUnitToIUtf16,
  convertRenderBridgeIUtf16ToIUnit,
  type RenderBridgeSpan,
  type RenderBridgeRun,
  type RenderDecorationKind,
  type RenderBridgeDecorationRange
} from "./render-bridges.ts";

export {
  registerTextaBlockType,
  texta,
  stBlockTypeTexta,
  type TextaBlockProps
} from "./vitrine.ts";
