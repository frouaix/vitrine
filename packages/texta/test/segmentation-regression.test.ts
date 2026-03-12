import { describe, expect, it } from "vitest";
import {
  detectRgStorageMode,
  getRgCodePointBoundaryUtf16,
  getRgGraphemeBoundaryUtf16
} from "../src/segmentation.ts";

describe("segmentation regression corpus", () => {
  it("covers ASCII and Latin BMP", () => {
    const strValue: string = "Bonjour";

    expect(detectRgStorageMode(strValue)).toBe("fastCodeUnit");
    expect(getRgGraphemeBoundaryUtf16(strValue)).toEqual(getRgCodePointBoundaryUtf16(strValue));
  });

  it("covers surrogate-pair emoji sequences without joiners", () => {
    const strValue: string = "😀😄";

    expect(detectRgStorageMode(strValue)).toBe("fastCodePoint");
    expect(getRgCodePointBoundaryUtf16(strValue)).toEqual([0, 2, 4]);
    expect(getRgGraphemeBoundaryUtf16(strValue)).toEqual([0, 2, 4]);
  });

  it("covers combining marks", () => {
    const strValue: string = "x\u0304";

    expect(detectRgStorageMode(strValue)).toBe("segmentedGrapheme");
    expect(getRgCodePointBoundaryUtf16(strValue)).toEqual([0, 1, 2]);
    expect(getRgGraphemeBoundaryUtf16(strValue)).toEqual([0, 2]);
  });

  it("covers ZWJ sequences", () => {
    const strValue: string = "👨‍👩‍👧‍👦";

    expect(detectRgStorageMode(strValue)).toBe("segmentedGrapheme");
    expect(getRgGraphemeBoundaryUtf16(strValue)).toEqual([0, strValue.length]);
    expect(getRgCodePointBoundaryUtf16(strValue).length).toBeGreaterThan(2);
  });

  it("covers regional-indicator flags", () => {
    const strValue: string = "🇫🇷";

    expect(detectRgStorageMode(strValue)).toBe("segmentedGrapheme");
    expect(getRgCodePointBoundaryUtf16(strValue)).toEqual([0, 2, 4]);
    expect(getRgGraphemeBoundaryUtf16(strValue)).toEqual([0, 4]);
  });

  it("covers Indic complex-script sample", () => {
    const strValue: string = "क्ष";

    expect(detectRgStorageMode(strValue)).toBe("segmentedGrapheme");
    expect(getRgCodePointBoundaryUtf16(strValue).length).toBeGreaterThan(2);
    expect(getRgGraphemeBoundaryUtf16(strValue).length).toBeLessThanOrEqual(
      getRgCodePointBoundaryUtf16(strValue).length
    );
  });
});
