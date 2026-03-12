import { describe, expect, it } from "vitest";
import type { AttributedTextValue } from "../src/types.ts";
import { deleteTextRange, insertText, replaceTextRange } from "../src/text-ops.ts";

function createFastCodeUnitValue(): AttributedTextValue {
  return {
    iVersion: 1,
    rgUnits: "grapheme",
    rgStorageMode: "fastCodeUnit",
    strText: "abcd",
    rgSegGraphemeToUtf16: [],
    rgIdStyleRef: [0, 0, 0, 0],
    mpId_StyleEntry: {
      0: { fill: "#111111" },
      1: { fill: "#ff0000" }
    },
    idStyleDefault: 0
  };
}

describe("text operations", () => {
  it("inserts text and keeps style refs aligned", () => {
    const value = createFastCodeUnitValue();

    const next = insertText(value, 2, "XY", 1);

    expect(next.iVersion).toBe(value.iVersion + 1);
    expect(next.strText).toBe("abXYcd");
    expect(next.rgIdStyleRef).toEqual([0, 0, 1, 1, 0, 0]);
  });

  it("deletes text range and style refs", () => {
    const value = createFastCodeUnitValue();

    const next = deleteTextRange(value, 1, 3);

    expect(next.strText).toBe("ad");
    expect(next.rgIdStyleRef).toEqual([0, 0]);
  });

  it("replaces a range", () => {
    const value = createFastCodeUnitValue();

    const next = replaceTextRange(value, 1, 3, "ZZ", 1);

    expect(next.strText).toBe("aZZd");
    expect(next.rgIdStyleRef).toEqual([0, 1, 1, 0]);
  });

  it("returns original value on no-op operations", () => {
    const value = createFastCodeUnitValue();

    expect(insertText(value, 2, "")).toBe(value);
    expect(deleteTextRange(value, 2, 2)).toBe(value);
    expect(replaceTextRange(value, 2, 2, "")).toBe(value);
  });

  it("updates segmented mapping in segmented mode", () => {
    const value: AttributedTextValue = {
      ...createFastCodeUnitValue(),
      rgStorageMode: "segmentedGrapheme",
      strText: "x\u0304y",
      rgIdStyleRef: [0, 0],
      rgSegGraphemeToUtf16: [2, 3]
    };

    const next = insertText(value, 1, "z", 1);

    expect(next.strText).toBe("x\u0304zy");
    expect(next.rgIdStyleRef.length).toBe(3);
    expect(next.rgSegGraphemeToUtf16).toEqual([2, 3, 4]);
  });

  it("throws on invalid ranges", () => {
    const value = createFastCodeUnitValue();

    expect(() => insertText(value, -1, "x")).toThrow(RangeError);
    expect(() => deleteTextRange(value, 3, 2)).toThrow(RangeError);
    expect(() => replaceTextRange(value, 0, 10, "x")).toThrow(RangeError);
  });
});
