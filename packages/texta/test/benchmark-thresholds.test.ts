import { describe, expect, it } from "vitest";
import {
  evaluateBenchmarkThreshold,
  formatBenchmarkThresholdReportMarkdown,
  rgTextaDefaultBenchmarkThreshold
} from "../src/benchmark-thresholds.ts";
import type { BenchmarkScenarioResult } from "../src/benchmark.ts";

function createResult(
  idScenario: string,
  nAvgIterationMs: number,
  nOpsPerSecond: number
): BenchmarkScenarioResult {
  return {
    idScenario,
    labelScenario: idScenario,
    iMeasuredIterations: 100,
    nDurationMs: nAvgIterationMs * 100,
    nAvgIterationMs,
    nOpsPerSecond
  };
}

describe("benchmark thresholds", () => {
  it("passes when all scenarios satisfy thresholds", () => {
    const evalResult = evaluateBenchmarkThreshold([
      createResult("ascii-large", 5, 300),
      createResult("emoji-heavy", 7, 180),
      createResult("complex-script", 8, 160)
    ]);

    expect(evalResult.bPass).toBe(true);
    expect(evalResult.rgScenarioMissingThreshold).toEqual([]);
    expect(evalResult.rgThresholdMissingScenario).toEqual([]);
  });

  it("fails when a scenario violates thresholds", () => {
    const evalResult = evaluateBenchmarkThreshold([
      createResult("ascii-large", 100, 2),
      createResult("emoji-heavy", 7, 180),
      createResult("complex-script", 8, 160)
    ]);

    expect(evalResult.bPass).toBe(false);

    const ascii = evalResult.rgScenarioResult.find((result) => result.idScenario === "ascii-large");
    expect(ascii).toBeDefined();
    expect(ascii?.bPassAvgIterationMs).toBe(false);
    expect(ascii?.bPassOpsPerSecond).toBe(false);
  });

  it("reports missing thresholds and missing scenario results", () => {
    const evalResult = evaluateBenchmarkThreshold(
      [createResult("unknown-scenario", 1, 1000)],
      rgTextaDefaultBenchmarkThreshold
    );

    expect(evalResult.bPass).toBe(false);
    expect(evalResult.rgScenarioMissingThreshold).toEqual(["unknown-scenario"]);
    expect(evalResult.rgThresholdMissingScenario).toEqual([
      "ascii-large",
      "emoji-heavy",
      "complex-script"
    ]);
  });

  it("formats markdown summary report", () => {
    const evalResult = evaluateBenchmarkThreshold([
      createResult("ascii-large", 5, 300),
      createResult("emoji-heavy", 7, 180),
      createResult("complex-script", 8, 160)
    ]);

    const report: string = formatBenchmarkThresholdReportMarkdown(evalResult);

    expect(report).toContain("## Texta Benchmark Threshold Report");
    expect(report).toContain("| Scenario | Avg ms | Max ms | Ops/s | Min ops/s | Status |");
    expect(report).toContain("Overall: PASS");
  });
});
