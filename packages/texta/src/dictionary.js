function normalizePrimitive(vValue) {
    if (typeof vValue === "number" && Object.is(vValue, -0)) {
        return 0;
    }
    return vValue;
}
function normalizeUnknown(vValue) {
    if (vValue === undefined) {
        return undefined;
    }
    if (vValue === null) {
        return null;
    }
    if (Array.isArray(vValue)) {
        const rgValue = [];
        for (const vItem of vValue) {
            const vNormalized = normalizeUnknown(vItem);
            if (vNormalized !== undefined) {
                rgValue.push(vNormalized);
            }
        }
        return rgValue;
    }
    if (typeof vValue === "object") {
        const vRecord = vValue;
        const rgKey = Object.keys(vRecord).sort();
        const mpKey_Value = {};
        for (const sKey of rgKey) {
            const vNormalized = normalizeUnknown(vRecord[sKey]);
            if (vNormalized !== undefined) {
                mpKey_Value[sKey] = vNormalized;
            }
        }
        return mpKey_Value;
    }
    return normalizePrimitive(vValue);
}
export function normalizeStyleEntry(styleEntry) {
    const mpField_Value = {};
    const rgKnownField = [
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
        const vRaw = styleEntry[sField];
        const vNormalized = normalizeUnknown(vRaw);
        if (vNormalized !== undefined) {
            mpField_Value[sField] = vNormalized;
        }
    }
    const vCustomRaw = styleEntry.mpProp_Custom;
    const vCustomNormalized = normalizeUnknown(vCustomRaw);
    if (vCustomNormalized !== undefined) {
        mpField_Value.mpProp_Custom = vCustomNormalized;
    }
    return mpField_Value;
}
export function stringifyNormalizedStyleEntry(styleEntry) {
    return JSON.stringify(styleEntry);
}
function hashFnv1a32(sValue) {
    let nHash = 0x811c9dc5;
    for (let iCur = 0; iCur < sValue.length; iCur += 1) {
        nHash ^= sValue.charCodeAt(iCur);
        nHash = Math.imul(nHash, 0x01000193);
    }
    return (nHash >>> 0).toString(16).padStart(8, "0");
}
export function computeStyleHash(styleEntry) {
    const styleNormalized = normalizeStyleEntry(styleEntry);
    const sCanonical = stringifyNormalizedStyleEntry(styleNormalized);
    return hashFnv1a32(sCanonical);
}
function cloneStyleEntry(styleEntry) {
    return JSON.parse(JSON.stringify(styleEntry));
}
function getCanonicalStyleEntry(styleEntry) {
    const styleNormalized = normalizeStyleEntry(styleEntry);
    return stringifyNormalizedStyleEntry(styleNormalized);
}
export function createStyleDictionaryState(styleDefault = {}) {
    const styleStored = cloneStyleEntry(styleDefault);
    const sCanonical = getCanonicalStyleEntry(styleStored);
    const sHash = hashFnv1a32(sCanonical);
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
        },
        mpId_nRefCount: {
            0: 1
        }
    };
}
export function createStyleDictionaryStateFromEntries(mpId_StyleEntry, idStyleDefault) {
    const rgIdStyle = Object.keys(mpId_StyleEntry)
        .map((sIdStyle) => Number(sIdStyle))
        .sort((a, b) => a - b);
    const mpId_StyleEntryOut = {};
    const mpId_sCanonical = {};
    const mpHash_rgIdStyleCandidate = {};
    const mpId_nRefCount = {};
    let iIdStyleMax = -1;
    for (const idStyle of rgIdStyle) {
        const styleInput = mpId_StyleEntry[idStyle] ?? {};
        const styleStored = cloneStyleEntry(styleInput);
        const sCanonical = getCanonicalStyleEntry(styleStored);
        const sHash = hashFnv1a32(sCanonical);
        mpId_StyleEntryOut[idStyle] = styleStored;
        mpId_sCanonical[idStyle] = sCanonical;
        mpId_nRefCount[idStyle] = idStyle === idStyleDefault ? 1 : 0;
        if (mpHash_rgIdStyleCandidate[sHash] === undefined) {
            mpHash_rgIdStyleCandidate[sHash] = [];
        }
        mpHash_rgIdStyleCandidate[sHash].push(idStyle);
        iIdStyleMax = Math.max(iIdStyleMax, idStyle);
    }
    return {
        iIdStyleNext: iIdStyleMax + 1,
        mpId_StyleEntry: mpId_StyleEntryOut,
        mpId_sCanonical,
        mpHash_rgIdStyleCandidate,
        mpId_nRefCount
    };
}
export function getStyleEntryById(state, idStyle) {
    return state.mpId_StyleEntry[idStyle];
}
export function internStyleEntry(state, styleEntry, sHashOverride) {
    const sCanonical = getCanonicalStyleEntry(styleEntry);
    const sHash = sHashOverride ?? hashFnv1a32(sCanonical);
    const rgIdStyleCandidate = state.mpHash_rgIdStyleCandidate[sHash] ?? [];
    for (const idStyleCandidate of rgIdStyleCandidate) {
        const sCandidateCanonical = state.mpId_sCanonical[idStyleCandidate];
        if (sCandidateCanonical === sCanonical) {
            return idStyleCandidate;
        }
    }
    const idStyleNew = state.iIdStyleNext;
    state.iIdStyleNext += 1;
    state.mpId_StyleEntry[idStyleNew] = cloneStyleEntry(styleEntry);
    state.mpId_sCanonical[idStyleNew] = sCanonical;
    state.mpId_nRefCount[idStyleNew] = 0;
    if (state.mpHash_rgIdStyleCandidate[sHash] === undefined) {
        state.mpHash_rgIdStyleCandidate[sHash] = [];
    }
    state.mpHash_rgIdStyleCandidate[sHash].push(idStyleNew);
    return idStyleNew;
}
function assertKnownStyleId(state, idStyle) {
    if (state.mpId_StyleEntry[idStyle] === undefined) {
        throw new RangeError(`Unknown style id: ${idStyle}`);
    }
}
export function getStyleRefCount(state, idStyle) {
    assertKnownStyleId(state, idStyle);
    return state.mpId_nRefCount[idStyle] ?? 0;
}
export function retainStyleId(state, idStyle) {
    const nCurrent = getStyleRefCount(state, idStyle);
    const nNext = nCurrent + 1;
    state.mpId_nRefCount[idStyle] = nNext;
    return nNext;
}
export function releaseStyleId(state, idStyle) {
    const nCurrent = getStyleRefCount(state, idStyle);
    if (nCurrent === 0) {
        throw new RangeError(`Cannot release style id ${idStyle} below zero references`);
    }
    const nNext = nCurrent - 1;
    state.mpId_nRefCount[idStyle] = nNext;
    return nNext;
}
function removeStyleFromHashCandidates(state, idStyle, sCanonical) {
    const sHash = hashFnv1a32(sCanonical);
    const rgIdCandidate = state.mpHash_rgIdStyleCandidate[sHash];
    if (rgIdCandidate === undefined) {
        return;
    }
    state.mpHash_rgIdStyleCandidate[sHash] = rgIdCandidate.filter((idStyleCandidate) => idStyleCandidate !== idStyle);
    if (state.mpHash_rgIdStyleCandidate[sHash].length === 0) {
        delete state.mpHash_rgIdStyleCandidate[sHash];
    }
}
export function cleanupUnreferencedStyles(state, rgIdStyleKeep = []) {
    const stKeep = new Set([0, ...rgIdStyleKeep]);
    const rgRemoved = [];
    for (const sIdStyle of Object.keys(state.mpId_StyleEntry)) {
        const idStyle = Number(sIdStyle);
        if (stKeep.has(idStyle)) {
            continue;
        }
        const nRefCount = state.mpId_nRefCount[idStyle] ?? 0;
        if (nRefCount > 0) {
            continue;
        }
        const sCanonical = state.mpId_sCanonical[idStyle];
        if (sCanonical !== undefined) {
            removeStyleFromHashCandidates(state, idStyle, sCanonical);
        }
        delete state.mpId_StyleEntry[idStyle];
        delete state.mpId_sCanonical[idStyle];
        delete state.mpId_nRefCount[idStyle];
        rgRemoved.push(idStyle);
    }
    return rgRemoved;
}
