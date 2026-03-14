import type { AttributedTextValue, StyleEntry } from "./types.ts";
export type RgStyleApplyMode = "merge" | "replace";
export interface StyleRun {
    iStart: number;
    iEnd: number;
    idStyle: number;
}
export declare function getRgStyleRun(rgIdStyleRef: number[]): StyleRun[];
export declare function applyStyle(value: AttributedTextValue, iStart: number, iEnd: number, stylePatch: StyleEntry, rgMode: RgStyleApplyMode): AttributedTextValue;
