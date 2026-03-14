import { createStyleDictionaryStateFromEntries, internStyleEntry } from "./dictionary.js";
function assertStyleRange(iStart, iEnd, iLen) {
    const bValidStart = Number.isInteger(iStart) && iStart >= 0 && iStart <= iLen;
    const bValidEnd = Number.isInteger(iEnd) && iEnd >= 0 && iEnd <= iLen;
    if (!bValidStart || !bValidEnd || iStart > iEnd) {
        throw new RangeError(`Invalid style range [${iStart}, ${iEnd}) for length ${iLen}`);
    }
}
function mergeStyleEntry(styleCur, stylePatch) {
    const mpCustomCur = styleCur.mpProp_Custom ?? {};
    const mpCustomPatch = stylePatch.mpProp_Custom ?? {};
    return {
        ...styleCur,
        ...stylePatch,
        mpProp_Custom: {
            ...mpCustomCur,
            ...mpCustomPatch
        }
    };
}
function getStyleEntry(value, idStyle) {
    return value.mpId_StyleEntry[idStyle] ?? value.mpId_StyleEntry[value.idStyleDefault] ?? {};
}
export function getRgStyleRun(rgIdStyleRef) {
    if (rgIdStyleRef.length === 0) {
        return [];
    }
    const rgRun = [];
    let iRunStart = 0;
    let idStyleCur = rgIdStyleRef[0];
    for (let iCur = 1; iCur < rgIdStyleRef.length; iCur += 1) {
        const idStyleNext = rgIdStyleRef[iCur];
        if (idStyleNext === idStyleCur) {
            continue;
        }
        rgRun.push({
            iStart: iRunStart,
            iEnd: iCur,
            idStyle: idStyleCur
        });
        iRunStart = iCur;
        idStyleCur = idStyleNext;
    }
    rgRun.push({
        iStart: iRunStart,
        iEnd: rgIdStyleRef.length,
        idStyle: idStyleCur
    });
    return rgRun;
}
export function applyStyle(value, iStart, iEnd, stylePatch, rgMode) {
    assertStyleRange(iStart, iEnd, value.rgIdStyleRef.length);
    if (iStart === iEnd) {
        return value;
    }
    const state = createStyleDictionaryStateFromEntries(value.mpId_StyleEntry, value.idStyleDefault);
    const rgIdStyleRefNext = [...value.rgIdStyleRef];
    const mpIdStyleCur_IdStyleTarget = {};
    let bAnyChanged = false;
    for (let iCur = iStart; iCur < iEnd; iCur += 1) {
        const idStyleCur = rgIdStyleRefNext[iCur];
        const idStyleKnownTarget = mpIdStyleCur_IdStyleTarget[idStyleCur];
        if (idStyleKnownTarget !== undefined) {
            if (idStyleKnownTarget !== idStyleCur) {
                rgIdStyleRefNext[iCur] = idStyleKnownTarget;
                bAnyChanged = true;
            }
            continue;
        }
        const styleCur = getStyleEntry(value, idStyleCur);
        const styleNext = rgMode === "replace" ? { ...stylePatch } : mergeStyleEntry(styleCur, stylePatch);
        const idStyleTarget = internStyleEntry(state, styleNext);
        mpIdStyleCur_IdStyleTarget[idStyleCur] = idStyleTarget;
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
