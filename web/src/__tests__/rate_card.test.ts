import { describe, it, expect } from "vitest";

describe("Illustrative Rate Card Calculation", () => {
  const baseMobilizationFee = 1850;
  const severityMultiplier = 55;

  const calculateIllustrativeCost = (score: number) => {
    return Math.max(baseMobilizationFee, Math.round(score * severityMultiplier));
  };

  it("enforces minimum base mobilization fee on minor defects", () => {
    const cost = calculateIllustrativeCost(10);
    expect(cost).toBe(1850);
  });

  it("scales monotonically with severity score for critical defects", () => {
    const moderateCost = calculateIllustrativeCost(40); // 2200
    const severeCost = calculateIllustrativeCost(65);   // 3575
    const criticalCost = calculateIllustrativeCost(85); // 4675

    expect(moderateCost).toBeGreaterThanOrEqual(1850);
    expect(severeCost).toBeGreaterThan(moderateCost);
    expect(criticalCost).toBeGreaterThan(severeCost);
  });
});

