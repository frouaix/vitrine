import { describe, expect, it } from "vitest";
import { detectRgStorageMode } from "../src/segmentation.ts";

describe("storage mode detection", () => {
  it("selects fastCodeUnit for plain ASCII and simple BMP", () => {
    expect(detectRgStorageMode("hello")).toBe("fastCodeUnit");
    expect(detectRgStorageMode("abc123!?")).toBe("fastCodeUnit");
    expect(detectRgStorageMode("Cafe")).toBe("fastCodeUnit");
  });

  it("selects fastCodePoint for surrogate-pair-only graphemes", () => {
    expect(detectRgStorageMode("😀😄")).toBe("fastCodePoint");
    expect(detectRgStorageMode("a😀b")).toBe("fastCodePoint");
  });

  it("selects segmentedGrapheme for combining-mark clusters", () => {
    expect(detectRgStorageMode("x\u0304")).toBe("segmentedGrapheme");
  });

  it("selects segmentedGrapheme for ZWJ sequences", () => {
    expect(detectRgStorageMode("👨‍👩‍👧‍👦")).toBe("segmentedGrapheme");
  });

  it("selects segmentedGrapheme for regional-indicator flags", () => {
    expect(detectRgStorageMode("🇫🇷")).toBe("segmentedGrapheme");
  });
});
