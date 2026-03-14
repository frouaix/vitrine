import type { BenchmarkScenarioResult } from "./benchmark.ts";
export interface BenchmarkScenarioThreshold {
    idScenario: string;
    nMaxAvgIterationMs: number;
    nMinOpsPerSecond: number;
}
export interface BenchmarkScenarioThresholdResult {
    idScenario: string;
    bPassAvgIterationMs: boolean;
    bPassOpsPerSecond: boolean;
    nAvgIterationMs: number;
    nOpsPerSecond: number;
    nMaxAvgIterationMs: number;
    nMinOpsPerSecond: number;
}
export interface BenchmarkThresholdEvaluation {
    bPass: boolean;
    rgScenarioResult: BenchmarkScenarioThresholdResult[];
    rgScenarioMissingThreshold: string[];
    rgThresholdMissingScenario: string[];
}
export declare const rgTextaDefaultBenchmarkThreshold: BenchmarkScenarioThreshold[];
export declare function evaluateBenchmarkThreshold(rgResult: BenchmarkScenarioResult[], rgThreshold?: BenchmarkScenarioThreshold[]): BenchmarkThresholdEvaluation;
export declare function formatBenchmarkThresholdReportMarkdown(evalResult: BenchmarkThresholdEvaluation): string;
