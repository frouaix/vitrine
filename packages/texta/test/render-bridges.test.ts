import { describe, expect, it } from "vitest";
import {
  getRenderBridgeSpan,
  getRgRenderBridgeRun,
  getRgRenderDecorationRange,
  type RenderBridgeDecorationRange,
  type RenderBridgeRun
} from "../src/render-bridges.ts";
import type { AttributedTextValue, RgStorageMode, StyleEntry } from "../src/types.ts";
import { getRgGraphemeBoundaryUtf16 } from "../src/segmentation.ts";

function createValue(
  strText: string,
  rgStorageMode: RgStorageMode,
  rgIdStyleRef: number[],
  mpId_StyleEntry: Record<number, StyleEntry>,
  idStyleDefault: number = 0
): AttributedTextValue {
  const rgSegGraphemeToUtf16: number[] =
    rgStorageMode === "segmentedGrapheme"
      ? getRgGraphemeBoundaryUtf16(strText).slice(1)
      : [];

  return {
    iVersion: 1,
    rgUnits: "grapheme",
    rgStorageMode,
    strText,
    rgSegGraphemeToUtf16,
    rgIdStyleRef,
    mpId_StyleEntry,
    idStyleDefault
  };
}

describe("render bridges", () => {
  it("extracts render runs for fastCodeUnit", () => {
    const value = createValue(
      "abcd",
      "fastCodeUnit",
      [1, 1, 2, 2],
      {
        0: {},
        1: { fill: "red" },
        2: { fill: "blue" }
      }
    );

    const rgRun: RenderBridgeRun[] = getRgRenderBridgeRun(value);

    expect(rgRun).toEqual([
      {
        iStart: 0,
        iEnd: 2,
        iUtf16Start: 0,
        iUtf16End: 2,
        idStyle: 1,
        strSlice: "ab"
      },
      {
        iStart: 2,
        iEnd: 4,
        iUtf16Start: 2,
        iUtf16End: 4,
        idStyle: 2,
        strSlice: "cd"
      }
    ]);
  });

  it("extracts render runs for fastCodePoint", () => {
    const value = createValue(
      "A😀B",
      "fastCodePoint",
      [1, 2, 2],
      {
        0: {},
        1: { fill: "red" },
        2: { fill: "blue" }
      }
    );

    const rgRun: RenderBridgeRun[] = getRgRenderBridgeRun(value);

    expect(rgRun).toEqual([
      {
        iStart: 0,
        iEnd: 1,
        iUtf16Start: 0,
        iUtf16End: 1,
        idStyle: 1,
        strSlice: "A"
      },
      {
        iStart: 1,
        iEnd: 3,
        iUtf16Start: 1,
        iUtf16End: 4,
        idStyle: 2,
        strSlice: "😀B"
      }
    ]);
  });

  it("converts span boundaries in segmentedGrapheme mode", () => {
    const value = createValue(
      "e\u0301Z",
      "segmentedGrapheme",
      [1, 2],
      {
        0: {},
        1: { fill: "red" },
        2: { fill: "blue" }
      }
    );

    const span = getRenderBridgeSpan(value, 1, 2);

    expect(span).toEqual({
      iStart: 1,
      iEnd: 2,
      iUtf16Start: 2,
      iUtf16End: 3,
      strSlice: "Z"
    });
  });

  it("extracts decoration ranges from styled runs", () => {
    const value = createValue(
      "abcd",
      "fastCodeUnit",
      [1, 1, 2, 3],
      {
        0: {},
        1: { underline: true },
        2: { strikethrough: true },
        3: { underline: true, strikethrough: true }
      }
    );

    const rgDecor: RenderBridgeDecorationRange[] = getRgRenderDecorationRange(value);

    expect(rgDecor).toEqual([
      {
        sKind: "underline",
        iStart: 0,
        iEnd: 2,
        iUtf16Start: 0,
        iUtf16End: 2,
        idStyle: 1
      },
      {
        sKind: "strikethrough",
        iStart: 2,
        iEnd: 3,
        iUtf16Start: 2,
        iUtf16End: 3,
        idStyle: 2
      },
      {
        sKind: "underline",
        iStart: 3,
        iEnd: 4,
        iUtf16Start: 3,
        iUtf16End: 4,
        idStyle: 3
      },
      {
        sKind: "strikethrough",
        iStart: 3,
        iEnd: 4,
        iUtf16Start: 3,
        iUtf16End: 4,
        idStyle: 3
      }
    ]);
  });

  it("returns stable bridge output for repeated read-only extraction", () => {
    const value = createValue(
      "A😀B",
      "fastCodePoint",
      [1, 2, 2],
      {
        0: {},
        1: { fill: "red" },
        2: { fill: "blue", underline: true }
      }
    );

    const rgRunFirst: RenderBridgeRun[] = getRgRenderBridgeRun(value);
    const rgRunSecond: RenderBridgeRun[] = getRgRenderBridgeRun(value);

    expect(rgRunSecond).toEqual(rgRunFirst);
  });
});
