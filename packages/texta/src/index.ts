export const sTextaPackageName: string = "texta";

export type {
	AttributedTextValue,
	RgStorageMode,
	RgUnits,
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

export { applyStyle, type RgStyleApplyMode } from "./style-ops.ts";
