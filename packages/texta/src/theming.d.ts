import type { AttributedTextValueRender, AttributedTextValueSemantic, StyleEntry } from "./types.ts";
export interface ThemingTransformConfig {
    mpToken_StylePatch?: Record<string, StyleEntry>;
    mpVariant_StylePatch?: Record<string, StyleEntry>;
    mpState_StylePatch?: Record<string, StyleEntry>;
}
export interface ThemingTransformCacheOptions {
    idTheme: string;
    rgModeTheme?: string;
    iDpiBucket?: number;
}
export interface ThemingCacheEntry {
    valueRender: AttributedTextValueRender;
    mpIdStyleSemantic_IdStyleRender: Record<number, number>;
}
export interface ThemingCache {
    mpCacheKey_Entry: Record<string, ThemingCacheEntry>;
}
export interface ThemingTransformWithCacheResult {
    valueRender: AttributedTextValueRender;
    mpIdStyleSemantic_IdStyleRender: Record<number, number>;
    bUsedCache: boolean;
}
export declare function transformSemanticToRender(valueSemantic: AttributedTextValueSemantic, cfgTheme: ThemingTransformConfig): AttributedTextValueRender;
export declare function createThemingCache(): ThemingCache;
export declare function transformSemanticToRenderWithCache(valueSemantic: AttributedTextValueSemantic, cfgTheme: ThemingTransformConfig, cache: ThemingCache, options: ThemingTransformCacheOptions): ThemingTransformWithCacheResult;
