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

export function getRgGraphemeSegment(strText: string): string[] {
  if (typeof Intl !== "undefined" && typeof Intl.Segmenter !== "undefined") {
    return getGraphemeSegmentsWithIntl(strText);
  }

  return getGraphemeSegmentsFallback(strText);
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
