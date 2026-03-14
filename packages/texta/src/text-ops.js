import { convertICodePointToIUtf16, convertIGraphemeToIUtf16, detectRgStorageMode, getRgCodePointBoundaryUtf16, getRgGraphemeBoundaryUtf16 } from "./segmentation.js";
function assertUnitRange(iStart, iEnd, iLen) {
    const bValidStart = Number.isInteger(iStart) && iStart >= 0 && iStart <= iLen;
    const bValidEnd = Number.isInteger(iEnd) && iEnd >= 0 && iEnd <= iLen;
    if (!bValidStart || !bValidEnd || iStart > iEnd) {
        throw new RangeError(`Invalid unit range [${iStart}, ${iEnd}) for length ${iLen}`);
    }
}
function getUnitCountForMode(value) {
    return value.rgIdStyleRef.length;
}
function convertIUnitToIUtf16(value, iUnit) {
    if (value.rgStorageMode === "fastCodeUnit") {
        return iUnit;
    }
    if (value.rgStorageMode === "fastCodePoint") {
        return convertICodePointToIUtf16(value.strText, iUnit);
    }
    return convertIGraphemeToIUtf16(value.strText, iUnit);
}
function convertIUnitToIUtf16ByMode(strText, rgStorageMode, iUnit) {
    if (rgStorageMode === "fastCodeUnit") {
        return iUnit;
    }
    if (rgStorageMode === "fastCodePoint") {
        return convertICodePointToIUtf16(strText, iUnit);
    }
    return convertIGraphemeToIUtf16(strText, iUnit);
}
function getInsertedUnitCount(strInsert, value) {
    if (value.rgStorageMode === "fastCodeUnit") {
        return strInsert.length;
    }
    if (value.rgStorageMode === "fastCodePoint") {
        return getRgCodePointBoundaryUtf16(strInsert).length - 1;
    }
    return getRgGraphemeBoundaryUtf16(strInsert).length - 1;
}
function buildRgSegGraphemeToUtf16(strText, value) {
    if (value.rgStorageMode !== "segmentedGrapheme") {
        return [];
    }
    const rgBoundaryUtf16 = getRgGraphemeBoundaryUtf16(strText);
    return rgBoundaryUtf16.slice(1);
}
function buildRgSegGraphemeToUtf16ByMode(strText, rgStorageMode) {
    if (rgStorageMode !== "segmentedGrapheme") {
        return [];
    }
    const rgBoundaryUtf16 = getRgGraphemeBoundaryUtf16(strText);
    return rgBoundaryUtf16.slice(1);
}
function getUnitCountForModeAndText(strText, rgStorageMode) {
    if (rgStorageMode === "fastCodeUnit") {
        return strText.length;
    }
    if (rgStorageMode === "fastCodePoint") {
        return getRgCodePointBoundaryUtf16(strText).length - 1;
    }
    return getRgGraphemeBoundaryUtf16(strText).length - 1;
}
function promoteStorageModeAfterEdit(strText) {
    return detectRgStorageMode(strText);
}
function rebuildStyleRefForMode(rgIdStyleRef, rgStorageModeFrom, rgStorageModeTo, strTextFrom, strTextTo) {
    if (rgStorageModeFrom === rgStorageModeTo) {
        return rgIdStyleRef;
    }
    const iUnitCountTo = getUnitCountForModeAndText(strTextTo, rgStorageModeTo);
    if (iUnitCountTo === rgIdStyleRef.length) {
        return rgIdStyleRef;
    }
    const rgIdStyleRefTo = [];
    for (let iUnitTo = 0; iUnitTo < iUnitCountTo; iUnitTo += 1) {
        const iUtf16 = convertIUnitToIUtf16ByMode(strTextTo, rgStorageModeTo, iUnitTo);
        let iUnitFrom = 0;
        while (iUnitFrom + 1 < rgIdStyleRef.length &&
            convertIUnitToIUtf16ByMode(strTextFrom, rgStorageModeFrom, iUnitFrom + 1) <= iUtf16) {
            iUnitFrom += 1;
        }
        rgIdStyleRefTo.push(rgIdStyleRef[Math.min(iUnitFrom, rgIdStyleRef.length - 1)] ?? 0);
    }
    return rgIdStyleRefTo;
}
export function insertText(value, iAt, strInsert, idStyleInsert = value.idStyleDefault) {
    const iLen = getUnitCountForMode(value);
    assertUnitRange(iAt, iAt, iLen);
    if (strInsert.length === 0) {
        return value;
    }
    const iUtf16At = convertIUnitToIUtf16(value, iAt);
    const strTextNext = value.strText.slice(0, iUtf16At) + strInsert + value.strText.slice(iUtf16At);
    const iInsertedUnitCount = getInsertedUnitCount(strInsert, value);
    const rgIdStyleRefNext = [
        ...value.rgIdStyleRef.slice(0, iAt),
        ...new Array(iInsertedUnitCount).fill(idStyleInsert),
        ...value.rgIdStyleRef.slice(iAt)
    ];
    const rgStorageModeNext = promoteStorageModeAfterEdit(strTextNext);
    const rgIdStyleRefPromoted = rebuildStyleRefForMode(rgIdStyleRefNext, value.rgStorageMode, rgStorageModeNext, strTextNext, strTextNext);
    return {
        ...value,
        iVersion: value.iVersion + 1,
        rgStorageMode: rgStorageModeNext,
        strText: strTextNext,
        rgIdStyleRef: rgIdStyleRefPromoted,
        rgSegGraphemeToUtf16: buildRgSegGraphemeToUtf16ByMode(strTextNext, rgStorageModeNext)
    };
}
export function deleteTextRange(value, iStart, iEnd) {
    const iLen = getUnitCountForMode(value);
    assertUnitRange(iStart, iEnd, iLen);
    if (iStart === iEnd) {
        return value;
    }
    const iUtf16Start = convertIUnitToIUtf16(value, iStart);
    const iUtf16End = convertIUnitToIUtf16(value, iEnd);
    const strTextNext = value.strText.slice(0, iUtf16Start) + value.strText.slice(iUtf16End);
    const rgIdStyleRefNext = [
        ...value.rgIdStyleRef.slice(0, iStart),
        ...value.rgIdStyleRef.slice(iEnd)
    ];
    const rgStorageModeNext = promoteStorageModeAfterEdit(strTextNext);
    const rgIdStyleRefPromoted = rebuildStyleRefForMode(rgIdStyleRefNext, value.rgStorageMode, rgStorageModeNext, strTextNext, strTextNext);
    return {
        ...value,
        iVersion: value.iVersion + 1,
        rgStorageMode: rgStorageModeNext,
        strText: strTextNext,
        rgIdStyleRef: rgIdStyleRefPromoted,
        rgSegGraphemeToUtf16: buildRgSegGraphemeToUtf16ByMode(strTextNext, rgStorageModeNext)
    };
}
export function replaceTextRange(value, iStart, iEnd, strReplace, idStyleInsert = value.idStyleDefault) {
    const iLen = getUnitCountForMode(value);
    assertUnitRange(iStart, iEnd, iLen);
    if (iStart === iEnd && strReplace.length === 0) {
        return value;
    }
    const iUtf16Start = convertIUnitToIUtf16(value, iStart);
    const iUtf16End = convertIUnitToIUtf16(value, iEnd);
    const strTextNext = value.strText.slice(0, iUtf16Start) + strReplace + value.strText.slice(iUtf16End);
    const iInsertedUnitCount = getInsertedUnitCount(strReplace, value);
    const rgIdStyleRefNext = [
        ...value.rgIdStyleRef.slice(0, iStart),
        ...new Array(iInsertedUnitCount).fill(idStyleInsert),
        ...value.rgIdStyleRef.slice(iEnd)
    ];
    const rgStorageModeNext = promoteStorageModeAfterEdit(strTextNext);
    const rgIdStyleRefPromoted = rebuildStyleRefForMode(rgIdStyleRefNext, value.rgStorageMode, rgStorageModeNext, strTextNext, strTextNext);
    return {
        ...value,
        iVersion: value.iVersion + 1,
        rgStorageMode: rgStorageModeNext,
        strText: strTextNext,
        rgIdStyleRef: rgIdStyleRefPromoted,
        rgSegGraphemeToUtf16: buildRgSegGraphemeToUtf16ByMode(strTextNext, rgStorageModeNext)
    };
}
