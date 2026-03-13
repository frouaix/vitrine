import { describe, expect, it } from "vitest";
import {
  getTextaBaselineBenchmarkScenario,
  runBenchmarkScenario,
  runTextaBaselineBenchmark
} from "../src/benchmark.ts";

describe("benchmark harness", () => {
  it("exposes baseline scenario set", () => {
    const rgScenario = getTextaBaselineBenchmarkScenario();
    const rgIdScenario = rgScenario.map((scenario) => scenario.idScenario);

    expect(rgIdScenario).toEqual(["ascii-large", "emoji-heavy", "complex-script"]);
  });

  it("runs a single scenario and returns measurable metrics", () => {
    const scenario = getTextaBaselineBenchmarkScenario()[0];
    const result = runBenchmarkScenario(scenario, {
      iWarmupIterations: 2,
      iMeasuredIterations: 8
    });

    expect(result.idScenario).toBe("ascii-large");
    expect(result.iMeasuredIterations).toBe(8);
    expect(Number.isFinite(result.nDurationMs)).toBe(true);
    expect(result.nDurationMs).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(result.nAvgIterationMs)).toBe(true);
    expect(result.nAvgIterationMs).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(result.nOpsPerSecond)).toBe(true);
    expect(result.nOpsPerSecond).toBeGreaterThan(0);
  });

  it("runs all baseline scenarios", () => {
    const rgResult = runTextaBaselineBenchmark({
      iWarmupIterations: 1,
      iMeasuredIterations: 4
    });

    expect(rgResult).toHaveLength(3);

    for (const result of rgResult) {
      expect(result.iMeasuredIterations).toBe(4);
      expect(result.nDurationMs).toBeGreaterThanOrEqual(0);
      expect(result.nOpsPerSecond).toBeGreaterThan(0);
    }
  });
});
