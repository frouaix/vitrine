import fs from "node:fs/promises";
import {
  evaluateBenchmarkThreshold,
  formatBenchmarkThresholdReportMarkdown,
  rgTextaDefaultBenchmarkThreshold
} from "../dist/benchmark-thresholds.js";
import { runTextaBaselineBenchmark } from "../dist/benchmark.js";

const rgResult = runTextaBaselineBenchmark({
  iWarmupIterations: 20,
  iMeasuredIterations: 100
});

const evalResult = evaluateBenchmarkThreshold(rgResult, rgTextaDefaultBenchmarkThreshold);
const sReport = formatBenchmarkThresholdReportMarkdown(evalResult);

console.log(sReport);

const sStepSummaryPath = process.env.GITHUB_STEP_SUMMARY;
if (sStepSummaryPath) {
  await fs.appendFile(sStepSummaryPath, `${sReport}\n`, "utf8");
}

if (!evalResult.bPass) {
  process.exitCode = 1;
}
