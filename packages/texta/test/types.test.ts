import { describe, expectTypeOf, it } from "vitest";
import type { AttributedTextValue, RgStorageMode, StyleEntry } from "../src/types.ts";

describe("core type surface", () => {
  it("defines supported storage modes", () => {
    expectTypeOf<RgStorageMode>().toEqualTypeOf<
      "fastCodeUnit" | "fastCodePoint" | "segmentedGrapheme"
    >();
  });

  it("supports style entries with standard rendering fields", () => {
    const styleValue: StyleEntry = {
      fontFamily: "Menlo",
      fontSize: 13,
      fontWeight: "bold",
      fill: "#111111",
      mpProp_Custom: {
        token: "heading"
      }
    };

    expectTypeOf(styleValue).toMatchTypeOf<StyleEntry>();
  });

  it("defines attributed text root structure", () => {
    const attributedTextValue: AttributedTextValue = {
      iVersion: 1,
      rgUnits: "grapheme",
      rgStorageMode: "fastCodeUnit",
      strText: "hello",
      rgSegGraphemeToUtf16: [],
      rgIdStyleRef: [0, 0, 0, 0, 0],
      mpId_StyleEntry: {
        0: {}
      },
      idStyleDefault: 0
    };

    expectTypeOf(attributedTextValue).toMatchTypeOf<AttributedTextValue>();
  });
});
