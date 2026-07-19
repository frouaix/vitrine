import { describe, expect, it } from "vitest";
import {
  Matrix2D,
  TransformStack,
  customBlock,
  group,
  registerBlockType,
  text,
  unregisterBlockType
} from "vitrine";
import type { CustomBlockHandlers, Rc, RenderContext, TextMeasure } from "vitrine";
import { createCharacterBoundsProviderFromBlockTree } from "../../gui/src/index.ts";
import { createCharacterBoundsAdapter } from "../../gui/src/selection/character-bounds-adapter.ts";
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

function createCountingRenderContext(): { context: RenderContext; getMeasureCount: () => number } {
  let cMeasure = 0;
  const context: RenderContext = {
    transformStack: new TransformStack(),
    opacity: 1,
    fVisible: true,
    save(): void {},
    restore(): void {},
    applyTransform(_xf: Matrix2D): void {},
    setOpacity(opacity: number): void {
      this.opacity = opacity;
    },
    setShadow(_shadow): void {},
    setFilter(_filter): void {},
    setBlendMode(_blendMode): void {},
    clipRect(_xl: number, _yl: number, _dxl: number, _dyl: number): void {},
    clear(): void {},
    drawRectangle(_xl: number, _yl: number, _dxl: number, _dyl: number): void {},
    drawCircle(_xl: number, _yl: number, _rl: number): void {},
    drawEllipse(_xl: number, _yl: number, _rxl: number, _ryl: number): void {},
    drawPath(_pathData: string): void {},
    drawLine(_xl1: number, _yl1: number, _xl2: number, _yl2: number): void {},
    drawText(_text: string, _xl: number, _yl: number): void {},
    drawImage(_image: HTMLImageElement, _xl: number, _yl: number, _dxl: number, _dyl: number): void {},
    drawArc(_xl: number, _yl: number, _rl: number, _startAngle: number, _endAngle: number): void {},
    measureText(text: string, props: { font?: string; fontSize?: number }): TextMeasure {
      cMeasure += 1;
      const fontSize = props.fontSize ?? 16;
      const width = Array.from(text).length * fontSize * 0.6;
      return {
        width,
        height: fontSize,
        ascent: fontSize * 0.8,
        descent: fontSize * 0.2
      };
    }
  };

  return {
    context,
    getMeasureCount: (): number => cMeasure
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

  it("keeps custom selection geometry lazy across unchanged frames", () => {
    const stBlockType = "test-selection-lazy";
    let cResolve = 0;
    const handlers: CustomBlockHandlers = {
      getSelectionGeometry: (block) => {
        const {
          id,
          stLayoutSignature
        } = block.props as { id: string; stLayoutSignature: string };
        return {
          blockId: id,
          layoutSignature: stLayoutSignature,
          resolveCharacterBounds: (): Rc[] => {
            cResolve += 1;
            return [{
              x: 0,
              y: 0,
              width: 12,
              height: 18
            }];
          }
        };
      }
    };

    registerBlockType(stBlockType, handlers);

    try {
      const adapter = createCharacterBoundsAdapter();
      const provider = adapter.getProvider();

      adapter.updateFromBlockTree(group({}, [
        customBlock(stBlockType, {
          id: "lazy",
          stLayoutSignature: "sig-a"
        })
      ]));
      expect(cResolve).toBe(0);

      expect(provider("lazy", 0)).toEqual({
        x: 0,
        y: 0,
        width: 12,
        height: 18
      });
      expect(cResolve).toBe(1);

      adapter.updateFromBlockTree(group({}, [
        customBlock(stBlockType, {
          id: "lazy",
          stLayoutSignature: "sig-a"
        })
      ]));
      expect(provider("lazy", 0)).toEqual({
        x: 0,
        y: 0,
        width: 12,
        height: 18
      });
      expect(cResolve).toBe(1);

      adapter.updateFromBlockTree(group({}, [
        customBlock(stBlockType, {
          id: "lazy",
          stLayoutSignature: "sig-a",
          x: 15
        })
      ]));
      expect(provider("lazy", 0)).toEqual({
        x: 15,
        y: 0,
        width: 12,
        height: 18
      });
      expect(cResolve).toBe(1);

      adapter.updateFromBlockTree(group({}, [
        customBlock(stBlockType, {
          id: "lazy",
          stLayoutSignature: "sig-b"
        })
      ]));
      expect(provider("lazy", 0)).toEqual({
        x: 0,
        y: 0,
        width: 12,
        height: 18
      });
      expect(cResolve).toBe(2);
    } finally {
      unregisterBlockType(stBlockType);
    }
  });

  it("reuses texta layout across unchanged frames and transform-only updates", () => {
    registerTextaBlockType();

    const { context, getMeasureCount } = createCountingRenderContext();
    const adapter = createCharacterBoundsAdapter({ context });
    const provider = adapter.getProvider();
    const styleDefault: StyleEntry = {
      fontFamily: "ui-sans-serif",
      fontSize: 18,
      lineHeight: 24,
      fill: "#111827"
    };
    const textValue = createAttributedText("Reuse 😀 cache", styleDefault);
    const createRoot = (props: { x?: number; dx?: number; texta?: AttributedTextValue } = {}) => (
      group({}, [
        texta({
          id: "rich-cached",
          x: props.x ?? 0,
          dx: props.dx ?? 90,
          baseline: "top",
          texta: props.texta ?? textValue
        })
      ])
    );

    adapter.updateFromBlockTree(createRoot());
    expect(getMeasureCount()).toBe(0);

    const rcInitial = provider("rich-cached", 0);
    expect(rcInitial).not.toBeNull();
    const cMeasureAfterFirstRead = getMeasureCount();
    expect(cMeasureAfterFirstRead).toBeGreaterThan(0);

    adapter.updateFromBlockTree(createRoot());
    const rcStable = provider("rich-cached", 0);
    expect(rcStable).toEqual(rcInitial);
    expect(getMeasureCount()).toBe(cMeasureAfterFirstRead);

    adapter.updateFromBlockTree(createRoot({ x: 30 }));
    const rcMoved = provider("rich-cached", 0);
    expect(rcMoved).not.toBeNull();
    expect(rcMoved!.x).toBe((rcInitial?.x ?? 0) + 30);
    expect(getMeasureCount()).toBe(cMeasureAfterFirstRead);

    const textChanged = {
      ...createAttributedText("Reuse 😀 cache again", styleDefault),
      iVersion: textValue.iVersion + 1
    };
    adapter.updateFromBlockTree(createRoot({ texta: textChanged }));
    const rcChanged = provider("rich-cached", 0);
    expect(rcChanged).not.toBeNull();
    expect(getMeasureCount()).toBeGreaterThan(cMeasureAfterFirstRead);
  });
});