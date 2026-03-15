import { describe, expectTypeOf, it } from "vitest";
import type {
  AttributedTextValueRender,
  AttributedTextValueSemantic,
  RenderStyleEntry,
  SemanticStyleEntry
} from "../src/types.ts";

describe("semantic/render type conventions", () => {
  it("supports semantic symbolic properties", () => {
    const semanticStyle: SemanticStyleEntry = {
      mpSemantic: {
        token: "heading",
        state: "disabled",
        variant: "compact"
      },
      mpProp_Custom: {
        source: "form-title"
      }
    };

    expectTypeOf(semanticStyle).toMatchTypeOf<SemanticStyleEntry>();
  });

  it("supports render concrete properties", () => {
    const renderStyle: RenderStyleEntry = {
      fontFamily: "Menlo",
      fontSize: 13,
      fontWeight: "bold",
      fill: "#111111"
    };

    expectTypeOf(renderStyle).toMatchTypeOf<RenderStyleEntry>();
  });

  it("defines semantic and render value roots", () => {
    const semanticValue: AttributedTextValueSemantic = {
      iVersion: 1,
      rgUnits: "grapheme",
      rgStorageMode: "fastCodeUnit",
      strText: "abc",
      rgSegGraphemeToUtf16: [],
      rgIdStyleRef: [0, 0, 0],
      mpId_StyleEntry: {
        0: {
          mpSemantic: {
            token: "body"
          }
        }
      },
      idStyleDefault: 0
    };

    const renderValue: AttributedTextValueRender = {
      ...semanticValue,
      mpId_StyleEntry: {
        0: {
          fontFamily: "Menlo",
          fill: "#111111"
        }
      }
    };

    expectTypeOf(semanticValue).toMatchTypeOf<AttributedTextValueSemantic>();
    expectTypeOf(renderValue).toMatchTypeOf<AttributedTextValueRender>();
  });
});
