import { createStyleDictionaryStateFromEntries, internStyleEntry } from "./dictionary.js";
function mergeStyle(a, b) {
    const mpCustomA = a.mpProp_Custom ?? {};
    const mpCustomB = b.mpProp_Custom ?? {};
    return {
        ...a,
        ...b,
        mpProp_Custom: {
            ...mpCustomA,
            ...mpCustomB
        }
    };
}
function removeSemanticFields(styleSemantic) {
    const { mpSemantic: _ignored, ...rest } = styleSemantic;
    return rest;
}
function resolveSemanticPatch(mpSemantic, cfgTheme) {
    let styleResolved = {};
    const sToken = typeof mpSemantic?.token === "string" ? mpSemantic.token : undefined;
    const sVariant = typeof mpSemantic?.variant === "string" ? mpSemantic.variant : undefined;
    const sState = typeof mpSemantic?.state === "string" ? mpSemantic.state : undefined;
    if (sToken !== undefined) {
        styleResolved = mergeStyle(styleResolved, cfgTheme.mpToken_StylePatch?.[sToken] ?? {});
    }
    if (sVariant !== undefined) {
        styleResolved = mergeStyle(styleResolved, cfgTheme.mpVariant_StylePatch?.[sVariant] ?? {});
    }
    if (sState !== undefined) {
        styleResolved = mergeStyle(styleResolved, cfgTheme.mpState_StylePatch?.[sState] ?? {});
    }
    return styleResolved;
}
export function transformSemanticToRender(valueSemantic, cfgTheme) {
    const result = transformSemanticToRenderInternal(valueSemantic, cfgTheme);
    return result.valueRender;
}
export function createThemingCache() {
    return {
        mpCacheKey_Entry: {}
    };
}
function buildThemingCacheKey(valueSemantic, cfgTheme, options) {
    return JSON.stringify({
        iVersionSemantic: valueSemantic.iVersion,
        idTheme: options.idTheme,
        rgModeTheme: options.rgModeTheme ?? "default",
        iDpiBucket: options.iDpiBucket ?? 1,
        cfgTheme
    });
}
export function transformSemanticToRenderWithCache(valueSemantic, cfgTheme, cache, options) {
    const sCacheKey = buildThemingCacheKey(valueSemantic, cfgTheme, options);
    const cached = cache.mpCacheKey_Entry[sCacheKey];
    if (cached !== undefined) {
        return {
            valueRender: cached.valueRender,
            mpIdStyleSemantic_IdStyleRender: cached.mpIdStyleSemantic_IdStyleRender,
            bUsedCache: true
        };
    }
    const result = transformSemanticToRenderInternal(valueSemantic, cfgTheme);
    cache.mpCacheKey_Entry[sCacheKey] = {
        valueRender: result.valueRender,
        mpIdStyleSemantic_IdStyleRender: result.mpIdStyleSemantic_IdStyleRender
    };
    return {
        valueRender: result.valueRender,
        mpIdStyleSemantic_IdStyleRender: result.mpIdStyleSemantic_IdStyleRender,
        bUsedCache: false
    };
}
function transformSemanticToRenderInternal(valueSemantic, cfgTheme) {
    const state = createStyleDictionaryStateFromEntries(valueSemantic.mpId_StyleEntry, valueSemantic.idStyleDefault);
    state.mpId_StyleEntry = {};
    state.mpId_sCanonical = {};
    state.mpHash_rgIdStyleCandidate = {};
    state.mpId_nRefCount = {};
    state.iIdStyleNext = 0;
    const rgIdSemantic = Object.keys(valueSemantic.mpId_StyleEntry)
        .map((sId) => Number(sId))
        .sort((a, b) => a - b);
    const mpIdSemantic_IdRender = {};
    for (const idSemantic of rgIdSemantic) {
        const styleSemantic = valueSemantic.mpId_StyleEntry[idSemantic] ?? {};
        const styleBase = removeSemanticFields(styleSemantic);
        const styleFromSemantic = resolveSemanticPatch(styleSemantic.mpSemantic, cfgTheme);
        const styleRender = mergeStyle(styleFromSemantic, styleBase);
        const idRender = internStyleEntry(state, styleRender);
        mpIdSemantic_IdRender[idSemantic] = idRender;
    }
    const idStyleDefaultRender = mpIdSemantic_IdRender[valueSemantic.idStyleDefault] ?? valueSemantic.idStyleDefault;
    const rgIdStyleRefRender = valueSemantic.rgIdStyleRef.map((idSemantic) => {
        return mpIdSemantic_IdRender[idSemantic] ?? idStyleDefaultRender;
    });
    const valueRender = {
        iVersion: valueSemantic.iVersion,
        rgUnits: valueSemantic.rgUnits,
        rgStorageMode: valueSemantic.rgStorageMode,
        strText: valueSemantic.strText,
        rgSegGraphemeToUtf16: [...valueSemantic.rgSegGraphemeToUtf16],
        rgIdStyleRef: rgIdStyleRefRender,
        mpId_StyleEntry: state.mpId_StyleEntry,
        idStyleDefault: idStyleDefaultRender
    };
    return {
        valueRender,
        mpIdStyleSemantic_IdStyleRender: mpIdSemantic_IdRender
    };
}
