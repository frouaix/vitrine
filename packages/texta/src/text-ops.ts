import {
  convertICodePointToIUtf16,
  convertIGraphemeToIUtf16,
  detectRgStorageMode,
  getRgCodePointBoundaryUtf16,
  getRgGraphemeBoundaryUtf16
} from "./segmentation.ts";
import type { AttributedTextValue } from "./types.ts";

function assertUnitRange(iStart: number, iEnd: number, iLen: number): void {
  const bValidStart: boolean = Number.isInteger(iStart) && iStart >= 0 && iStart <= iLen;
  const bValidEnd: boolean = Number.isInteger(iEnd) && iEnd >= 0 && iEnd <= iLen;

  if (!bValidStart || !bValidEnd || iStart > iEnd) {
    throw new RangeError(`Invalid unit range [${iStart}, ${iEnd}) for length ${iLen}`);
  }
}

function getUnitCountForMode(value: AttributedTextValue): number {
  return value.rgIdStyleRef.length;
}

function convertIUnitToIUtf16(value: AttributedTextValue, iUnit: number): number {
  if (value.rgStorageMode === "fastCodeUnit") {
    return iUnit;
  }

  if (value.rgStorageMode === "fastCodePoint") {
    return convertICodePointToIUtf16(value.strText, iUnit);
  }

  return convertIGraphemeToIUtf16(value.strText, iUnit);
}

function convertIUnitToIUtf16ByMode(
  strText: string,
  rgStorageMode: AttributedTextValue["rgStorageMode"],
  iUnit: number
): number {
  if (rgStorageMode === "fastCodeUnit") {
    return iUnit;
  }

  if (rgStorageMode === "fastCodePoint") {
    return convertICodePointToIUtf16(strText, iUnit);
  }

  return convertIGraphemeToIUtf16(strText, iUnit);
}

function getInsertedUnitCount(strInsert: string, value: AttributedTextValue): number {
  if (value.rgStorageMode === "fastCodeUnit") {
    return strInsert.length;
  }

  if (value.rgStorageMode === "fastCodePoint") {
    return getRgCodePointBoundaryUtf16(strInsert).length - 1;
  }

  return getRgGraphemeBoundaryUtf16(strInsert).length - 1;
}

function buildRgSegGraphemeToUtf16(strText: string, value: AttributedTextValue): number[] {
  if (value.rgStorageMode !== "segmentedGrapheme") {
    return [];
  }

  const rgBoundaryUtf16: number[] = getRgGraphemeBoundaryUtf16(strText);
  return rgBoundaryUtf16.slice(1);
}

function buildRgSegGraphemeToUtf16ByMode(
  strText: string,
  rgStorageMode: AttributedTextValue["rgStorageMode"]
): number[] {
  if (rgStorageMode !== "segmentedGrapheme") {
    return [];
  }

  const rgBoundaryUtf16: number[] = getRgGraphemeBoundaryUtf16(strText);
  return rgBoundaryUtf16.slice(1);
}

function getUnitCountForModeAndText(
  strText: string,
  rgStorageMode: AttributedTextValue["rgStorageMode"]
): number {
  if (rgStorageMode === "fastCodeUnit") {
    return strText.length;
  }

  if (rgStorageMode === "fastCodePoint") {
    return getRgCodePointBoundaryUtf16(strText).length - 1;
  }

  return getRgGraphemeBoundaryUtf16(strText).length - 1;
}

function promoteStorageModeAfterEdit(strText: string): AttributedTextValue["rgStorageMode"] {
  return detectRgStorageMode(strText);
}

function rebuildStyleRefForMode(
  rgIdStyleRef: number[],
  rgStorageModeFrom: AttributedTextValue["rgStorageMode"],
  rgStorageModeTo: AttributedTextValue["rgStorageMode"],
  strTextFrom: string,
  strTextTo: string
): number[] {
  if (rgStorageModeFrom === rgStorageModeTo) {
    return rgIdStyleRef;
  }

  const iUnitCountTo: number = getUnitCountForModeAndText(strTextTo, rgStorageModeTo);
  if (iUnitCountTo === rgIdStyleRef.length) {
    return rgIdStyleRef;
  }

  const rgIdStyleRefTo: number[] = [];

  for (let iUnitTo: number = 0; iUnitTo < iUnitCountTo; iUnitTo += 1) {
    const iUtf16: number = convertIUnitToIUtf16ByMode(strTextTo, rgStorageModeTo, iUnitTo);
    let iUnitFrom: number = 0;

    while (
      iUnitFrom + 1 < rgIdStyleRef.length &&
      convertIUnitToIUtf16ByMode(strTextFrom, rgStorageModeFrom, iUnitFrom + 1) <= iUtf16
    ) {
      iUnitFrom += 1;
    }

    rgIdStyleRefTo.push(rgIdStyleRef[Math.min(iUnitFrom, rgIdStyleRef.length - 1)] ?? 0);
  }

  return rgIdStyleRefTo;
}

