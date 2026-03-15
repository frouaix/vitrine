import { describe, expect, it } from "vitest";
import { TextaValidationError } from "../src/errors.ts";
import type { AttributedTextValue } from "../src/types.ts";
import { validateAttributedTextValue } from "../src/invariants.ts";

function createBaseValue(): AttributedTextValue {
  return {
    iVersion: 2,
    rgUnits: "grapheme",
    rgStorageMode: "fastCodeUnit",
    strText: "ok",
    rgSegGraphemeToUtf16: [],
    rgIdStyleRef: [0, 0],
    mpId_StyleEntry: {
      0: {
        fill: "#222222"
      }
    },
    idStyleDefault: 0
  };
}

describe("invariant validation immutability and determinism", () => {
  it("does not mutate valid input", () => {
    const attributedTextValue: AttributedTextValue = createBaseValue();
    const sBefore: string = JSON.stringify(attributedTextValue);

    validateAttributedTextValue(attributedTextValue);

    expect(JSON.stringify(attributedTextValue)).toBe(sBefore);
  });

  it("does not mutate invalid input", () => {
    const attributedTextValue: AttributedTextValue = {
      ...createBaseValue(),
      rgIdStyleRef: [0]
    };

    const sBefore: string = JSON.stringify(attributedTextValue);

    expect(() => validateAttributedTextValue(attributedTextValue)).toThrow(
      "ERR_INVALID_STYLE_REF_LENGTH"
    );
    expect(JSON.stringify(attributedTextValue)).toBe(sBefore);
  });

  it("uses code-point length for fastCodePoint mode", () => {
    const attributedTextValue: AttributedTextValue = {
      ...createBaseValue(),
      rgStorageMode: "fastCodePoint",
      strText: "😀a",
      rgIdStyleRef: [0, 0]
    };

    expect(() => validateAttributedTextValue(attributedTextValue)).not.toThrow();
  });

  it("emits deterministic coded validation errors", () => {
    const attributedTextValue: AttributedTextValue = {
      ...createBaseValue(),
      idStyleDefault: 3
    };

    try {
      validateAttributedTextValue(attributedTextValue);
      throw new Error("expected validation failure");
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(TextaValidationError);

      const typedError: TextaValidationError = error as TextaValidationError;
      expect(typedError.sCode).toBe("ERR_MISSING_DEFAULT_STYLE");
      expect(typedError.message).toBe(
        "ERR_MISSING_DEFAULT_STYLE: idStyleDefault must exist in mpId_StyleEntry"
      );
    }
  });
});
