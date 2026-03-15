import { describe, expect, it } from "vitest";

import {
  assertReferenceLayoutFixture,
  runReferenceLayoutFixture
} from "../src/index.ts";

describe("ReferenceTableLayoutEngine fixture", () => {
  it("produces stable layout for baseline fixture", () => {
    const result = runReferenceLayoutFixture(640);

    expect(result.columns).toHaveLength(3);
    expect(result.rows).toHaveLength(3);
    expect(result.cells.length).toBeGreaterThan(0);

    expect(() => {
      assertReferenceLayoutFixture(result);
    }).not.toThrow();
  });

  it("keeps fixed first column width under narrower available width", () => {
    const result = runReferenceLayoutFixture(420);
    expect(result.columns[0]?.width).toBeCloseTo(140, 6);
  });

  it("computes colSpan cell frame as sum of covered columns plus spacing", () => {
    const result = runReferenceLayoutFixture(640);

    const col1 = result.columns[1];
    const col2 = result.columns[2];
    const spacing = 8;

    const summaryCell = result.cells.find((cell) => cell.cellId === "r2-summary");
    expect(summaryCell).toBeDefined();

    const expectedX = col1.x;
    const expectedWidth = col1.width + col2.width + spacing;

    expect(summaryCell!.x).toBeCloseTo(expectedX, 6);
    expect(summaryCell!.width).toBeCloseTo(expectedWidth, 6);
  });
});
