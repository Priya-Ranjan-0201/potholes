import { describe, it, expect } from "vitest";
import { translations, TranslationDictionary } from "../i18n/translations";
import { setLanguage, t, getDamageClassName } from "../i18n";

describe("Mobile Internationalization (i18n) Subsystem", () => {
  const expectedKeys: (keyof TranslationDictionary)[] = [
    "app_name",
    "tagline",
    "safety_notice",
    "safety_detail",
    "mode_citizen",
    "mode_drive",
    "mode_outbox",
    "mode_checklist",
    "class_POTHOLE",
    "class_CRACK_LONG",
    "class_CRACK_TRANS",
    "class_CRACK_ALLIGATOR",
    "report_title",
    "report_subtitle",
    "take_photo",
    "submit_report",
    "drive_hud_title",
    "drive_fps",
    "outbox_title",
    "checklist_title",
  ];

  it("maintains 100% key parity across English, Hindi, and Punjabi dictionaries", () => {
    const enKeys = Object.keys(translations.en).sort();
    const hiKeys = Object.keys(translations.hi).sort();
    const paKeys = Object.keys(translations.pa).sort();

    expect(hiKeys).toEqual(enKeys);
    expect(paKeys).toEqual(enKeys);

    for (const key of expectedKeys) {
      expect(translations.en[key]).toBeTruthy();
      expect(translations.hi[key]).toBeTruthy();
      expect(translations.pa[key]).toBeTruthy();
    }
  });

  it("translates damage classes strictly conforming to shared/taxonomy.yaml", () => {
    setLanguage("en");
    expect(getDamageClassName("POTHOLE")).toBe("Pothole");
    expect(getDamageClassName("CRACK_LONG")).toBe("Longitudinal Crack");

    setLanguage("hi");
    expect(getDamageClassName("POTHOLE")).toBe("गड्ढा");
    expect(getDamageClassName("CRACK_LONG")).toBe("अनुदैर्ध्य दरार");

    setLanguage("pa");
    expect(getDamageClassName("POTHOLE")).toBe("ਟੋਆ");
    expect(getDamageClassName("CRACK_LONG")).toBe("ਲੰਬਕਾਰੀ ਦਰਾਰ");
  });

  it("falls back to English when unknown key or language provided", () => {
    setLanguage("en");
    expect(t("app_name")).toBe("ScamRoad");
  });
});

