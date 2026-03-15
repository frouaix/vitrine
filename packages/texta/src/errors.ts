export type TextaValidationErrorCode =
  | "ERR_INVALID_SHAPE"
  | "ERR_INVALID_FIELD"
  | "ERR_INVALID_STYLE_REF_LENGTH"
  | "ERR_INVALID_SEGMENTATION"
  | "ERR_MISSING_DEFAULT_STYLE";

export class TextaValidationError extends Error {
  public readonly sCode: TextaValidationErrorCode;

  public constructor(sCode: TextaValidationErrorCode, sMessage: string) {
    super(`${sCode}: ${sMessage}`);
    this.name = "TextaValidationError";
    this.sCode = sCode;
  }
}

export function throwTextaValidationError(
  sCode: TextaValidationErrorCode,
  sMessage: string
): never {
  throw new TextaValidationError(sCode, sMessage);
}
