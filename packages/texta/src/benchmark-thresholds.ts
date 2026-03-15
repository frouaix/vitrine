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

export const rgTextaDefaultBenchmarkThreshold: BenchmarkScenarioThreshold[] = [
  {
    idScenario: "ascii-large",
    nMaxAvgIterationMs: 25,
    nMinOpsPerSecond: 20
  },
  {
    idScenario: "emoji-heavy",
    nMaxAvgIterationMs: 35,
    nMinOpsPerSecond: 12
  },
  {
    idScenario: "complex-script",
    nMaxAvgIterationMs: 40,
    nMinOpsPerSecond: 10
  }
];

export function evaluateBenchmarkThreshold(
  rgResult: BenchmarkScenarioResult[],
  rgThreshold: BenchmarkScenarioThreshold[] = rgTextaDefaultBenchmarkThreshold
): BenchmarkThresholdEvaluation {
  const mpIdScenario_Threshold: Record<string, BenchmarkScenarioThreshold> = {};

  for (const threshold of rgThreshold) {
    mpIdScenario_Threshold[threshold.idScenario] = threshold;
  }

  const rgScenarioResult: BenchmarkScenarioThresholdResult[] = [];
  const rgScenarioMissingThreshold: string[] = [];
  const stScenarioSeen: Set<string> = new Set<string>();

  for (const result of rgResult) {
    stScenarioSeen.add(result.idScenario);

    const threshold: BenchmarkScenarioThreshold | undefined = mpIdScenario_Threshold[result.idScenario];
    if (threshold === undefined) {
      rgScenarioMissingThreshold.push(result.idScenario);
      continue;
    }

    const bPassAvgIterationMs: boolean = result.nAvgIterationMs <= threshold.nMaxAvgIterationMs;
    const bPassOpsPerSecond: boolean = result.nOpsPerSecond >= threshold.nMinOpsPerSecond;

    rgScenarioResult.push({
      idScenario: result.idScenario,
      bPassAvgIterationMs,
      bPassOpsPerSecond,
      nAvgIterationMs: result.nAvgIterationMs,
      nOpsPerSecond: result.nOpsPerSecond,
      nMaxAvgIterationMs: threshold.nMaxAvgIterationMs,
      nMinOpsPerSecond: threshold.nMinOpsPerSecond
    });
  }

  const rgThresholdMissingScenario: string[] = rgThreshold
    .filter((threshold) => !stScenarioSeen.has(threshold.idScenario))
    .map((threshold) => threshold.idScenario);

  const bPassScenarioChecks: boolean = rgScenarioResult.every(
    (result) => result.bPassAvgIterationMs && result.bPassOpsPerSecond
  );

  const bPass: boolean =
    bPassScenarioChecks &&
    rgScenarioMissingThreshold.length === 0 &&
    rgThresholdMissingScenario.length === 0;

  return {
    bPass,
    rgScenarioResult,
    rgScenarioMissingThreshold,
    rgThresholdMissingScenario
  };
}

export function formatBenchmarkThresholdReportMarkdown(
  evalResult: BenchmarkThresholdEvaluation
): string {
  const rgLine: string[] = [
    "## Texta Benchmark Threshold Report",
    "",
    "| Scenario | Avg ms | Max ms | Ops/s | Min ops/s | Status |",
    "| --- | ---: | ---: | ---: | ---: | --- |"
  ];

  for (const result of evalResult.rgScenarioResult) {
    const sStatus: string =
      result.bPassAvgIterationMs && result.bPassOpsPerSecond ? "PASS" : "FAIL";

    rgLine.push(
      `| ${result.idScenario} | ${result.nAvgIterationMs.toFixed(3)} | ${result.nMaxAvgIterationMs.toFixed(3)} | ${result.nOpsPerSecond.toFixed(1)} | ${result.nMinOpsPerSecond.toFixed(1)} | ${sStatus} |`
    );
  }

  if (evalResult.rgScenarioMissingThreshold.length > 0) {
    rgLine.push("");
    rgLine.push(`Missing thresholds: ${evalResult.rgScenarioMissingThreshold.join(", ")}`);
  }

  if (evalResult.rgThresholdMissingScenario.length > 0) {
    rgLine.push("");
    rgLine.push(`Missing scenario results: ${evalResult.rgThresholdMissingScenario.join(", ")}`);
  }

  rgLine.push("");
  rgLine.push(`Overall: ${evalResult.bPass ? "PASS" : "FAIL"}`);

  return rgLine.join("\n");
}
