import { describe, it, expect } from "vitest";
import { TRANSLATIONS, LANGUAGES, LanguageCode } from "../context/LanguageContext";

describe("Multilingual Language System", () => {
  it("defines all 6 supported Indian regional languages", () => {
    expect(LANGUAGES).toHaveLength(6);
    const codes = LANGUAGES.map((l) => l.code);
    expect(codes).toEqual(["en", "hi", "pa", "ta", "te", "bn"]);
  });

  it("contains 100% dictionary key coverage for every language compared to English", () => {
    const enKeys = Object.keys(TRANSLATIONS.en);
    expect(enKeys.length).toBeGreaterThan(100);

    const targetLanguages: LanguageCode[] = ["hi", "pa", "ta", "te", "bn"];
    targetLanguages.forEach((lang) => {
      const langKeys = Object.keys(TRANSLATIONS[lang]);
      const missingKeys = enKeys.filter((k) => !(k in TRANSLATIONS[lang]));
      expect(
        missingKeys,
        `Language '${lang}' missing keys: ${missingKeys.join(", ")}`
      ).toHaveLength(0);
      expect(langKeys.length).toBe(enKeys.length);
    });
  });

  it("verifies honest student research disclaimers across all language banners", () => {
    expect(TRANSLATIONS.en.govtBanner).toContain("Student Research Project");
    expect(TRANSLATIONS.en.footerNotice).toContain("Student research project");
    expect(TRANSLATIONS.hi.govtBanner).toContain("छात्र अनुसंधान परियोजना");
    expect(TRANSLATIONS.pa.govtBanner).toContain("ਵਿਦਿਆਰਥੀ ਖੋਜ ਪ੍ਰੋਜੈਕਟ");
  });

  it("verifies inspired standards rubric notices rather than compliant badges", () => {
    expect(TRANSLATIONS.en.standardsNotice).toContain("inspired by");
    expect(TRANSLATIONS.en.standardsNotice).not.toContain("Compliant");
    expect(TRANSLATIONS.hi.standardsNotice).toContain("प्रेरित");
    expect(TRANSLATIONS.pa.standardsNotice).toContain("ਪ੍ਰੇਰਿਤ");
  });
});
