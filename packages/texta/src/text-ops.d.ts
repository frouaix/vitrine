import type { AttributedTextValue } from "./types.ts";
export declare function insertText(value: AttributedTextValue, iAt: number, strInsert: string, idStyleInsert?: number): AttributedTextValue;
export declare function deleteTextRange(value: AttributedTextValue, iStart: number, iEnd: number): AttributedTextValue;
export declare function replaceTextRange(value: AttributedTextValue, iStart: number, iEnd: number, strReplace: string, idStyleInsert?: number): AttributedTextValue;
