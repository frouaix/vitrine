import { describe, expect, it } from "vitest";
import type { AttributedTextValue } from "../src/types.ts";
import { deleteTextRange, insertText, replaceTextRange } from "../src/text-ops.ts";

function createValue(): AttributedTextValue {
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

describe("text op mixed-sequence regression", () => {
  it("preserves style/text alignment over mixed operations", () => {
    let value = createValue();

    value = insertText(value, 2, "😀", 1);
    value = replaceTextRange(value, 1, 3, "x\u0304", 0);
    value = deleteTextRange(value, 0, 1);
    value = insertText(value, value.rgIdStyleRef.length, "Z", 1);

    expect(value.strText.length).toBeGreaterThan(0);
    expect(value.rgIdStyleRef.length).toBeGreaterThan(0);

    if (value.rgStorageMode === "segmentedGrapheme") {
      expect(value.rgSegGraphemeToUtf16.length).toBe(value.rgIdStyleRef.length);
    } else {
      expect(value.rgSegGraphemeToUtf16).toEqual([]);
    }
  });

  it("increments version on each non-noop operation", () => {
    const value = createValue();

    const v1 = insertText(value, 1, "X");
    const v2 = deleteTextRange(v1, 0, 1);
    const v3 = replaceTextRange(v2, 1, 2, "YZ");

    expect(v1.iVersion).toBe(value.iVersion + 1);
    expect(v2.iVersion).toBe(v1.iVersion + 1);
    expect(v3.iVersion).toBe(v2.iVersion + 1);
  });

  it("keeps no-op operations identity-stable", () => {
    const value = createValue();

    expect(insertText(value, 2, "")).toBe(value);
    expect(deleteTextRange(value, 1, 1)).toBe(value);
    expect(replaceTextRange(value, 2, 2, "")).toBe(value);
  });
});
