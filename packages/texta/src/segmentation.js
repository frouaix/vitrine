function getCodePointCount(strValue) {
    return Array.from(strValue).length;
}
function getGraphemeSegmentsWithIntl(strText) {
    const segmenter = new Intl.Segmenter("en", {
        granularity: "grapheme"
    });
    const rgSegment = [];
    for (const segment of segmenter.segment(strText)) {
        rgSegment.push(segment.segment);
    }
    return rgSegment;
}
function getGraphemeSegmentsFallback(strText) {
    return Array.from(strText);
}
function assertRangeIndex(iValue, iMin, iMax, sLabel) {
    if (!Number.isInteger(iValue) || iValue < iMin || iValue > iMax) {
        throw new RangeError(`${sLabel} must be an integer in [${iMin}, ${iMax}]`);
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
export function getRgGraphemeSegment(strText) {
    if (typeof Intl !== "undefined" && typeof Intl.Segmenter !== "undefined") {
        return getGraphemeSegmentsWithIntl(strText);
    }
    return getGraphemeSegmentsFallback(strText);
}
export function getRgGraphemeBoundaryUtf16(strText) {
    if (strText.length === 0) {
        return [0];
    }
    const rgBoundaryUtf16 = [0];
    if (typeof Intl !== "undefined" && typeof Intl.Segmenter !== "undefined") {
        const segmenter = new Intl.Segmenter("en", {
            granularity: "grapheme"
        });
        for (const segment of segmenter.segment(strText)) {
            const iCurBoundary = segment.index;
            const iLastBoundary = rgBoundaryUtf16[rgBoundaryUtf16.length - 1];
            if (iCurBoundary !== iLastBoundary) {
                rgBoundaryUtf16.push(iCurBoundary);
            }
        }
    }
    else {
        let iUtf16 = 0;
        for (const strCodePoint of Array.from(strText)) {
            iUtf16 += strCodePoint.length;
            rgBoundaryUtf16.push(iUtf16);
        }
        return rgBoundaryUtf16;
    }
    const iLastBoundary = rgBoundaryUtf16[rgBoundaryUtf16.length - 1];
    if (iLastBoundary !== strText.length) {
        rgBoundaryUtf16.push(strText.length);
    }
    return rgBoundaryUtf16;
}
export function getRgCodePointBoundaryUtf16(strText) {
    const rgBoundaryUtf16 = [0];
    let iUtf16 = 0;
    for (const strCodePoint of Array.from(strText)) {
        iUtf16 += strCodePoint.length;
        rgBoundaryUtf16.push(iUtf16);
    }
    return rgBoundaryUtf16;
}
export function convertIGraphemeToIUtf16(strText, iGrapheme) {
    const rgBoundaryUtf16 = getRgGraphemeBoundaryUtf16(strText);
    assertRangeIndex(iGrapheme, 0, rgBoundaryUtf16.length - 1, "iGrapheme");
    return rgBoundaryUtf16[iGrapheme];
}
export function convertIUtf16ToIGrapheme(strText, iUtf16) {
    assertRangeIndex(iUtf16, 0, strText.length, "iUtf16");
    const rgBoundaryUtf16 = getRgGraphemeBoundaryUtf16(strText);
    return findFloorBoundaryIndex(rgBoundaryUtf16, iUtf16);
}
export function convertICodePointToIUtf16(strText, iCodePoint) {
    const rgBoundaryUtf16 = getRgCodePointBoundaryUtf16(strText);
    assertRangeIndex(iCodePoint, 0, rgBoundaryUtf16.length - 1, "iCodePoint");
    return rgBoundaryUtf16[iCodePoint];
}
export function convertIUtf16ToICodePoint(strText, iUtf16) {
    assertRangeIndex(iUtf16, 0, strText.length, "iUtf16");
    const rgBoundaryUtf16 = getRgCodePointBoundaryUtf16(strText);
    return findFloorBoundaryIndex(rgBoundaryUtf16, iUtf16);
}
export function detectRgStorageMode(strText) {
    const rgGraphemeSegment = getRgGraphemeSegment(strText);
    if (rgGraphemeSegment.length === 0) {
        return "fastCodeUnit";
    }
    let bAllCodeUnit = true;
    let bAllCodePoint = true;
    for (const strSegment of rgGraphemeSegment) {
        if (strSegment.length !== 1) {
            bAllCodeUnit = false;
        }
        if (getCodePointCount(strSegment) !== 1) {
            bAllCodePoint = false;
        }
        if (!bAllCodeUnit && !bAllCodePoint) {
            return "segmentedGrapheme";
        }
    }
    if (bAllCodeUnit) {
        return "fastCodeUnit";
    }
    if (bAllCodePoint) {
        return "fastCodePoint";
    }
    return "segmentedGrapheme";
}
