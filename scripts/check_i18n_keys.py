"""Verifies translation key parity across all 6 languages in LanguageContext.tsx."""

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
        pattern = rf"\b{lang}:\s*\{{([^}}]+(?:\{{[^}}]*\}}[^}}]*)*)\}}"
        match = re.search(pattern, content)
        if not match:
            print(f"[ERROR] Could not find translation block for language: '{lang}'")
            return None

        block = match.group(1)
        keys = re.findall(r"^\s*([a-zA-Z0-9_]+)\s*:", block, re.MULTILINE)
        keys_by_lang[lang] = set(keys)

    return keys_by_lang


def main():
    if not LANG_FILE.exists():
        print(f"[ERROR] File not found: {LANG_FILE}")
        sys.exit(1)

    keys_by_lang = extract_language_keys()
    if not keys_by_lang:
        sys.exit(1)

    en_keys = keys_by_lang.get("en", set())
    print(f"Reference English (en) keys: {len(en_keys)}")

    all_passed = True
    for lang in ["hi", "pa", "ta", "te", "bn"]:
        lang_keys = keys_by_lang.get(lang, set())
        missing = en_keys - lang_keys
        coverage_pct = (len(en_keys - missing) / len(en_keys)) * 100 if en_keys else 0
        print(f"  [{lang.upper()}] {len(lang_keys)} keys ({coverage_pct:.1f}%)")
        if missing:
            all_passed = False
            print(f"  [FAIL] Missing keys: {sorted(missing)[:10]}")

    if all_passed:
        print("[PASS] 100% key parity across all 6 languages.")
        sys.exit(0)
    print("[FAIL] Incomplete translations detected.")
    sys.exit(1)


if __name__ == "__main__":
    main()
