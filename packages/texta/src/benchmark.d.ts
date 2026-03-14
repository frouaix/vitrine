import type { AttributedTextValue } from "./types.ts";
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
export declare function getTextaBaselineBenchmarkScenario(): TextaBenchmarkScenario[];
export declare function runBenchmarkScenario(scenario: TextaBenchmarkScenario, options?: BenchmarkRunOptions): BenchmarkScenarioResult;
export declare function runTextaBaselineBenchmark(options?: BenchmarkRunOptions): BenchmarkScenarioResult[];
export {};
