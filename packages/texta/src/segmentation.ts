import type { RgStorageMode } from "./types.ts";

function getCodePointCount(strValue: string): number {
  return Array.from(strValue).length;
}

function getGraphemeSegmentsWithIntl(strText: string): string[] {
  const segmenter: Intl.Segmenter = new Intl.Segmenter("en", {
    granularity: "grapheme"
  });

  const rgSegment: string[] = [];

  for (const segment of segmenter.segment(strText)) {
    rgSegment.push(segment.segment);
  }

  return rgSegment;
}

function getGraphemeSegmentsFallback(strText: string): string[] {
  return Array.from(strText);
}

function assertRangeIndex(iValue: number, iMin: number, iMax: number, sLabel: string): void {
  if (!Number.isInteger(iValue) || iValue < iMin || iValue > iMax) {
    throw new RangeError(`${sLabel} must be an integer in [${iMin}, ${iMax}]`);
  }
}

function findFloorBoundaryIndex(rgBoundaryUtf16: number[], iUtf16: number): number {
  let iFloor: number = 0;

  for (let iCur: number = 0; iCur < rgBoundaryUtf16.length; iCur += 1) {
    if (rgBoundaryUtf16[iCur] <= iUtf16) {
      iFloor = iCur;
      continue;
    }

    break;
  }

  return iFloor;
}

export function getRgGraphemeSegment(strText: string): string[] {
  if (typeof Intl !== "undefined" && typeof Intl.Segmenter !== "undefined") {
    return getGraphemeSegmentsWithIntl(strText);
  }

  return getGraphemeSegmentsFallback(strText);
}

export function getRgGraphemeBoundaryUtf16(strText: string): number[] {
  if (strText.length === 0) {
    return [0];
  }

  const rgBoundaryUtf16: number[] = [0];

  if (typeof Intl !== "undefined" && typeof Intl.Segmenter !== "undefined") {
    const segmenter: Intl.Segmenter = new Intl.Segmenter("en", {
      granularity: "grapheme"
    });

    for (const segment of segmenter.segment(strText)) {
      const iCurBoundary: number = segment.index;
      const iLastBoundary: number = rgBoundaryUtf16[rgBoundaryUtf16.length - 1];

      if (iCurBoundary !== iLastBoundary) {
        rgBoundaryUtf16.push(iCurBoundary);
      }
    }
  } else {
    let iUtf16: number = 0;

    for (const strCodePoint of Array.from(strText)) {
      iUtf16 += strCodePoint.length;
      rgBoundaryUtf16.push(iUtf16);
    }

    return rgBoundaryUtf16;
  }

  const iLastBoundary: number = rgBoundaryUtf16[rgBoundaryUtf16.length - 1];

  if (iLastBoundary !== strText.length) {
    rgBoundaryUtf16.push(strText.length);
  }

  return rgBoundaryUtf16;
}

export function getRgCodePointBoundaryUtf16(strText: string): number[] {
  const rgBoundaryUtf16: number[] = [0];
  let iUtf16: number = 0;

  for (const strCodePoint of Array.from(strText)) {
    iUtf16 += strCodePoint.length;
    rgBoundaryUtf16.push(iUtf16);
  }

  return rgBoundaryUtf16;
}

export function convertIGraphemeToIUtf16(strText: string, iGrapheme: number): number {
  const rgBoundaryUtf16: number[] = getRgGraphemeBoundaryUtf16(strText);

  assertRangeIndex(iGrapheme, 0, rgBoundaryUtf16.length - 1, "iGrapheme");

  return rgBoundaryUtf16[iGrapheme];
}

export function convertIUtf16ToIGrapheme(strText: string, iUtf16: number): number {
  assertRangeIndex(iUtf16, 0, strText.length, "iUtf16");

  const rgBoundaryUtf16: number[] = getRgGraphemeBoundaryUtf16(strText);

  return findFloorBoundaryIndex(rgBoundaryUtf16, iUtf16);
}

export function convertICodePointToIUtf16(strText: string, iCodePoint: number): number {
  const rgBoundaryUtf16: number[] = getRgCodePointBoundaryUtf16(strText);

  assertRangeIndex(iCodePoint, 0, rgBoundaryUtf16.length - 1, "iCodePoint");

  return rgBoundaryUtf16[iCodePoint];
}

export function convertIUtf16ToICodePoint(strText: string, iUtf16: number): number {
  assertRangeIndex(iUtf16, 0, strText.length, "iUtf16");

  const rgBoundaryUtf16: number[] = getRgCodePointBoundaryUtf16(strText);

  return findFloorBoundaryIndex(rgBoundaryUtf16, iUtf16);
}

export function detectRgStorageMode(strText: string): RgStorageMode {
  const rgGraphemeSegment: string[] = getRgGraphemeSegment(strText);

  if (rgGraphemeSegment.length === 0) {
    return "fastCodeUnit";
  }

  let bAllCodeUnit: boolean = true;
  let bAllCodePoint: boolean = true;

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
