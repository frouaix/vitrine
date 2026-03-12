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

export { detectRgStorageMode, getRgGraphemeSegment } from "./segmentation.ts";
