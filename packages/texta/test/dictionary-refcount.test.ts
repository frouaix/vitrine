import { describe, expect, it } from "vitest";
import {
  cleanupUnreferencedStyles,
  createStyleDictionaryState,
  getStyleRefCount,
  internStyleEntry,
  releaseStyleId,
  retainStyleId
} from "../src/dictionary.ts";

describe("dictionary ref-count and cleanup hooks", () => {
  it("tracks retain/release operations", () => {
    const state = createStyleDictionaryState();
    const idStyle = internStyleEntry(state, {
      fill: "#111111",
      fontSize: 12
    });

    expect(getStyleRefCount(state, idStyle)).toBe(0);

    retainStyleId(state, idStyle);
    retainStyleId(state, idStyle);

    expect(getStyleRefCount(state, idStyle)).toBe(2);

    releaseStyleId(state, idStyle);

    expect(getStyleRefCount(state, idStyle)).toBe(1);
  });

  it("rejects releasing below zero", () => {
    const state = createStyleDictionaryState();
    const idStyle = internStyleEntry(state, {
      fill: "#111111"
    });

    expect(() => releaseStyleId(state, idStyle)).toThrow(RangeError);
  });

  it("cleans only unreferenced non-default styles", () => {
    const state = createStyleDictionaryState();

    const idKeepReferenced = internStyleEntry(state, {
      fill: "#111111",
      fontSize: 12
    });

    const idRemove = internStyleEntry(state, {
      fill: "#222222",
      fontSize: 12
    });

    retainStyleId(state, idKeepReferenced);

    const rgRemoved = cleanupUnreferencedStyles(state);

    expect(rgRemoved).toContain(idRemove);
    expect(rgRemoved).not.toContain(0);
    expect(rgRemoved).not.toContain(idKeepReferenced);
  });

  it("supports keep-list for cleanup", () => {
    const state = createStyleDictionaryState();

    const idKept = internStyleEntry(state, {
      fill: "#333333"
    });

    const idRemoved = internStyleEntry(state, {
      fill: "#444444"
    });

    const rgRemoved = cleanupUnreferencedStyles(state, [idKept]);

    expect(rgRemoved).toContain(idRemoved);
    expect(rgRemoved).not.toContain(idKept);
  });
});
