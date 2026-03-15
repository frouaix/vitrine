import {
  createStyleDictionaryStateFromEntries,
  internStyleEntry
} from "./dictionary.ts";
import type {
  AttributedTextValueRender,
  AttributedTextValueSemantic,
  RenderStyleEntry,
  SemanticStyleEntry,
  SemanticStyleMeta,
  StyleEntry
} from "./types.ts";

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

interface ThemingTransformInternalResult {
  valueRender: AttributedTextValueRender;
  mpIdStyleSemantic_IdStyleRender: Record<number, number>;
}

function mergeStyle(a: StyleEntry, b: StyleEntry): StyleEntry {
  const mpCustomA: Record<string, unknown> = a.mpProp_Custom ?? {};
  const mpCustomB: Record<string, unknown> = b.mpProp_Custom ?? {};

  return {
    ...a,
    ...b,
    mpProp_Custom: {
      ...mpCustomA,
      ...mpCustomB
    }
  };
}

function removeSemanticFields(styleSemantic: SemanticStyleEntry): RenderStyleEntry {
  const { mpSemantic: _ignored, ...rest } = styleSemantic;
  return rest;
}

function resolveSemanticPatch(
  mpSemantic: SemanticStyleMeta | undefined,
  cfgTheme: ThemingTransformConfig
): StyleEntry {
  let styleResolved: StyleEntry = {};

  const sToken: string | undefined = typeof mpSemantic?.token === "string" ? mpSemantic.token : undefined;
  const sVariant: string | undefined =
    typeof mpSemantic?.variant === "string" ? mpSemantic.variant : undefined;
  const sState: string | undefined = typeof mpSemantic?.state === "string" ? mpSemantic.state : undefined;

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

export function transformSemanticToRender(
  valueSemantic: AttributedTextValueSemantic,
  cfgTheme: ThemingTransformConfig
): AttributedTextValueRender {
  const result = transformSemanticToRenderInternal(valueSemantic, cfgTheme);
  return result.valueRender;
}

export function createThemingCache(): ThemingCache {
  return {
    mpCacheKey_Entry: {}
  };
}

function buildThemingCacheKey(
  valueSemantic: AttributedTextValueSemantic,
  cfgTheme: ThemingTransformConfig,
  options: ThemingTransformCacheOptions
): string {
  return JSON.stringify({
    iVersionSemantic: valueSemantic.iVersion,
    idTheme: options.idTheme,
    rgModeTheme: options.rgModeTheme ?? "default",
    iDpiBucket: options.iDpiBucket ?? 1,
    cfgTheme
  });
}

export function transformSemanticToRenderWithCache(
  valueSemantic: AttributedTextValueSemantic,
  cfgTheme: ThemingTransformConfig,
  cache: ThemingCache,
  options: ThemingTransformCacheOptions
): ThemingTransformWithCacheResult {
  const sCacheKey: string = buildThemingCacheKey(valueSemantic, cfgTheme, options);
  const cached: ThemingCacheEntry | undefined = cache.mpCacheKey_Entry[sCacheKey];

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

function transformSemanticToRenderInternal(
  valueSemantic: AttributedTextValueSemantic,
  cfgTheme: ThemingTransformConfig
): ThemingTransformInternalResult {
  const state = createStyleDictionaryStateFromEntries(
    valueSemantic.mpId_StyleEntry,
    valueSemantic.idStyleDefault
  );

  state.mpId_StyleEntry = {};
  state.mpId_sCanonical = {};
  state.mpHash_rgIdStyleCandidate = {};
  state.mpId_nRefCount = {};
  state.iIdStyleNext = 0;

  const rgIdSemantic: number[] = Object.keys(valueSemantic.mpId_StyleEntry)
    .map((sId: string) => Number(sId))
    .sort((a: number, b: number) => a - b);

  const mpIdSemantic_IdRender: Record<number, number> = {};

  for (const idSemantic of rgIdSemantic) {
    const styleSemantic: SemanticStyleEntry = valueSemantic.mpId_StyleEntry[idSemantic] ?? {};
    const styleBase: RenderStyleEntry = removeSemanticFields(styleSemantic);
    const styleFromSemantic: StyleEntry = resolveSemanticPatch(styleSemantic.mpSemantic, cfgTheme);
    const styleRender: RenderStyleEntry = mergeStyle(styleFromSemantic, styleBase);

    const idRender: number = internStyleEntry(state, styleRender);
    mpIdSemantic_IdRender[idSemantic] = idRender;
  }

  const idStyleDefaultRender: number =
    mpIdSemantic_IdRender[valueSemantic.idStyleDefault] ?? valueSemantic.idStyleDefault;

  const rgIdStyleRefRender: number[] = valueSemantic.rgIdStyleRef.map((idSemantic: number) => {
    return mpIdSemantic_IdRender[idSemantic] ?? idStyleDefaultRender;
  });

  const valueRender: AttributedTextValueRender = {
    iVersion: valueSemantic.iVersion,
    rgUnits: valueSemantic.rgUnits,
    rgStorageMode: valueSemantic.rgStorageMode,
    strText: valueSemantic.strText,
    rgSegGraphemeToUtf16: [...valueSemantic.rgSegGraphemeToUtf16],
    rgIdStyleRef: rgIdStyleRefRender,
    mpId_StyleEntry: state.mpId_StyleEntry as Record<number, RenderStyleEntry>,
    idStyleDefault: idStyleDefaultRender
  };

  return {
    valueRender,
    mpIdStyleSemantic_IdStyleRender: mpIdSemantic_IdRender
  };
}
