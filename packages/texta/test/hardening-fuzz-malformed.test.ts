import { describe, expect, it } from "vitest";
import { applyStyle } from "../src/style-ops.ts";
import { deleteTextRange, insertText, replaceTextRange } from "../src/text-ops.ts";
import { validateAttributedTextValue } from "../src/invariants.ts";
import {
  convertRenderBridgeIUnitToIUtf16,
  convertRenderBridgeIUtf16ToIUnit,
  getRenderBridgeSpan
} from "../src/render-bridges.ts";
import type { AttributedTextValue, StyleEntry } from "../src/types.ts";

function createSeededRandom(iSeed: number): () => number {
  let iState: number = iSeed >>> 0;

  return (): number => {
    iState = (1664525 * iState + 1013904223) >>> 0;
    return iState / 0x100000000;
  };
}

function pickInt(rand: () => number, iMin: number, iMaxExclusive: number): number {
  return iMin + Math.floor(rand() * (iMaxExclusive - iMin));
}

function pickFrom<T>(rand: () => number, rgValue: T[]): T {
  return rgValue[pickInt(rand, 0, rgValue.length)];
}

function createBaseValue(): AttributedTextValue {
  const strText: string = "hello";

  return {
    iVersion: 0,
    rgUnits: "grapheme",
    rgStorageMode: "fastCodeUnit",
    strText,
    rgSegGraphemeToUtf16: [],
    rgIdStyleRef: new Array<number>(strText.length).fill(0),
    mpId_StyleEntry: {
      0: {
        fontFamily: "Menlo",
        fontSize: 12,
        fill: "#000"
      }
    },
    idStyleDefault: 0
  };
}

function createRandomInsert(rand: () => number): string {
  return pickFrom(rand, ["a", "Z", "😀", "e\u0301", "🚀", "\n", ""]);
}

function createRandomStylePatch(rand: () => number): StyleEntry {
  return {
    fill: pickFrom(rand, ["#111", "#d00", "#0a0", "#00d"]),
    underline: pickFrom(rand, [true, false]),
    fontWeight: pickFrom(rand, ["400", "500", "700"]),
    mpProp_Custom: {
      tone: pickFrom(rand, ["warm", "cold", "neutral"])
    }
  };
}

describe("hardening: fuzz and malformed inputs", () => {
  it("preserves invariants under randomized edit/style sequences", () => {
    const rand = createSeededRandom(0xdecafbad);

    for (let iCase: number = 0; iCase < 20; iCase += 1) {
      let value: AttributedTextValue = createBaseValue();

      for (let iStep: number = 0; iStep < 80; iStep += 1) {
        const iLen: number = value.rgIdStyleRef.length;
        const op: string = pickFrom(rand, ["insert", "delete", "replace", "style"]);

        if (op === "insert") {
          const iAt: number = pickInt(rand, 0, iLen + 1);
          const strInsert: string = createRandomInsert(rand);
          value = insertText(value, iAt, strInsert);
        } else if (op === "delete") {
          const iStart: number = pickInt(rand, 0, iLen + 1);
          const iEnd: number = pickInt(rand, iStart, iLen + 1);
          value = deleteTextRange(value, iStart, iEnd);
        } else if (op === "replace") {
          const iStart: number = pickInt(rand, 0, iLen + 1);
          const iEnd: number = pickInt(rand, iStart, iLen + 1);
          const strReplace: string = createRandomInsert(rand);
          value = replaceTextRange(value, iStart, iEnd, strReplace);
        } else {
          const iStart: number = pickInt(rand, 0, iLen + 1);
          const iEnd: number = pickInt(rand, iStart, iLen + 1);
          const stylePatch: StyleEntry = createRandomStylePatch(rand);
          const mode = pickFrom(rand, ["merge", "replace"] as const);
          value = applyStyle(value, iStart, iEnd, stylePatch, mode);
        }

        expect(() => validateAttributedTextValue(value)).not.toThrow();
      }
    }
  });

  it("rejects malformed invariants payloads", () => {
    expect(() => validateAttributedTextValue(null)).toThrow();

    const badShape = {
      iVersion: 0,
      rgUnits: "grapheme",
      rgStorageMode: "fastCodeUnit",
      strText: "abc",
      rgSegGraphemeToUtf16: [],
      rgIdStyleRef: [0],
      mpId_StyleEntry: {},
      idStyleDefault: 0
    };

    expect(() => validateAttributedTextValue(badShape)).toThrow();
  });

  it("throws on invalid range inputs for mutating and bridge APIs", () => {
    const value: AttributedTextValue = createBaseValue();

    expect(() => insertText(value, -1, "x")).toThrow(RangeError);
    expect(() => deleteTextRange(value, 3, 2)).toThrow(RangeError);
    expect(() => replaceTextRange(value, 0, 10, "x")).toThrow(RangeError);
    expect(() => applyStyle(value, 2, 1, { fill: "#f00" }, "merge")).toThrow(RangeError);

    expect(() => convertRenderBridgeIUnitToIUtf16(value, value.rgIdStyleRef.length + 1)).toThrow(
      RangeError
    );
    expect(() => convertRenderBridgeIUtf16ToIUnit(value, value.strText.length + 1)).toThrow(
      RangeError
    );
    expect(() => getRenderBridgeSpan(value, 4, 2)).toThrow(RangeError);
  });
});
