import { performance } from "node:perf_hooks";
import { applyStyle } from "./style-ops.js";
import { detectRgStorageMode, getRgCodePointBoundaryUtf16, getRgGraphemeBoundaryUtf16 } from "./segmentation.js";
import { getRgRenderBridgeRun } from "./render-bridges.js";
import { insertText, replaceTextRange } from "./text-ops.js";
function getCodePointCount(strText) {
    return Array.from(strText).length;
}
function createValueFromText(strText) {
    const rgStorageMode = detectRgStorageMode(strText);
    let rgIdStyleRefLength;
    let rgSegGraphemeToUtf16 = [];
    if (rgStorageMode === "fastCodeUnit") {
        rgIdStyleRefLength = strText.length;
    }
    else if (rgStorageMode === "fastCodePoint") {
        rgIdStyleRefLength = getCodePointCount(strText);
    }
    else {
        const rgBoundaryUtf16 = getRgGraphemeBoundaryUtf16(strText);
        rgIdStyleRefLength = rgBoundaryUtf16.length - 1;
        rgSegGraphemeToUtf16 = rgBoundaryUtf16.slice(1);
    }
    return {
        iVersion: 0,
        rgUnits: "grapheme",
        rgStorageMode,
        strText,
        rgSegGraphemeToUtf16,
        rgIdStyleRef: new Array(rgIdStyleRefLength).fill(0),
        mpId_StyleEntry: {
            0: {
                fontFamily: "Menlo",
                fontSize: 12,
                fill: "#000"
            }
        },
        idStyleDefault: 0
    };
}
function getScenarioAsciiLarge() {
    const strText = "a".repeat(6000);
    return {
        idScenario: "ascii-large",
        labelScenario: "Large ASCII workload",
        createState: () => ({
            value: createValueFromText(strText),
            iCursor: 0,
            bToggle: false
        }),
        runIteration: (state) => {
            const iLen = state.value.rgIdStyleRef.length;
            const iAt = iLen === 0 ? 0 : state.iCursor % iLen;
            state.value = applyStyle(state.value, iAt, Math.min(iAt + 8, iLen), { fill: state.bToggle ? "#d00" : "#00d" }, "merge");
            state.value = replaceTextRange(state.value, iAt, Math.min(iAt + 1, iLen), "x");
            getRgRenderBridgeRun(state.value);
            state.iCursor += 17;
            state.bToggle = !state.bToggle;
        }
    };
}
function getScenarioEmojiHeavy() {
    const strText = "😀🚀✨".repeat(1500);
    return {
        idScenario: "emoji-heavy",
        labelScenario: "Emoji-heavy workload",
        createState: () => ({
            value: createValueFromText(strText),
            iCursor: 0,
            bToggle: false
        }),
        runIteration: (state) => {
            const iLen = state.value.rgIdStyleRef.length;
            const iAt = iLen === 0 ? 0 : state.iCursor % iLen;
            state.value = insertText(state.value, iAt, state.bToggle ? "😀" : "🚀");
            state.value = replaceTextRange(state.value, iAt, Math.min(iAt + 1, state.value.rgIdStyleRef.length), "✨");
            getRgCodePointBoundaryUtf16(state.value.strText);
            getRgRenderBridgeRun(state.value);
            state.iCursor += 11;
            state.bToggle = !state.bToggle;
        }
    };
}
function getScenarioComplexScript() {
    const strText = "e\u0301क्ष".repeat(1400);
    return {
        idScenario: "complex-script",
        labelScenario: "Complex-script segmented workload",
        createState: () => ({
            value: createValueFromText(strText),
            iCursor: 0,
            bToggle: false
        }),
        runIteration: (state) => {
            const iLen = state.value.rgIdStyleRef.length;
            const iStart = iLen === 0 ? 0 : state.iCursor % iLen;
            const iEnd = Math.min(iStart + 2, iLen);
            state.value = applyStyle(state.value, iStart, iEnd, {
                underline: state.bToggle,
                fontWeight: state.bToggle ? "700" : "500"
            }, "merge");
            state.value = replaceTextRange(state.value, iStart, iEnd, state.bToggle ? "e\u0301" : "क्ष");
            getRgGraphemeBoundaryUtf16(state.value.strText);
            getRgRenderBridgeRun(state.value);
            state.iCursor += 7;
            state.bToggle = !state.bToggle;
        }
    };
}
export function getTextaBaselineBenchmarkScenario() {
    return [getScenarioAsciiLarge(), getScenarioEmojiHeavy(), getScenarioComplexScript()];
}
export function runBenchmarkScenario(scenario, options = {}) {
    const iWarmupIterations = Math.max(0, options.iWarmupIterations ?? 25);
    const iMeasuredIterations = Math.max(1, options.iMeasuredIterations ?? 150);
    const state = scenario.createState();
    for (let iCur = 0; iCur < iWarmupIterations; iCur += 1) {
        scenario.runIteration(state);
    }
    const nStart = performance.now();
    for (let iCur = 0; iCur < iMeasuredIterations; iCur += 1) {
        scenario.runIteration(state);
    }
    const nDurationMs = performance.now() - nStart;
    const nAvgIterationMs = nDurationMs / iMeasuredIterations;
    const nOpsPerSecond = nDurationMs === 0 ? Number.POSITIVE_INFINITY : (1000 * iMeasuredIterations) / nDurationMs;
    return {
        idScenario: scenario.idScenario,
        labelScenario: scenario.labelScenario,
        iMeasuredIterations,
        nDurationMs,
        nAvgIterationMs,
        nOpsPerSecond
    };
}
export function runTextaBaselineBenchmark(options = {}) {
    return getTextaBaselineBenchmarkScenario().map((scenario) => runBenchmarkScenario(scenario, options));
}
