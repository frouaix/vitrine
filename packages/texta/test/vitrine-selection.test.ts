import { describe, expect, it } from "vitest";
import { group, text } from "vitrine";
import { createCharacterBoundsProviderFromBlockTree } from "../../gui/src/index.ts";
import { detectRgStorageMode, getRgCodePointBoundaryUtf16, getRgGraphemeBoundaryUtf16 } from "../src/index.ts";
import { registerTextaBlockType, texta } from "../src/vitrine.ts";
import type { AttributedTextValue, RgStorageMode, StyleEntry } from "../src/types.ts";

function getUnitCount(strText: string, rgStorageMode: RgStorageMode): number {
  if (rgStorageMode === "fastCodeUnit") {
    return strText.length;
  }
  if (rgStorageMode === "fastCodePoint") {
    return getRgCodePointBoundaryUtf16(strText).length - 1;
  }
  return getRgGraphemeBoundaryUtf16(strText).length - 1;
}

function getRgSegGraphemeToUtf16(strText: string, rgStorageMode: RgStorageMode): number[] {
  if (rgStorageMode !== "segmentedGrapheme") {
    return [];
  }
  return getRgGraphemeBoundaryUtf16(strText).slice(1);
}

function createAttributedText(strText: string, styleDefault: StyleEntry): AttributedTextValue {
  const rgStorageMode = detectRgStorageMode(strText);
  const iUnits = getUnitCount(strText, rgStorageMode);
  return {
    iVersion: 1,
    rgUnits: "grapheme",
    rgStorageMode,
    strText,
    rgSegGraphemeToUtf16: getRgSegGraphemeToUtf16(strText, rgStorageMode),
    rgIdStyleRef: new Array(iUnits).fill(1),
    mpId_StyleEntry: { 1: styleDefault },
    idStyleDefault: 1
  };
}

describe("texta selection geometry", () => {
  it("keeps regular text selection working while adding texta support", () => {
    registerTextaBlockType();

    const provider = createCharacterBoundsProviderFromBlockTree(
      group({}, [
        text({
          id: "plain",
          x: 10,
          y: 5,
          text: "Plain",
          fontSize: 20,
          baseline: "top"
        }),
        texta({
          id: "rich",
          x: 30,
          y: 40,
          dx: 25,
          baseline: "top",
          texta: createAttributedText("A😀 B", {
            fontFamily: "ui-sans-serif",
            fontSize: 18,
            lineHeight: 24,
            fill: "#111827"
          })
        })
      ])
    );

    const rcPlain0 = provider("plain", 0);
    const rcPlain1 = provider("plain", 1);
    const rcRich0 = provider("rich", 0);
    const rcRich1 = provider("rich", 1);
    const rcRich2 = provider("rich", 2);
    const rcRich3 = provider("rich", 3);

    expect(rcPlain0).not.toBeNull();
    expect(rcPlain1).not.toBeNull();
    expect(rcPlain1!.x).toBeGreaterThan(rcPlain0!.x);

    expect(rcRich0).not.toBeNull();
    expect(rcRich1).not.toBeNull();
    expect(rcRich2).not.toBeNull();
    expect(rcRich3).not.toBeNull();

    expect(rcRich0!.x).toBeGreaterThanOrEqual(30);
    expect(rcRich0!.y).toBeGreaterThanOrEqual(40);
    expect(rcRich1!.x).toBeGreaterThan(rcRich0!.x);
    expect(rcRich2!.x).toBeGreaterThanOrEqual(rcRich1!.x);
    expect(rcRich3!.y).toBeGreaterThan(rcRich0!.y);
  });
});