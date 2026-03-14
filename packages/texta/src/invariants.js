import { throwTextaValidationError } from "./errors.js";
function isRecord(vValue) {
    return typeof vValue === "object" && vValue !== null;
}
function isNonNegativeInteger(vValue) {
    return Number.isInteger(vValue) && vValue >= 0;
}
function getCodePointCount(strText) {
    return Array.from(strText).length;
}
function getExpectedFastLength(value) {
    if (value.rgStorageMode === "fastCodeUnit") {
        return value.strText.length;
    }
    if (value.rgStorageMode === "fastCodePoint") {
        return getCodePointCount(value.strText);
    }
    return value.rgSegGraphemeToUtf16.length;
}
function validateSegmentedMapping(value) {
    if (value.rgStorageMode !== "segmentedGrapheme") {
        return;
    }
    if (value.rgSegGraphemeToUtf16.length !== value.rgIdStyleRef.length) {
        throwTextaValidationError("ERR_INVALID_SEGMENTATION", "rgSegGraphemeToUtf16 and rgIdStyleRef must have identical lengths in segmentedGrapheme mode");
    }
    let iPrev = -1;
    for (const iCur of value.rgSegGraphemeToUtf16) {
        if (!isNonNegativeInteger(iCur) || iCur > value.strText.length || iCur <= iPrev) {
            throwTextaValidationError("ERR_INVALID_SEGMENTATION", "segmentation offsets must be strictly increasing UTF-16 indices");
        }
        iPrev = iCur;
    }
}
export function validateAttributedTextValue(vValue) {
    if (!isRecord(vValue)) {
        throwTextaValidationError("ERR_INVALID_SHAPE", "AttributedTextValue must be an object");
    }
    const value = vValue;
    if (!isNonNegativeInteger(value.iVersion)) {
        throwTextaValidationError("ERR_INVALID_FIELD", "iVersion must be a non-negative integer");
    }
    if (typeof value.strText !== "string") {
        throwTextaValidationError("ERR_INVALID_FIELD", "strText must be a string");
    }
    if (!Array.isArray(value.rgIdStyleRef) || !value.rgIdStyleRef.every(isNonNegativeInteger)) {
        throwTextaValidationError("ERR_INVALID_FIELD", "rgIdStyleRef must be an array of non-negative integers");
    }
    if (!Array.isArray(value.rgSegGraphemeToUtf16) ||
        !value.rgSegGraphemeToUtf16.every(isNonNegativeInteger)) {
        throwTextaValidationError("ERR_INVALID_FIELD", "rgSegGraphemeToUtf16 must be an array of non-negative integers");
    }
    if (value.rgStorageMode !== "fastCodeUnit" &&
        value.rgStorageMode !== "fastCodePoint" &&
        value.rgStorageMode !== "segmentedGrapheme") {
        throwTextaValidationError("ERR_INVALID_FIELD", "rgStorageMode is invalid");
    }
    if (value.rgUnits !== "grapheme" && value.rgUnits !== "codePoint") {
        throwTextaValidationError("ERR_INVALID_FIELD", "rgUnits is invalid");
    }
    if (!isRecord(value.mpId_StyleEntry)) {
        throwTextaValidationError("ERR_INVALID_FIELD", "mpId_StyleEntry must be a dictionary object");
    }
    if (!isNonNegativeInteger(value.idStyleDefault)) {
        throwTextaValidationError("ERR_INVALID_FIELD", "idStyleDefault must be a non-negative integer");
    }
    const bHasDefaultStyle = Object.prototype.hasOwnProperty.call(value.mpId_StyleEntry, String(value.idStyleDefault));
    if (!bHasDefaultStyle) {
        throwTextaValidationError("ERR_MISSING_DEFAULT_STYLE", "idStyleDefault must exist in mpId_StyleEntry");
    }
    const iExpected = getExpectedFastLength(value);
    validateSegmentedMapping(value);
    if (value.rgIdStyleRef.length !== iExpected) {
        throwTextaValidationError("ERR_INVALID_STYLE_REF_LENGTH", "rgIdStyleRef length does not match storage-mode unit count");
    }
}
