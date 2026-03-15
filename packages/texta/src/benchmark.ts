import { performance } from "node:perf_hooks";
import { applyStyle } from "./style-ops.ts";
import { detectRgStorageMode, getRgCodePointBoundaryUtf16, getRgGraphemeBoundaryUtf16 } from "./segmentation.ts";
import { getRgRenderBridgeRun } from "./render-bridges.ts";
import { insertText, replaceTextRange } from "./text-ops.ts";
import type { AttributedTextValue, RgStorageMode } from "./types.ts";

export interface BenchmarkRunOptions {
  iWarmupIterations?: number;
  iMeasuredIterations?: number;
}

export interface BenchmarkScenarioResult {
  idScenario: string;
  labelScenario: string;
  iMeasuredIterations: number;
  nDurationMs: number;
  nAvgIterationMs: number;
  nOpsPerSecond: number;
}

interface BenchmarkScenarioState {
  value: AttributedTextValue;
  iCursor: number;
  bToggle: boolean;
}

export interface TextaBenchmarkScenario {
  idScenario: string;
  labelScenario: string;
  createState: () => BenchmarkScenarioState;
  runIteration: (state: BenchmarkScenarioState) => void;
}

function getCodePointCount(strText: string): number {
  return Array.from(strText).length;
}

function createValueFromText(strText: string): AttributedTextValue {
  const rgStorageMode: RgStorageMode = detectRgStorageMode(strText);

  let rgIdStyleRefLength: number;
  let rgSegGraphemeToUtf16: number[] = [];

  if (rgStorageMode === "fastCodeUnit") {
    rgIdStyleRefLength = strText.length;
  } else if (rgStorageMode === "fastCodePoint") {
    rgIdStyleRefLength = getCodePointCount(strText);
  } else {
    const rgBoundaryUtf16: number[] = getRgGraphemeBoundaryUtf16(strText);
    rgIdStyleRefLength = rgBoundaryUtf16.length - 1;
    rgSegGraphemeToUtf16 = rgBoundaryUtf16.slice(1);
  }

  return {
    iVersion: 0,
    rgUnits: "grapheme",
    rgStorageMode,
    strText,
    rgSegGraphemeToUtf16,
    rgIdStyleRef: new Array<number>(rgIdStyleRefLength).fill(0),
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

function getScenarioAsciiLarge(): TextaBenchmarkScenario {
  const strText: string = "a".repeat(6000);

  return {
    idScenario: "ascii-large",
    labelScenario: "Large ASCII workload",
    createState: () => ({
      value: createValueFromText(strText),
      iCursor: 0,
      bToggle: false
    }),
    runIteration: (state: BenchmarkScenarioState): void => {
      const iLen: number = state.value.rgIdStyleRef.length;
      const iAt: number = iLen === 0 ? 0 : state.iCursor % iLen;

      state.value = applyStyle(
        state.value,
        iAt,
        Math.min(iAt + 8, iLen),
        { fill: state.bToggle ? "#d00" : "#00d" },
        "merge"
      );

      state.value = replaceTextRange(state.value, iAt, Math.min(iAt + 1, iLen), "x");
      getRgRenderBridgeRun(state.value);

      state.iCursor += 17;
      state.bToggle = !state.bToggle;
    }
  };
}

function getScenarioEmojiHeavy(): TextaBenchmarkScenario {
  const strText: string = "😀🚀✨".repeat(1500);

  return {
    idScenario: "emoji-heavy",
    labelScenario: "Emoji-heavy workload",
    createState: () => ({
      value: createValueFromText(strText),
      iCursor: 0,
      bToggle: false
    }),
    runIteration: (state: BenchmarkScenarioState): void => {
      const iLen: number = state.value.rgIdStyleRef.length;
      const iAt: number = iLen === 0 ? 0 : state.iCursor % iLen;

      state.value = insertText(state.value, iAt, state.bToggle ? "😀" : "🚀");
      state.value = replaceTextRange(state.value, iAt, Math.min(iAt + 1, state.value.rgIdStyleRef.length), "✨");
      getRgCodePointBoundaryUtf16(state.value.strText);
      getRgRenderBridgeRun(state.value);

      state.iCursor += 11;
      state.bToggle = !state.bToggle;
    }
  };
}

function getScenarioComplexScript(): TextaBenchmarkScenario {
  const strText: string = "e\u0301क्ष".repeat(1400);

  return {
    idScenario: "complex-script",
    labelScenario: "Complex-script segmented workload",
    createState: () => ({
      value: createValueFromText(strText),
      iCursor: 0,
      bToggle: false
    }),
    runIteration: (state: BenchmarkScenarioState): void => {
      const iLen: number = state.value.rgIdStyleRef.length;
      const iStart: number = iLen === 0 ? 0 : state.iCursor % iLen;
      const iEnd: number = Math.min(iStart + 2, iLen);

      state.value = applyStyle(
        state.value,
        iStart,
        iEnd,
        {
          underline: state.bToggle,
          fontWeight: state.bToggle ? "700" : "500"
        },
        "merge"
      );

      state.value = replaceTextRange(state.value, iStart, iEnd, state.bToggle ? "e\u0301" : "क्ष");
      getRgGraphemeBoundaryUtf16(state.value.strText);
      getRgRenderBridgeRun(state.value);

      state.iCursor += 7;
      state.bToggle = !state.bToggle;
    }
  };
}

export function getTextaBaselineBenchmarkScenario(): TextaBenchmarkScenario[] {
  return [getScenarioAsciiLarge(), getScenarioEmojiHeavy(), getScenarioComplexScript()];
}

export function runBenchmarkScenario(
  scenario: TextaBenchmarkScenario,
  options: BenchmarkRunOptions = {}
): BenchmarkScenarioResult {
  const iWarmupIterations: number = Math.max(0, options.iWarmupIterations ?? 25);
  const iMeasuredIterations: number = Math.max(1, options.iMeasuredIterations ?? 150);
  const state: BenchmarkScenarioState = scenario.createState();

  for (let iCur: number = 0; iCur < iWarmupIterations; iCur += 1) {
    scenario.runIteration(state);
  }

  const nStart: number = performance.now();

  for (let iCur: number = 0; iCur < iMeasuredIterations; iCur += 1) {
    scenario.runIteration(state);
  }

  const nDurationMs: number = performance.now() - nStart;
  const nAvgIterationMs: number = nDurationMs / iMeasuredIterations;
  const nOpsPerSecond: number = nDurationMs === 0 ? Number.POSITIVE_INFINITY : (1000 * iMeasuredIterations) / nDurationMs;

  return {
    idScenario: scenario.idScenario,
    labelScenario: scenario.labelScenario,
    iMeasuredIterations,
    nDurationMs,
    nAvgIterationMs,
    nOpsPerSecond
  };
}

export function runTextaBaselineBenchmark(
  options: BenchmarkRunOptions = {}
): BenchmarkScenarioResult[] {
  return getTextaBaselineBenchmarkScenario().map((scenario) =>
    runBenchmarkScenario(scenario, options)
  );
}
