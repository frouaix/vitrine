export type TextaValidationErrorCode = "ERR_INVALID_SHAPE" | "ERR_INVALID_FIELD" | "ERR_INVALID_STYLE_REF_LENGTH" | "ERR_INVALID_SEGMENTATION" | "ERR_MISSING_DEFAULT_STYLE";
export declare class TextaValidationError extends Error {
    readonly sCode: TextaValidationErrorCode;
    constructor(sCode: TextaValidationErrorCode, sMessage: string);
}
export declare function throwTextaValidationError(sCode: TextaValidationErrorCode, sMessage: string): never;
