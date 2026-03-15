import { describe, expect, it } from "vitest";
import type { StyleEntry } from "../src/types.ts";
import {
  createStyleDictionaryState,
  getStyleEntryById,
  internStyleEntry
} from "../src/dictionary.ts";

describe("style dictionary interning", () => {
  it("initializes with default style id 0", () => {
    const state = createStyleDictionaryState();

    expect(state.iIdStyleNext).toBe(1);
    expect(getStyleEntryById(state, 0)).toEqual({});
  });

  it("reuses id for equivalent style entries", () => {
    const state = createStyleDictionaryState();

    const styleA: StyleEntry = {
      fill: "#111111",
      fontFamily: "Menlo",
      mpProp_Custom: {
        token: "heading",
        level: 1
      }
    };

    const styleB: StyleEntry = {
      mpProp_Custom: {
        level: 1,
        token: "heading"
      },
      fontFamily: "Menlo",
      fill: "#111111"
    };

    const idA = internStyleEntry(state, styleA);
    const idB = internStyleEntry(state, styleB);

    expect(idA).toBe(idB);
    expect(state.iIdStyleNext).toBe(2);
  });

  it("allocates new ids for different style entries", () => {
    const state = createStyleDictionaryState();

    const idA = internStyleEntry(state, {
      fill: "#111111",
      fontSize: 12
    });

    const idB = internStyleEntry(state, {
      fill: "#111111",
      fontSize: 14
    });

    expect(idB).toBeGreaterThan(idA);
    expect(idA).not.toBe(idB);
  });

  it("resolves hash collisions using canonical equality", () => {
    const state = createStyleDictionaryState();

    const idA = internStyleEntry(
      state,
      {
        fill: "#111111",
        fontSize: 12
      },
      "forced-collision"
    );

    const idB = internStyleEntry(
      state,
      {
        fill: "#111111",
        fontSize: 14
      },
      "forced-collision"
    );

    expect(idA).not.toBe(idB);
    expect(getStyleEntryById(state, idA)).toEqual({
      fill: "#111111",
      fontSize: 12
    });
    expect(getStyleEntryById(state, idB)).toEqual({
      fill: "#111111",
      fontSize: 14
    });
  });
});
