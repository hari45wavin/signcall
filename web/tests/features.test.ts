import { describe, expect, it } from "vitest";
import vectors from "../../shared/test-vectors.json";
import { FEATURE_SIZE, SPEC_VERSION, frameFeatures, type Hand } from "@/lib/features";

describe("features.ts matches ml/signml/features.py", () => {
  it("uses the same spec version", () => {
    expect(vectors.spec_version).toBe(SPEC_VERSION);
  });

  for (const c of vectors.cases) {
    it(c.name, () => {
      const got = frameFeatures(c.hands as Hand[]);
      expect(got).toHaveLength(FEATURE_SIZE);
      got.forEach((v, i) => expect(Math.abs(v - c.expected[i])).toBeLessThanOrEqual(vectors.tolerance));
    });
  }
});
