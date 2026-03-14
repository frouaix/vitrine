import type { RgStorageMode } from "./types.ts";
export declare function getRgGraphemeSegment(strText: string): string[];
export declare function getRgGraphemeBoundaryUtf16(strText: string): number[];
export declare function getRgCodePointBoundaryUtf16(strText: string): number[];
export declare function convertIGraphemeToIUtf16(strText: string, iGrapheme: number): number;
export declare function convertIUtf16ToIGrapheme(strText: string, iUtf16: number): number;
export declare function convertICodePointToIUtf16(strText: string, iCodePoint: number): number;
export declare function convertIUtf16ToICodePoint(strText: string, iUtf16: number): number;
export declare function detectRgStorageMode(strText: string): RgStorageMode;
