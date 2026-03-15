import { describe, expect, it } from "vitest";
import {
  convertICodePointToIUtf16,
  convertIGraphemeToIUtf16,
  convertIUtf16ToICodePoint,
  convertIUtf16ToIGrapheme,
  getRgCodePointBoundaryUtf16,
  getRgGraphemeBoundaryUtf16
} from "../src/segmentation.ts";

describe("segmentation conversion helpers", () => {
  it("maps grapheme boundaries for ASCII", () => {
    expect(getRgGraphemeBoundaryUtf16("abc")).toEqual([0, 1, 2, 3]);
    expect(convertIGraphemeToIUtf16("abc", 2)).toBe(2);
    expect(convertIUtf16ToIGrapheme("abc", 3)).toBe(3);
  });

  it("maps code-point boundaries with surrogate pairs", () => {
    const strValue: string = "a😀b";

    expect(getRgCodePointBoundaryUtf16(strValue)).toEqual([0, 1, 3, 4]);
    expect(convertICodePointToIUtf16(strValue, 2)).toBe(3);
    expect(convertIUtf16ToICodePoint(strValue, 3)).toBe(2);
  });

  it("maps grapheme boundaries for combining-mark clusters", () => {
    const strValue: string = "x\u0304y";

    expect(getRgGraphemeBoundaryUtf16(strValue)).toEqual([0, 2, 3]);
    expect(convertIGraphemeToIUtf16(strValue, 1)).toBe(2);
    expect(convertIUtf16ToIGrapheme(strValue, 1)).toBe(0);
    expect(convertIUtf16ToIGrapheme(strValue, 2)).toBe(1);
  });

  it("maps grapheme boundaries for ZWJ sequences", () => {
    const strValue: string = "👨‍👩‍👧‍👦a";
    const rgBoundary: number[] = getRgGraphemeBoundaryUtf16(strValue);

    expect(rgBoundary.length).toBe(3);
    expect(rgBoundary[0]).toBe(0);
    expect(rgBoundary[2]).toBe(strValue.length);

    const iFamilyEnd: number = rgBoundary[1];

    expect(convertIGraphemeToIUtf16(strValue, 1)).toBe(iFamilyEnd);
    expect(convertIUtf16ToIGrapheme(strValue, iFamilyEnd)).toBe(1);
  });

  it("throws on out-of-range indices", () => {
    expect(() => convertIGraphemeToIUtf16("abc", 4)).toThrow(RangeError);
    expect(() => convertICodePointToIUtf16("abc", 4)).toThrow(RangeError);
    expect(() => convertIUtf16ToIGrapheme("abc", -1)).toThrow(RangeError);
    expect(() => convertIUtf16ToICodePoint("abc", -1)).toThrow(RangeError);
  });
});
