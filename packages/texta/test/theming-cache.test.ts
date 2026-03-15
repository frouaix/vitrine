import { describe, expect, it } from "vitest";
import type { AttributedTextValueSemantic } from "../src/types.ts";
import {
  createThemingCache,
  transformSemanticToRenderWithCache,
  type ThemingTransformConfig
} from "../src/theming.ts";

function createSemanticValue(): AttributedTextValueSemantic {
  return {
    iVersion: 3,
    rgUnits: "grapheme",
    rgStorageMode: "fastCodeUnit",
    strText: "abc",
    rgSegGraphemeToUtf16: [],
    rgIdStyleRef: [1, 1, 1],
    mpId_StyleEntry: {
      0: {
        mpSemantic: {
          token: "body"
        }
      },
      1: {
        mpSemantic: {
          token: "heading"
        }
      }
    },
    idStyleDefault: 0
  };
}

describe("theming cache and remap reuse", () => {
  it("uses cache on repeated calls with same key", () => {
    const valueSemantic = createSemanticValue();
    const cfgTheme: ThemingTransformConfig = {
      mpToken_StylePatch: {
        heading: { fontWeight: "bold" }
      }
    };

    const cache = createThemingCache();

    const first = transformSemanticToRenderWithCache(valueSemantic, cfgTheme, cache, {
      idTheme: "default"
    });

    const second = transformSemanticToRenderWithCache(valueSemantic, cfgTheme, cache, {
      idTheme: "default"
    });

    expect(first.bUsedCache).toBe(false);
    expect(second.bUsedCache).toBe(true);
    expect(second.valueRender).toEqual(first.valueRender);
    expect(second.mpIdStyleSemantic_IdStyleRender).toEqual(first.mpIdStyleSemantic_IdStyleRender);
  });

  it("misses cache when theme key changes", () => {
    const valueSemantic = createSemanticValue();
    const cfgTheme: ThemingTransformConfig = {
      mpToken_StylePatch: {
        heading: { fontWeight: "bold" }
      }
    };

    const cache = createThemingCache();

    const first = transformSemanticToRenderWithCache(valueSemantic, cfgTheme, cache, {
      idTheme: "default"
    });

    const second = transformSemanticToRenderWithCache(valueSemantic, cfgTheme, cache, {
      idTheme: "high-contrast"
    });

    expect(first.bUsedCache).toBe(false);
    expect(second.bUsedCache).toBe(false);
  });
});
