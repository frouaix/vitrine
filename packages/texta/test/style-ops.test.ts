import { describe, expect, it } from "vitest";
import type { AttributedTextValue } from "../src/types.ts";
import { applyStyle } from "../src/style-ops.ts";

function createValue(): AttributedTextValue {
  return {
    iVersion: 1,
    rgUnits: "grapheme",
    rgStorageMode: "fastCodeUnit",
    strText: "ab\ncd",
    rgSegGraphemeToUtf16: [],
    rgIdStyleRef: [0, 0, 0, 0, 0],
    mpId_StyleEntry: {
      0: {
        fontFamily: "Menlo",
        fontSize: 12,
        fill: "#111111",
        mpProp_Custom: {
          token: "body"
        }
      }
    },
    idStyleDefault: 0
  };
}

describe("applyStyle", () => {
  it("merge mode preserves unspecified properties", () => {
    const value = createValue();

    const next = applyStyle(value, 1, 4, { fill: "#ff0000" }, "merge");

    expect(next.iVersion).toBe(value.iVersion + 1);

    const idTarget = next.rgIdStyleRef[1];
    const styleTarget = next.mpId_StyleEntry[idTarget];

    expect(styleTarget.fontFamily).toBe("Menlo");
    expect(styleTarget.fontSize).toBe(12);
    expect(styleTarget.fill).toBe("#ff0000");
    expect(styleTarget.mpProp_Custom).toEqual({ token: "body" });
  });

  it("replace mode overwrites style entry fields", () => {
    const value = createValue();

    const next = applyStyle(value, 0, 2, { fill: "#00ff00" }, "replace");

    const idTarget = next.rgIdStyleRef[0];
    const styleTarget = next.mpId_StyleEntry[idTarget];

    expect(styleTarget.fill).toBe("#00ff00");
    expect(styleTarget.fontFamily).toBeUndefined();
    expect(styleTarget.fontSize).toBeUndefined();
  });

  it("returns same value for empty range", () => {
    const value = createValue();
    const next = applyStyle(value, 2, 2, { fill: "#00ff00" }, "merge");

    expect(next).toBe(value);
  });

  it("supports ranges crossing line breaks", () => {
    const value = createValue();

    const next = applyStyle(value, 1, 4, { underline: true }, "merge");

    expect(next.rgIdStyleRef[1]).toBe(next.rgIdStyleRef[2]);
    expect(next.rgIdStyleRef[2]).toBe(next.rgIdStyleRef[3]);
  });

  it("rejects out-of-range indices", () => {
    const value = createValue();

    expect(() => applyStyle(value, -1, 2, { fill: "#fff" }, "merge")).toThrow(RangeError);
    expect(() => applyStyle(value, 1, 6, { fill: "#fff" }, "merge")).toThrow(RangeError);
    expect(() => applyStyle(value, 3, 2, { fill: "#fff" }, "merge")).toThrow(RangeError);
  });
});
