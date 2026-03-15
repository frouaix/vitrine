import { describe, expect, it } from "vitest";
import type { AttributedTextValue } from "../src/types.ts";
import { insertText } from "../src/text-ops.ts";

function createValueFastCodeUnit(): AttributedTextValue {
  return {
    iVersion: 1,
    rgUnits: "grapheme",
    rgStorageMode: "fastCodeUnit",
    strText: "ab",
    rgSegGraphemeToUtf16: [],
    rgIdStyleRef: [0, 0],
    mpId_StyleEntry: {
      0: { fill: "#111111" }
    },
    idStyleDefault: 0
  };
}

describe("text operation mode promotion", () => {
  it("promotes fastCodeUnit to fastCodePoint when surrogate pairs are inserted", () => {
    const value = createValueFastCodeUnit();

    const next = insertText(value, 1, "😀", 0);

    expect(next.rgStorageMode).toBe("fastCodePoint");
    expect(next.strText).toBe("a😀b");
    expect(next.rgIdStyleRef.length).toBe(3);
  });

  it("promotes to segmentedGrapheme for combining-mark clusters", () => {
    const value = createValueFastCodeUnit();

    const next = insertText(value, 1, "x\u0304", 0);

    expect(next.rgStorageMode).toBe("segmentedGrapheme");
    expect(next.rgSegGraphemeToUtf16.length).toBe(next.rgIdStyleRef.length);
  });

  it("promotes to segmentedGrapheme for ZWJ clusters", () => {
    const value = createValueFastCodeUnit();

    const next = insertText(value, 1, "👨‍👩‍👧‍👦", 0);

    expect(next.rgStorageMode).toBe("segmentedGrapheme");
    expect(next.rgSegGraphemeToUtf16.length).toBe(next.rgIdStyleRef.length);
  });

  it("keeps fastCodeUnit when insert text remains one code-unit per grapheme", () => {
    const value = createValueFastCodeUnit();

    const next = insertText(value, 1, "XY", 0);

    expect(next.rgStorageMode).toBe("fastCodeUnit");
    expect(next.rgIdStyleRef.length).toBe(4);
  });
});
