"""Verifies 100% translation key parity across all 6 languages in LanguageContext.tsx.

Checks English (en), Hindi (hi), Punjabi (pa), Tamil (ta), Telugu (te), and Bengali (bn).
Adheres to Phase 6 Gate requirements.
"""

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
LANG_FILE = REPO_ROOT / "web" / "src" / "context" / "LanguageContext.tsx"

def extract_language_keys():
    content = LANG_FILE.read_text(encoding="utf-8")
    languages = ["en", "hi", "pa", "ta", "te", "bn"]
    keys_by_lang = {}

    for lang in languages:
        # Match pattern: lang: {\n ... \n  },
        # Or search for the section beginning with `lang: {`
        pattern = rf"\b{lang}:\s*\{{([^}}]+(?:\{{[^}}]*\}}[^}}]*)*)\}}"
        match = re.search(pattern, content)
        if not match:
            print(f"[ERROR] Could not find translation block for language: '{lang}'")
            return None

        block = match.group(1)
        # Extract keys matching: keyName: "..."
        keys = re.findall(r"^\s*([a-zA-Z0-9_]+)\s*:", block, re.MULTILINE)
        keys_by_lang[lang] = set(keys)

    return keys_by_lang

def main():
    print("=" * 60)
    print("ScamRoad Phase 6: Multilingual 6-Language Parity Check")
    print("=" * 60)

    if not LANG_FILE.exists():
        print(f"❌ File not found: {LANG_FILE}")
        sys.exit(1)

    keys_by_lang = extract_language_keys()
    if not keys_by_lang:
        sys.exit(1)

    en_keys = keys_by_lang.get("en", set())
    print(f"Reference English (en) Translation Keys Count: {len(en_keys)}")

    all_passed = True
    for lang in ["hi", "pa", "ta", "te", "bn"]:
        lang_keys = keys_by_lang.get(lang, set())
        missing = en_keys - lang_keys
        extra = lang_keys - en_keys
        coverage_pct = (len(en_keys - missing) / len(en_keys)) * 100 if en_keys else 0

        print(f"\nLanguage: [{lang.upper()}] - {len(lang_keys)} keys (Coverage: {coverage_pct:.1f}%)")
        if missing:
            all_passed = False
            print(f"  ❌ Missing {len(missing)} key(s): {sorted(list(missing))[:10]}")
        else:
            print("  ✅ 100% key parity with English baseline.")

    if all_passed:
        print("\n✅ Phase 6 i18n Gate PASSED: 100% dictionary coverage across all 6 Indian languages.")
        sys.exit(0)
    else:
        print("\n❌ Phase 6 i18n Gate FAILED: Incomplete translations detected.")
        sys.exit(1)

if __name__ == "__main__":
    main()

