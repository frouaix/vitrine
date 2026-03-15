import { describe, expect, it } from "vitest";
import { getRgStyleRun } from "../src/style-ops.ts";

describe("style run coalescing", () => {
  it("coalesces adjacent equal style ids into runs", () => {
    const rgRun = getRgStyleRun([0, 0, 1, 1, 1, 2, 2, 3]);

    expect(rgRun).toEqual([
      { iStart: 0, iEnd: 2, idStyle: 0 },
      { iStart: 2, iEnd: 5, idStyle: 1 },
      { iStart: 5, iEnd: 7, idStyle: 2 },
      { iStart: 7, iEnd: 8, idStyle: 3 }
    ]);
  });

  it("returns empty runs for empty style-ref range", () => {
    expect(getRgStyleRun([])).toEqual([]);
  });
});
