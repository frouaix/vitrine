import type { StyleEntry } from "./types.ts";
export type NormalizedStyleEntry = Record<string, unknown>;
export interface StyleDictionaryState {
    iIdStyleNext: number;
    mpId_StyleEntry: Record<number, StyleEntry>;
    mpId_sCanonical: Record<number, string>;
    mpHash_rgIdStyleCandidate: Record<string, number[]>;
    mpId_nRefCount: Record<number, number>;
}
export declare function normalizeStyleEntry(styleEntry: StyleEntry): NormalizedStyleEntry;
export declare function stringifyNormalizedStyleEntry(styleEntry: NormalizedStyleEntry): string;
export declare function computeStyleHash(styleEntry: StyleEntry): string;
export declare function createStyleDictionaryState(styleDefault?: StyleEntry): StyleDictionaryState;
export declare function createStyleDictionaryStateFromEntries(mpId_StyleEntry: Record<number, StyleEntry>, idStyleDefault: number): StyleDictionaryState;
export declare function getStyleEntryById(state: StyleDictionaryState, idStyle: number): StyleEntry | undefined;
export declare function internStyleEntry(state: StyleDictionaryState, styleEntry: StyleEntry, sHashOverride?: string): number;
export declare function getStyleRefCount(state: StyleDictionaryState, idStyle: number): number;
export declare function retainStyleId(state: StyleDictionaryState, idStyle: number): number;
export declare function releaseStyleId(state: StyleDictionaryState, idStyle: number): number;
export declare function cleanupUnreferencedStyles(state: StyleDictionaryState, rgIdStyleKeep?: number[]): number[];
