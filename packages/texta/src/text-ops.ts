import {
  convertICodePointToIUtf16,
  convertIGraphemeToIUtf16,
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

  return {
    ...value,
    iVersion: value.iVersion + 1,
    strText: strTextNext,
    rgIdStyleRef: rgIdStyleRefNext,
    rgSegGraphemeToUtf16: buildRgSegGraphemeToUtf16(strTextNext, value)
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

  return {
    ...value,
    iVersion: value.iVersion + 1,
    strText: strTextNext,
    rgIdStyleRef: rgIdStyleRefNext,
    rgSegGraphemeToUtf16: buildRgSegGraphemeToUtf16(strTextNext, value)
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

  const valueDeleted: AttributedTextValue = deleteTextRange(value, iStart, iEnd);
  return insertText(valueDeleted, iStart, strReplace, idStyleInsert);
}
