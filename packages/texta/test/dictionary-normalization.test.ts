import { describe, expect, it } from "vitest";
import type { StyleEntry } from "../src/types.ts";
import {
  computeStyleHash,
  normalizeStyleEntry,
  stringifyNormalizedStyleEntry
} from "../src/dictionary.ts";

describe("style normalization and hashing", () => {
  it("normalizes equivalent style entries to the same representation", () => {
    const styleA: StyleEntry = {
      fontFamily: "Menlo",
      fontSize: 13,
      fill: "#111111",
      mpProp_Custom: {
        token: "heading",
        state: {
          disabled: false,
          rank: 1
        }
      }
    };

    const styleB: StyleEntry = {
      fill: "#111111",
      fontSize: 13,
      fontFamily: "Menlo",
      mpProp_Custom: {
        state: {
          rank: 1,
          disabled: false
        },
        token: "heading"
      }
    };

    expect(normalizeStyleEntry(styleA)).toEqual(normalizeStyleEntry(styleB));
    expect(computeStyleHash(styleA)).toBe(computeStyleHash(styleB));
  });

  it("drops undefined properties from normalized output", () => {
    const styleValue: StyleEntry = {
      fontFamily: "Menlo",
      fontSize: undefined,
      mpProp_Custom: {
        flag: undefined,
        token: "label"
      }
    };

    const normalized = normalizeStyleEntry(styleValue);
    const serialized = stringifyNormalizedStyleEntry(normalized);

    expect(serialized).toContain("fontFamily");
    expect(serialized).toContain("token");
    expect(serialized).not.toContain("fontSize");
    expect(serialized).not.toContain("flag");
  });

  it("produces different hashes for materially different styles", () => {
    const baseStyle: StyleEntry = {
      fontFamily: "Menlo",
      fontSize: 13,
      fill: "#111111"
    };

    const modifiedStyle: StyleEntry = {
      ...baseStyle,
      fontSize: 14
    };

    expect(computeStyleHash(baseStyle)).not.toBe(computeStyleHash(modifiedStyle));
  });

  it("is stable for nested custom objects and arrays", () => {
    const styleValue: StyleEntry = {
      mpProp_Custom: {
        tags: ["a", "b", "c"],
        nested: {
          z: 2,
          a: 1
        }
      }
    };

    const h1 = computeStyleHash(styleValue);
    const h2 = computeStyleHash(styleValue);

    expect(h1).toBe(h2);
  });
});
