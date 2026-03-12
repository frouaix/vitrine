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
