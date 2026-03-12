import type { StyleEntry } from "./types.ts";

export type NormalizedStyleEntry = Record<string, unknown>;

export interface StyleDictionaryState {
  iIdStyleNext: number;
  mpId_StyleEntry: Record<number, StyleEntry>;
  mpId_sCanonical: Record<number, string>;
  mpHash_rgIdStyleCandidate: Record<string, number[]>;
}

function normalizePrimitive(vValue: unknown): unknown {
  if (typeof vValue === "number" && Object.is(vValue, -0)) {
    return 0;
  }

  return vValue;
}

function normalizeUnknown(vValue: unknown): unknown {
  if (vValue === undefined) {
    return undefined;
  }

  if (vValue === null) {
    return null;
  }

  if (Array.isArray(vValue)) {
    const rgValue: unknown[] = [];

    for (const vItem of vValue) {
      const vNormalized: unknown = normalizeUnknown(vItem);
      if (vNormalized !== undefined) {
        rgValue.push(vNormalized);
      }
    }

    return rgValue;
  }

  if (typeof vValue === "object") {
    const vRecord: Record<string, unknown> = vValue as Record<string, unknown>;
    const rgKey: string[] = Object.keys(vRecord).sort();
    const mpKey_Value: Record<string, unknown> = {};

    for (const sKey of rgKey) {
      const vNormalized: unknown = normalizeUnknown(vRecord[sKey]);
      if (vNormalized !== undefined) {
        mpKey_Value[sKey] = vNormalized;
      }
    }

    return mpKey_Value;
  }

  return normalizePrimitive(vValue);
}

export function normalizeStyleEntry(styleEntry: StyleEntry): NormalizedStyleEntry {
  const mpField_Value: NormalizedStyleEntry = {};

  const rgKnownField: Array<keyof StyleEntry> = [
    "fill",
    "fontFamily",
    "fontSize",
    "fontStyle",
    "fontWeight",
    "letterSpacing",
    "lineHeight",
    "opacity",
    "strikethrough",
    "stroke",
    "underline"
  ];

  for (const sField of rgKnownField) {
    const vRaw: unknown = styleEntry[sField];
    const vNormalized: unknown = normalizeUnknown(vRaw);

    if (vNormalized !== undefined) {
      mpField_Value[sField] = vNormalized;
    }
  }

  const vCustomRaw: unknown = styleEntry.mpProp_Custom;
  const vCustomNormalized: unknown = normalizeUnknown(vCustomRaw);

  if (vCustomNormalized !== undefined) {
    mpField_Value.mpProp_Custom = vCustomNormalized;
  }

  return mpField_Value;
}

export function stringifyNormalizedStyleEntry(styleEntry: NormalizedStyleEntry): string {
  return JSON.stringify(styleEntry);
}

function hashFnv1a32(sValue: string): string {
  let nHash: number = 0x811c9dc5;

  for (let iCur: number = 0; iCur < sValue.length; iCur += 1) {
    nHash ^= sValue.charCodeAt(iCur);
    nHash = Math.imul(nHash, 0x01000193);
  }

  return (nHash >>> 0).toString(16).padStart(8, "0");
}

export function computeStyleHash(styleEntry: StyleEntry): string {
  const styleNormalized: NormalizedStyleEntry = normalizeStyleEntry(styleEntry);
  const sCanonical: string = stringifyNormalizedStyleEntry(styleNormalized);

  return hashFnv1a32(sCanonical);
}

function cloneStyleEntry(styleEntry: StyleEntry): StyleEntry {
  return JSON.parse(JSON.stringify(styleEntry)) as StyleEntry;
}

function getCanonicalStyleEntry(styleEntry: StyleEntry): string {
  const styleNormalized: NormalizedStyleEntry = normalizeStyleEntry(styleEntry);
  return stringifyNormalizedStyleEntry(styleNormalized);
}

export function createStyleDictionaryState(styleDefault: StyleEntry = {}): StyleDictionaryState {
  const styleStored: StyleEntry = cloneStyleEntry(styleDefault);
  const sCanonical: string = getCanonicalStyleEntry(styleStored);
  const sHash: string = hashFnv1a32(sCanonical);

  return {
    iIdStyleNext: 1,
    mpId_StyleEntry: {
      0: styleStored
    },
    mpId_sCanonical: {
      0: sCanonical
    },
    mpHash_rgIdStyleCandidate: {
      [sHash]: [0]
    }
  };
}

export function getStyleEntryById(
  state: StyleDictionaryState,
  idStyle: number
): StyleEntry | undefined {
  return state.mpId_StyleEntry[idStyle];
}

export function internStyleEntry(
  state: StyleDictionaryState,
  styleEntry: StyleEntry,
  sHashOverride?: string
): number {
  const sCanonical: string = getCanonicalStyleEntry(styleEntry);
  const sHash: string = sHashOverride ?? hashFnv1a32(sCanonical);
  const rgIdStyleCandidate: number[] = state.mpHash_rgIdStyleCandidate[sHash] ?? [];

  for (const idStyleCandidate of rgIdStyleCandidate) {
    const sCandidateCanonical: string | undefined = state.mpId_sCanonical[idStyleCandidate];
    if (sCandidateCanonical === sCanonical) {
      return idStyleCandidate;
    }
  }

  const idStyleNew: number = state.iIdStyleNext;
  state.iIdStyleNext += 1;

  state.mpId_StyleEntry[idStyleNew] = cloneStyleEntry(styleEntry);
  state.mpId_sCanonical[idStyleNew] = sCanonical;

  if (state.mpHash_rgIdStyleCandidate[sHash] === undefined) {
    state.mpHash_rgIdStyleCandidate[sHash] = [];
  }

  state.mpHash_rgIdStyleCandidate[sHash].push(idStyleNew);

  return idStyleNew;
}
