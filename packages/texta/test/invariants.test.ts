import { describe, expect, it } from "vitest";
import { TextaValidationError } from "../src/errors.ts";
import type { AttributedTextValue } from "../src/types.ts";
import { validateAttributedTextValue } from "../src/invariants.ts";

function createValidFastCodeUnitValue(): AttributedTextValue {
  return {
    iVersion: 1,
    rgUnits: "grapheme",
    rgStorageMode: "fastCodeUnit",
    strText: "abc",
    rgSegGraphemeToUtf16: [],
    rgIdStyleRef: [0, 0, 0],
    mpId_StyleEntry: {
      0: {
        fontFamily: "Menlo",
        fontSize: 12
      }
    },
    idStyleDefault: 0
  };
}

describe("attributed text invariants", () => {
  it("accepts a valid fastCodeUnit value", () => {
    const attributedTextValue: AttributedTextValue = createValidFastCodeUnitValue();
    expect(() => validateAttributedTextValue(attributedTextValue)).not.toThrow();
  });

  it("rejects invalid root shapes", () => {
    expect(() => validateAttributedTextValue(null)).toThrow(TextaValidationError);
    expect(() => validateAttributedTextValue({})).toThrow(TextaValidationError);
  });

  it("rejects style-ref length mismatch for fastCodeUnit", () => {
    const attributedTextValue: AttributedTextValue = {
      ...createValidFastCodeUnitValue(),
      rgIdStyleRef: [0, 0]
    };

    expect(() => validateAttributedTextValue(attributedTextValue)).toThrow(
      "ERR_INVALID_STYLE_REF_LENGTH"
    );
  });

  it("rejects missing default style id", () => {
    const attributedTextValue: AttributedTextValue = {
      ...createValidFastCodeUnitValue(),
      idStyleDefault: 2
    };

    expect(() => validateAttributedTextValue(attributedTextValue)).toThrow(
      "ERR_MISSING_DEFAULT_STYLE"
    );
  });

  it("rejects invalid segmented mapping lengths", () => {
    const attributedTextValue: AttributedTextValue = {
      ...createValidFastCodeUnitValue(),
      rgStorageMode: "segmentedGrapheme",
      rgSegGraphemeToUtf16: [0, 1],
      rgIdStyleRef: [0, 0, 0]
    };

    expect(() => validateAttributedTextValue(attributedTextValue)).toThrow(
      "ERR_INVALID_SEGMENTATION"
    );
  });
});
