import { describe, expect, it } from "vitest";
import { sTextaPackageName } from "../src/index.ts";

describe("texta scaffold", () => {
  it("exports package marker", () => {
    expect(sTextaPackageName).toBe("texta");
  });
});
