import { convertICodePointToIUtf16, convertIUtf16ToICodePoint, getRgCodePointBoundaryUtf16 } from "./segmentation.js";
import { getRgStyleRun } from "./style-ops.js";
function assertUnitRange(iStart, iEnd, iLen) {
    const bValidStart = Number.isInteger(iStart) && iStart >= 0 && iStart <= iLen;
    const bValidEnd = Number.isInteger(iEnd) && iEnd >= 0 && iEnd <= iLen;
    if (!bValidStart || !bValidEnd || iStart > iEnd) {
        throw new RangeError(`Invalid render span range [${iStart}, ${iEnd}) for length ${iLen}`);
    }
}
function assertUnitIndex(iUnit, iLen) {
    if (!Number.isInteger(iUnit) || iUnit < 0 || iUnit > iLen) {
        throw new RangeError(`iUnit must be an integer in [0, ${iLen}]`);
    }
}
function assertUtf16Index(iUtf16, iLenUtf16) {
    if (!Number.isInteger(iUtf16) || iUtf16 < 0 || iUtf16 > iLenUtf16) {
        throw new RangeError(`iUtf16 must be an integer in [0, ${iLenUtf16}]`);
    }
}
function findFloorBoundaryIndex(rgBoundaryUtf16, iUtf16) {
    let iFloor = 0;
    for (let iCur = 0; iCur < rgBoundaryUtf16.length; iCur += 1) {
        if (rgBoundaryUtf16[iCur] <= iUtf16) {
            iFloor = iCur;
            continue;
        }
        break;
    }
    return iFloor;
}
export function getRgRenderBridgeBoundaryUtf16(value) {
    if (value.rgStorageMode === "fastCodeUnit") {
        const rgBoundaryUtf16 = [];
        for (let iCur = 0; iCur <= value.rgIdStyleRef.length; iCur += 1) {
            rgBoundaryUtf16.push(iCur);
        }
        return rgBoundaryUtf16;
    }
    if (value.rgStorageMode === "fastCodePoint") {
        return getRgCodePointBoundaryUtf16(value.strText);
    }
    return [0, ...value.rgSegGraphemeToUtf16];
}
export function convertRenderBridgeIUnitToIUtf16(value, iUnit) {
    assertUnitIndex(iUnit, value.rgIdStyleRef.length);
    if (value.rgStorageMode === "fastCodeUnit") {
        return iUnit;
    }
    if (value.rgStorageMode === "fastCodePoint") {
        return convertICodePointToIUtf16(value.strText, iUnit);
    }
    if (iUnit === 0) {
        return 0;
    }
    return value.rgSegGraphemeToUtf16[iUnit - 1] ?? value.strText.length;
}
export function convertRenderBridgeIUtf16ToIUnit(value, iUtf16) {
    assertUtf16Index(iUtf16, value.strText.length);
    if (value.rgStorageMode === "fastCodeUnit") {
        return iUtf16;
    }
    if (value.rgStorageMode === "fastCodePoint") {
        return convertIUtf16ToICodePoint(value.strText, iUtf16);
    }
    const rgBoundaryUtf16 = getRgRenderBridgeBoundaryUtf16(value);
    return findFloorBoundaryIndex(rgBoundaryUtf16, iUtf16);
}
function getStyleEntry(value, idStyle) {
    return value.mpId_StyleEntry[idStyle] ?? value.mpId_StyleEntry[value.idStyleDefault] ?? {};
}
export function getRenderBridgeSpan(value, iStart, iEnd) {
    assertUnitRange(iStart, iEnd, value.rgIdStyleRef.length);
    const iUtf16Start = convertRenderBridgeIUnitToIUtf16(value, iStart);
    const iUtf16End = convertRenderBridgeIUnitToIUtf16(value, iEnd);
    return {
        iStart,
        iEnd,
        iUtf16Start,
        iUtf16End,
        strSlice: value.strText.slice(iUtf16Start, iUtf16End)
    };
}
export function getRgRenderBridgeRun(value) {
    const rgRun = getRgStyleRun(value.rgIdStyleRef);
    return rgRun.map((run) => {
        const span = getRenderBridgeSpan(value, run.iStart, run.iEnd);
        return {
            ...span,
            idStyle: run.idStyle
        };
    });
}
export function getRgRenderDecorationRange(value) {
    const rgDecor = [];
    for (const run of getRgRenderBridgeRun(value)) {
        const style = getStyleEntry(value, run.idStyle);
        if (style.underline === true) {
            rgDecor.push({
                sKind: "underline",
                iStart: run.iStart,
                iEnd: run.iEnd,
                iUtf16Start: run.iUtf16Start,
                iUtf16End: run.iUtf16End,
                idStyle: run.idStyle
            });
        }
        if (style.strikethrough === true) {
            rgDecor.push({
                sKind: "strikethrough",
                iStart: run.iStart,
                iEnd: run.iEnd,
                iUtf16Start: run.iUtf16Start,
                iUtf16End: run.iUtf16End,
                idStyle: run.idStyle
            });
        }
    }
    return rgDecor;
}
