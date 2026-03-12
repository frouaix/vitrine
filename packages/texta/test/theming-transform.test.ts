import { describe, expect, it } from "vitest";
import type { AttributedTextValueSemantic, StyleEntry } from "../src/types.ts";
import {
  transformSemanticToRender,
  type ThemingTransformConfig
} from "../src/theming.ts";

function createSemanticValue(): AttributedTextValueSemantic {
  return {
    iVersion: 7,
    rgUnits: "grapheme",
    rgStorageMode: "fastCodeUnit",
    strText: "Title",
    rgSegGraphemeToUtf16: [],
    rgIdStyleRef: [1, 1, 1, 1, 1],
    mpId_StyleEntry: {
      0: {
        mpSemantic: {
          token: "body"
        }
      },
      1: {
        fill: "#ff0000",
        mpSemantic: {
          token: "heading",
          variant: "compact",
          state: "disabled"
        }
      }
    },
    idStyleDefault: 0
  };
}

describe("semantic to render theming transform", () => {
  it("preserves text and boundaries", () => {
    const valueSemantic = createSemanticValue();

    const cfgTheme: ThemingTransformConfig = {
      mpToken_StylePatch: {
        heading: {
          fontWeight: "bold"
        }
      }
    };

    const valueRender = transformSemanticToRender(valueSemantic, cfgTheme);

    expect(valueRender.strText).toBe(valueSemantic.strText);
    expect(valueRender.rgStorageMode).toBe(valueSemantic.rgStorageMode);
    expect(valueRender.rgSegGraphemeToUtf16).toEqual(valueSemantic.rgSegGraphemeToUtf16);
  });

  it("applies precedence token -> variant -> state -> explicit overrides", () => {
    const valueSemantic = createSemanticValue();

    const cfgTheme: ThemingTransformConfig = {
      mpToken_StylePatch: {
        heading: {
          fontFamily: "Menlo",
          fill: "#111111"
        }
      },
      mpVariant_StylePatch: {
        compact: {
          fontSize: 11
        }
      },
      mpState_StylePatch: {
        disabled: {
          opacity: 0.5
        }
      }
    };

    const valueRender = transformSemanticToRender(valueSemantic, cfgTheme);
    const idHeading = valueRender.rgIdStyleRef[0];
    const styleHeading = valueRender.mpId_StyleEntry[idHeading] as StyleEntry;

    expect(styleHeading.fontFamily).toBe("Menlo");
    expect(styleHeading.fontSize).toBe(11);
    expect(styleHeading.opacity).toBe(0.5);
    expect(styleHeading.fill).toBe("#ff0000");
  });

  it("is deterministic for same input and same theme", () => {
    const valueSemantic = createSemanticValue();
    const cfgTheme: ThemingTransformConfig = {
      mpToken_StylePatch: {
        heading: {
          fontWeight: "bold"
        }
      }
    };

    const vA = transformSemanticToRender(valueSemantic, cfgTheme);
    const vB = transformSemanticToRender(valueSemantic, cfgTheme);

    expect(vA.rgIdStyleRef).toEqual(vB.rgIdStyleRef);
    expect(vA.mpId_StyleEntry).toEqual(vB.mpId_StyleEntry);
  });
});
