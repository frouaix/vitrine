import type { AttributedTextValue } from "./types.ts";
export interface RenderBridgeRun {
    iStart: number;
    iEnd: number;
    iUtf16Start: number;
    iUtf16End: number;
    idStyle: number;
    strSlice: string;
}
export interface RenderBridgeSpan {
    iStart: number;
    iEnd: number;
    iUtf16Start: number;
    iUtf16End: number;
    strSlice: string;
}
export type RenderDecorationKind = "underline" | "strikethrough";
export interface RenderBridgeDecorationRange {
    sKind: RenderDecorationKind;
    iStart: number;
    iEnd: number;
    iUtf16Start: number;
    iUtf16End: number;
    idStyle: number;
}
export declare function getRgRenderBridgeBoundaryUtf16(value: AttributedTextValue): number[];
export declare function convertRenderBridgeIUnitToIUtf16(value: AttributedTextValue, iUnit: number): number;
export declare function convertRenderBridgeIUtf16ToIUnit(value: AttributedTextValue, iUtf16: number): number;
export declare function getRenderBridgeSpan(value: AttributedTextValue, iStart: number, iEnd: number): RenderBridgeSpan;
export declare function getRgRenderBridgeRun(value: AttributedTextValue): RenderBridgeRun[];
export declare function getRgRenderDecorationRange(value: AttributedTextValue): RenderBridgeDecorationRange[];