export function insertText(
  value: AttributedTextValue,
  iAt: number,
  strInsert: string,
  idStyleInsert: number = value.idStyleDefault
): AttributedTextValue {
  const iLen: number = getUnitCountForMode(value);
  assertUnitRange(iAt, iAt, iLen);

  if (strInsert.length === 0) {
    return value;
  }

  const iUtf16At: number = convertIUnitToIUtf16(value, iAt);
  const strTextNext: string =
    value.strText.slice(0, iUtf16At) + strInsert + value.strText.slice(iUtf16At);

  const iInsertedUnitCount: number = getInsertedUnitCount(strInsert, value);
  const rgIdStyleRefNext: number[] = [
    ...value.rgIdStyleRef.slice(0, iAt),
    ...new Array<number>(iInsertedUnitCount).fill(idStyleInsert),
    ...value.rgIdStyleRef.slice(iAt)
  ];

  const rgStorageModeNext: AttributedTextValue["rgStorageMode"] = promoteStorageModeAfterEdit(strTextNext);
  const rgIdStyleRefPromoted: number[] = rebuildStyleRefForMode(
    rgIdStyleRefNext,
    value.rgStorageMode,
    rgStorageModeNext,
    strTextNext,
    strTextNext
  );

  return {
    ...value,
    iVersion: value.iVersion + 1,
    rgStorageMode: rgStorageModeNext,
    strText: strTextNext,
    rgIdStyleRef: rgIdStyleRefPromoted,
    rgSegGraphemeToUtf16: buildRgSegGraphemeToUtf16ByMode(strTextNext, rgStorageModeNext)
  };
}

export function deleteTextRange(
  value: AttributedTextValue,
  iStart: number,
  iEnd: number
): AttributedTextValue {
  const iLen: number = getUnitCountForMode(value);
  assertUnitRange(iStart, iEnd, iLen);

  if (iStart === iEnd) {
    return value;
  }

  const iUtf16Start: number = convertIUnitToIUtf16(value, iStart);
  const iUtf16End: number = convertIUnitToIUtf16(value, iEnd);

  const strTextNext: string = value.strText.slice(0, iUtf16Start) + value.strText.slice(iUtf16End);

  const rgIdStyleRefNext: number[] = [
    ...value.rgIdStyleRef.slice(0, iStart),
    ...value.rgIdStyleRef.slice(iEnd)
  ];

  const rgStorageModeNext: AttributedTextValue["rgStorageMode"] = promoteStorageModeAfterEdit(strTextNext);
  const rgIdStyleRefPromoted: number[] = rebuildStyleRefForMode(
    rgIdStyleRefNext,
    value.rgStorageMode,
    rgStorageModeNext,
    strTextNext,
    strTextNext
  );

  return {
    ...value,
    iVersion: value.iVersion + 1,
    rgStorageMode: rgStorageModeNext,
    strText: strTextNext,
    rgIdStyleRef: rgIdStyleRefPromoted,
    rgSegGraphemeToUtf16: buildRgSegGraphemeToUtf16ByMode(strTextNext, rgStorageModeNext)
  };
}

export function replaceTextRange(
  value: AttributedTextValue,
  iStart: number,
  iEnd: number,
  strReplace: string,
  idStyleInsert: number = value.idStyleDefault
): AttributedTextValue {
  const iLen: number = getUnitCountForMode(value);
  assertUnitRange(iStart, iEnd, iLen);

  if (iStart === iEnd && strReplace.length === 0) {
    return value;
  }

  const iUtf16Start: number = convertIUnitToIUtf16(value, iStart);
  const iUtf16End: number = convertIUnitToIUtf16(value, iEnd);

  const strTextNext: string =
    value.strText.slice(0, iUtf16Start) + strReplace + value.strText.slice(iUtf16End);

  const iInsertedUnitCount: number = getInsertedUnitCount(strReplace, value);
  const rgIdStyleRefNext: number[] = [
    ...value.rgIdStyleRef.slice(0, iStart),
    ...new Array<number>(iInsertedUnitCount).fill(idStyleInsert),
    ...value.rgIdStyleRef.slice(iEnd)
  ];

  const rgStorageModeNext: AttributedTextValue["rgStorageMode"] = promoteStorageModeAfterEdit(strTextNext);
  const rgIdStyleRefPromoted: number[] = rebuildStyleRefForMode(
    rgIdStyleRefNext,
    value.rgStorageMode,
    rgStorageModeNext,
    strTextNext,
    strTextNext
  );

  return {
    ...value,
    iVersion: value.iVersion + 1,
    rgStorageMode: rgStorageModeNext,
    strText: strTextNext,
    rgIdStyleRef: rgIdStyleRefPromoted,
    rgSegGraphemeToUtf16: buildRgSegGraphemeToUtf16ByMode(strTextNext, rgStorageModeNext)
  };
}
