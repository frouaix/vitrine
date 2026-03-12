import {
  createStyleDictionaryStateFromEntries,
  internStyleEntry
} from "./dictionary.ts";
import type { AttributedTextValue, StyleEntry } from "./types.ts";

export type RgStyleApplyMode = "merge" | "replace";

function assertStyleRange(iStart: number, iEnd: number, iLen: number): void {
  const bValidStart: boolean = Number.isInteger(iStart) && iStart >= 0 && iStart <= iLen;
  const bValidEnd: boolean = Number.isInteger(iEnd) && iEnd >= 0 && iEnd <= iLen;

  if (!bValidStart || !bValidEnd || iStart > iEnd) {
    throw new RangeError(`Invalid style range [${iStart}, ${iEnd}) for length ${iLen}`);
  }
}

function mergeStyleEntry(styleCur: StyleEntry, stylePatch: StyleEntry): StyleEntry {
  const mpCustomCur: Record<string, unknown> = styleCur.mpProp_Custom ?? {};
  const mpCustomPatch: Record<string, unknown> = stylePatch.mpProp_Custom ?? {};

  return {
    ...styleCur,
    ...stylePatch,
    mpProp_Custom: {
      ...mpCustomCur,
      ...mpCustomPatch
    }
  };
}

function getStyleEntry(value: AttributedTextValue, idStyle: number): StyleEntry {
  return value.mpId_StyleEntry[idStyle] ?? value.mpId_StyleEntry[value.idStyleDefault] ?? {};
}

export function applyStyle(
  value: AttributedTextValue,
  iStart: number,
  iEnd: number,
  stylePatch: StyleEntry,
  rgMode: RgStyleApplyMode
): AttributedTextValue {
  assertStyleRange(iStart, iEnd, value.rgIdStyleRef.length);

  if (iStart === iEnd) {
    return value;
  }

  const state = createStyleDictionaryStateFromEntries(value.mpId_StyleEntry, value.idStyleDefault);
  const rgIdStyleRefNext: number[] = [...value.rgIdStyleRef];

  let bAnyChanged: boolean = false;

  for (let iCur: number = iStart; iCur < iEnd; iCur += 1) {
    const idStyleCur: number = rgIdStyleRefNext[iCur];
    const styleCur: StyleEntry = getStyleEntry(value, idStyleCur);

    const styleNext: StyleEntry =
      rgMode === "replace" ? { ...stylePatch } : mergeStyleEntry(styleCur, stylePatch);

    const idStyleTarget: number = internStyleEntry(state, styleNext);

    if (idStyleTarget !== idStyleCur) {
      rgIdStyleRefNext[iCur] = idStyleTarget;
      bAnyChanged = true;
    }
  }

  if (!bAnyChanged) {
    return value;
  }

  return {
    ...value,
    iVersion: value.iVersion + 1,
    rgIdStyleRef: rgIdStyleRefNext,
    mpId_StyleEntry: state.mpId_StyleEntry
  };
}
