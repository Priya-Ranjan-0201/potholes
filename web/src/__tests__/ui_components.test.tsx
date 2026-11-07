import { describe, it, expect } from "vitest";
import { getSeverityFromScore, getSeveritySign, SEVERITY_SIGNS } from "../ui/tokens";

describe("Design System Tokens & Road Signs (Truck Art Meets Night Highway)", () => {
  it("maps severity scores to canonical road sign levels accurately", () => {
    expect(getSeverityFromScore(10)).toBe("Minor");
    expect(getSeverityFromScore(25)).toBe("Minor");
    expect(getSeverityFromScore(26)).toBe("Moderate");
    expect(getSeverityFromScore(50)).toBe("Moderate");
    expect(getSeverityFromScore(51)).toBe("Severe");
    expect(getSeverityFromScore(75)).toBe("Severe");
    expect(getSeverityFromScore(76)).toBe("Critical");
    expect(getSeverityFromScore(100)).toBe("Critical");
  });

  it("verifies distinct geometric shapes for each severity sign to prevent color-only reliance (WCAG AA)", () => {
    expect(SEVERITY_SIGNS.Minor.shape).toBe("circle");
    expect(SEVERITY_SIGNS.Moderate.shape).toBe("triangle");
    expect(SEVERITY_SIGNS.Severe.shape).toBe("diamond");
    expect(SEVERITY_SIGNS.Critical.shape).toBe("octagon");
  });

  it("returns appropriate SLAs according to municipal severity standards", () => {
    expect(SEVERITY_SIGNS.Critical.slaHours).toBe(24);
    expect(SEVERITY_SIGNS.Severe.slaHours).toBe(48);
    expect(SEVERITY_SIGNS.Moderate.slaHours).toBe(72);
    expect(SEVERITY_SIGNS.Minor.slaHours).toBe(168);
  });

  it("retrieves sign config seamlessly by string or numerical score", () => {
    const signByScore = getSeveritySign(88);
    expect(signByScore.level).toBe("Critical");
    expect(signByScore.shape).toBe("octagon");

    const signByString = getSeveritySign("Minor");
    expect(signByString.level).toBe("Minor");
    expect(signByString.shape).toBe("circle");
  });
});
