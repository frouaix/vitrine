export class TextaValidationError extends Error {
    sCode;
    constructor(sCode, sMessage) {
        super(`${sCode}: ${sMessage}`);
        this.name = "TextaValidationError";
        this.sCode = sCode;
    }
}
export function throwTextaValidationError(sCode, sMessage) {
    throw new TextaValidationError(sCode, sMessage);
}
