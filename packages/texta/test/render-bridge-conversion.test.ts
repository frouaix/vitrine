import { describe, expect, it } from "vitest";
import {
  convertRenderBridgeIUnitToIUtf16,
  convertRenderBridgeIUtf16ToIUnit,
  getRgRenderBridgeBoundaryUtf16
} from "../src/render-bridges.ts";
import type { AttributedTextValue, RgStorageMode, StyleEntry } from "../src/types.ts";
import { getRgGraphemeBoundaryUtf16 } from "../src/segmentation.ts";

function createValue(
  strText: string,
  rgStorageMode: RgStorageMode,
  rgIdStyleRef: number[],
  mpId_StyleEntry: Record<number, StyleEntry>,
  idStyleDefault: number = 0
): AttributedTextValue {
  const rgSegGraphemeToUtf16: number[] =
    rgStorageMode === "segmentedGrapheme"
      ? getRgGraphemeBoundaryUtf16(strText).slice(1)
      : [];

  return {
    iVersion: 1,
    rgUnits: "grapheme",
    rgStorageMode,
    strText,
    rgSegGraphemeToUtf16,
    rgIdStyleRef,
    mpId_StyleEntry,
    idStyleDefault
  };
}

describe("render bridge conversion helpers", () => {
  it("uses identity conversion in fastCodeUnit mode", () => {
    const value = createValue("abcd", "fastCodeUnit", [1, 1, 1, 1], { 0: {}, 1: {} });

    expect(convertRenderBridgeIUnitToIUtf16(value, 3)).toBe(3);
    expect(convertRenderBridgeIUtf16ToIUnit(value, 3)).toBe(3);
    expect(getRgRenderBridgeBoundaryUtf16(value)).toEqual([0, 1, 2, 3, 4]);
  });

  it("converts around surrogate pairs in fastCodePoint mode", () => {
    const value = createValue("A😀B", "fastCodePoint", [1, 1, 1], { 0: {}, 1: {} });

    expect(getRgRenderBridgeBoundaryUtf16(value)).toEqual([0, 1, 3, 4]);
    expect(convertRenderBridgeIUnitToIUtf16(value, 0)).toBe(0);
    expect(convertRenderBridgeIUnitToIUtf16(value, 1)).toBe(1);
    expect(convertRenderBridgeIUnitToIUtf16(value, 2)).toBe(3);
    expect(convertRenderBridgeIUnitToIUtf16(value, 3)).toBe(4);

    expect(convertRenderBridgeIUtf16ToIUnit(value, 0)).toBe(0);
    expect(convertRenderBridgeIUtf16ToIUnit(value, 1)).toBe(1);
    expect(convertRenderBridgeIUtf16ToIUnit(value, 2)).toBe(1);
    expect(convertRenderBridgeIUtf16ToIUnit(value, 3)).toBe(2);
    expect(convertRenderBridgeIUtf16ToIUnit(value, 4)).toBe(3);
  });

  it("converts through grapheme boundaries in segmentedGrapheme mode", () => {
    const value = createValue("e\u0301Z", "segmentedGrapheme", [1, 1], { 0: {}, 1: {} });

    expect(getRgRenderBridgeBoundaryUtf16(value)).toEqual([0, 2, 3]);
    expect(convertRenderBridgeIUnitToIUtf16(value, 0)).toBe(0);
    expect(convertRenderBridgeIUnitToIUtf16(value, 1)).toBe(2);
    expect(convertRenderBridgeIUnitToIUtf16(value, 2)).toBe(3);

    expect(convertRenderBridgeIUtf16ToIUnit(value, 0)).toBe(0);
    expect(convertRenderBridgeIUtf16ToIUnit(value, 1)).toBe(0);
    expect(convertRenderBridgeIUtf16ToIUnit(value, 2)).toBe(1);
    expect(convertRenderBridgeIUtf16ToIUnit(value, 3)).toBe(2);
  });
});
