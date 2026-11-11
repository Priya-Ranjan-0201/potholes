import { describe, it, expect } from "vitest";
import {
  getSeverityFromScore,
  SEVERITY_COLORS,
  SeverityLevel,
} from "../ui/data/SeverityBadge";

describe("Severity Classification Helpers", () => {
  it("maps severity scores to canonical severity levels", () => {
    expect(getSeverityFromScore(10)).toBe("Minor");
    expect(getSeverityFromScore(25)).toBe("Minor");
    expect(getSeverityFromScore(26)).toBe("Moderate");
    expect(getSeverityFromScore(50)).toBe("Moderate");
    expect(getSeverityFromScore(51)).toBe("Severe");
    expect(getSeverityFromScore(75)).toBe("Severe");
    expect(getSeverityFromScore(76)).toBe("Critical");
    expect(getSeverityFromScore(100)).toBe("Critical");
  });

  it("defines distinct colors for every severity level", () => {
    const levels: SeverityLevel[] = ["Minor", "Moderate", "Severe", "Critical"];
    const colors = levels.map((lvl) => SEVERITY_COLORS[lvl]);
    expect(new Set(colors).size).toBe(4);
  });
});
