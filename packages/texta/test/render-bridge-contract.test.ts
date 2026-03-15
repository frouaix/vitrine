import { describe, expect, it } from "vitest";
import {
  convertRenderBridgeIUnitToIUtf16,
  getRgRenderBridgeBoundaryUtf16,
  getRgRenderBridgeRun,
  getRgRenderDecorationRange
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

function assertRendererContract(value: AttributedTextValue): void {
  const rgRun = getRgRenderBridgeRun(value);
  const rgBoundaryUtf16 = getRgRenderBridgeBoundaryUtf16(value);
  const rgDecor = getRgRenderDecorationRange(value);

  expect(rgBoundaryUtf16.length).toBe(value.rgIdStyleRef.length + 1);
  expect(rgBoundaryUtf16[0]).toBe(0);
  expect(rgBoundaryUtf16[rgBoundaryUtf16.length - 1]).toBe(value.strText.length);

  for (let iCur: number = 1; iCur < rgBoundaryUtf16.length; iCur += 1) {
    expect(rgBoundaryUtf16[iCur]).toBeGreaterThanOrEqual(rgBoundaryUtf16[iCur - 1]);
  }

  if (value.rgIdStyleRef.length === 0) {
    expect(rgRun).toEqual([]);
  } else {
    expect(rgRun[0].iStart).toBe(0);
    expect(rgRun[0].iUtf16Start).toBe(0);

    const lastRun = rgRun[rgRun.length - 1];
    expect(lastRun.iEnd).toBe(value.rgIdStyleRef.length);
    expect(lastRun.iUtf16End).toBe(value.strText.length);

    for (let iRun: number = 0; iRun < rgRun.length; iRun += 1) {
      const run = rgRun[iRun];

      expect(run.iStart).toBeLessThanOrEqual(run.iEnd);
      expect(run.iUtf16Start).toBeLessThanOrEqual(run.iUtf16End);
      expect(run.idStyle in value.mpId_StyleEntry).toBe(true);
      expect(run.iUtf16Start).toBe(convertRenderBridgeIUnitToIUtf16(value, run.iStart));
      expect(run.iUtf16End).toBe(convertRenderBridgeIUnitToIUtf16(value, run.iEnd));
      expect(run.strSlice).toBe(value.strText.slice(run.iUtf16Start, run.iUtf16End));

      if (iRun > 0) {
        const prev = rgRun[iRun - 1];
        expect(prev.iEnd).toBe(run.iStart);
        expect(prev.iUtf16End).toBe(run.iUtf16Start);
      }
    }
  }

  for (const decor of rgDecor) {
    expect(decor.idStyle in value.mpId_StyleEntry).toBe(true);

    const runMatch = rgRun.find(
      (run) =>
        run.iStart === decor.iStart &&
        run.iEnd === decor.iEnd &&
        run.iUtf16Start === decor.iUtf16Start &&
        run.iUtf16End === decor.iUtf16End &&
        run.idStyle === decor.idStyle
    );

    expect(runMatch).toBeDefined();
  }
}

describe("render bridge renderer contract", () => {
  it("satisfies renderer contract in fastCodeUnit mode", () => {
    const value = createValue(
      "abcd",
      "fastCodeUnit",
      [1, 1, 2, 3],
      {
        0: {},
        1: { fill: "red", underline: true },
        2: { fill: "blue" },
        3: { fill: "green", strikethrough: true }
      }
    );

    assertRendererContract(value);
  });

  it("satisfies renderer contract in fastCodePoint mode", () => {
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

    assertRendererContract(value);
  });

  it("satisfies renderer contract in segmentedGrapheme mode", () => {
    const value = createValue(
      "e\u0301Z",
      "segmentedGrapheme",
      [1, 2],
      {
        0: {},
        1: { fill: "red", underline: true },
        2: { fill: "blue" }
      }
    );

    assertRendererContract(value);
  });

  it("handles empty text value contract", () => {
    const value = createValue("", "fastCodeUnit", [], { 0: {} });

    assertRendererContract(value);
  });
});
