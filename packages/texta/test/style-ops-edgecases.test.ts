import { describe, expect, it } from "vitest";
import type { AttributedTextValue } from "../src/types.ts";
import { applyStyle } from "../src/style-ops.ts";

function createValue(): AttributedTextValue {
  return {
    iVersion: 10,
    rgUnits: "grapheme",
    rgStorageMode: "fastCodeUnit",
    strText: "abcd",
    rgSegGraphemeToUtf16: [],
    rgIdStyleRef: [0, 0, 0, 0],
    mpId_StyleEntry: {
      0: {
        fontFamily: "Menlo",
        fill: "#111111",
        mpProp_Custom: {
          token: "body",
          emphasis: "normal"
        }
      }
    },
    idStyleDefault: 0
  };
}

describe("style operation edge cases", () => {
  it("merge mode merges custom properties without dropping existing keys", () => {
    const value = createValue();

    const next = applyStyle(
      value,
      1,
      3,
      {
        mpProp_Custom: {
          emphasis: "strong",
          tone: "warning"
        }
      },
      "merge"
    );

    const idTarget = next.rgIdStyleRef[1];
    const styleTarget = next.mpId_StyleEntry[idTarget];

    expect(styleTarget.mpProp_Custom).toEqual({
      token: "body",
      emphasis: "strong",
      tone: "warning"
    });
  });

  it("replace mode keeps only patch fields", () => {
    const value = createValue();

    const next = applyStyle(
      value,
      0,
      2,
      {
        mpProp_Custom: {
          token: "caption"
        }
      },
      "replace"
    );

    const idTarget = next.rgIdStyleRef[0];
    const styleTarget = next.mpId_StyleEntry[idTarget];

    expect(styleTarget.fontFamily).toBeUndefined();
    expect(styleTarget.fill).toBeUndefined();
    expect(styleTarget.mpProp_Custom).toEqual({ token: "caption" });
  });

  it("returns original value when applying equivalent merge patch", () => {
    const value = createValue();

    const next = applyStyle(
      value,
      0,
      4,
      {
        fontFamily: "Menlo",
        fill: "#111111",
        mpProp_Custom: {
          token: "body",
          emphasis: "normal"
        }
      },
      "merge"
    );

    expect(next).toBe(value);
    expect(next.iVersion).toBe(value.iVersion);
  });

  it("handles full-range style application", () => {
    const value = createValue();

    const next = applyStyle(value, 0, value.rgIdStyleRef.length, { underline: true }, "merge");

    const idStyle = next.rgIdStyleRef[0];
    expect(next.rgIdStyleRef.every((idCur) => idCur === idStyle)).toBe(true);
    expect(next.mpId_StyleEntry[idStyle].underline).toBe(true);
  });
});
