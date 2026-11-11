"""Automated claim verification and banned phrase checker for ScamRoad."""

import os
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

# Files and directories subject to strict honesty scanning
SCANNED_TARGETS = [
    REPO_ROOT / "README.md",
    REPO_ROOT / "web" / "src",
    REPO_ROOT / "backend" / "app",
    REPO_ROOT / "edge" / "agent",
]

# General honesty and institutional banned phrases (apply to code and docs)
GENERAL_BANNED_PATTERNS = [
    (r"Government of India", "Government of India (Rule R7: ScamRoad is a student project, not GoI)"),
    (r"सत्यमेव जयते", "National motto 'सत्यमेव जयते' (Rule R7)"),
    (r"National (AI )?Road Defect.*Portal", "Official national portal branding (Rule R7)"),
    (r"(?i)IRC[:\s\w-]+Compliant", "IRC Compliant claim (Rule R8: Use 'inspired by' rubric with clause)"),
    (r"(?i)Compliant-IRC", "IRC Compliant badge (Rule R8)"),
    (r"(?i)Zero Mock Data", "Zero Mock Data claim (Rule R2: Seed data exists and must be badged)"),
    (r"(?i)mission-critical", "Mission-critical claim (Rule R1 / Rule R7: Not safety certified)"),
    (r"Designed for NHAI", "Designed for NHAI official branding (Rule R7)"),
]

# Map banned phrases (Phase 1: completely removed from web/src, README.md, docs)
MAP_BANNED_PATTERNS = [
    (r"(?i)Leaflet", "Leaflet map mention (Phase 1: Map feature removed completely)"),
    (r"(?i)OpenStreetMap", "OpenStreetMap mention (Phase 1: Map feature removed completely)"),
    (r"/map\b", "/map route mention (Phase 1: Map feature removed completely)"),
    (r"(?i)\bheatmap\b", "heatmap mention (Phase 1: Map feature removed completely)"),
    (r"(?i)GIS\s+map", "GIS map mention (Phase 1: Map feature removed completely)"),
]

# Docs that document the removal of the map feature or historical release notes
DOCS_MAP_EXCEPTIONS = [
    "CHANGELOG.md",
]

def check_banned_phrases():
    violations = []

    # 1. Check general banned patterns across code & README
    general_targets = [
        REPO_ROOT / "README.md",
        REPO_ROOT / "web" / "src",
        REPO_ROOT / "backend" / "app",
        REPO_ROOT / "edge" / "agent",
    ]

    for target in general_targets:
        if not target.exists():
            continue
        files = [target] if target.is_file() else list(target.rglob("*.tsx")) + list(target.rglob("*.ts")) + list(target.rglob("*.py"))
        for fpath in files:
            if "node_modules" in str(fpath) or "check_claims.py" in str(fpath) or "patch_language_context.py" in str(fpath):
                continue
            try:
                content = fpath.read_text(encoding="utf-8")
            except Exception:
                continue

            for pattern, reason in GENERAL_BANNED_PATTERNS:
                matches = list(re.finditer(pattern, content))
                for m in matches:
                    line_num = content[:m.start()].count("\n") + 1
                    violations.append(f"{fpath.relative_to(REPO_ROOT)}:{line_num} - Found '{m.group(0)}' ({reason})")

    # 2. Check map banned patterns in web/src/, README.md, and docs/ (Phase 1 requirement)
    map_targets = [
        REPO_ROOT / "web" / "src",
        REPO_ROOT / "README.md",
        REPO_ROOT / "docs",
    ]

    for target in map_targets:
        if not target.exists():
            continue
        if target.is_file():
            files = [target]
        else:
            files = list(target.rglob("*.tsx")) + list(target.rglob("*.ts")) + list(target.rglob("*.md"))

        for fpath in files:
            rel_path = str(fpath.relative_to(REPO_ROOT)).replace("\\", "/")
            if any(exc in rel_path for exc in DOCS_MAP_EXCEPTIONS):
                continue
            if "node_modules" in rel_path:
                continue
            try:
                content = fpath.read_text(encoding="utf-8")
            except Exception:
                continue

            for pattern, reason in MAP_BANNED_PATTERNS:
                matches = list(re.finditer(pattern, content))
                for m in matches:
                    line_num = content[:m.start()].count("\n") + 1
                    violations.append(f"{fpath.relative_to(REPO_ROOT)}:{line_num} - Found '{m.group(0)}' ({reason})")

    return violations

def check_traceability():
    issues = []
    
    # 1. Rate Card File
    rate_card = REPO_ROOT / "config" / "rate_card.json"
    if not rate_card.exists():
        issues.append(f"Missing rate card configuration: {rate_card}")
    else:
        text = rate_card.read_text(encoding="utf-8")
        if "Illustrative estimate" not in text:
            issues.append(f"{rate_card} must include 'Illustrative estimate' notice per Rule R9")

    # 2. Notebook links in README
    readme_text = (REPO_ROOT / "README.md").read_text(encoding="utf-8")
    notebook_matches = re.findall(r"notebooks/[\w\-_]+\.ipynb", readme_text)
    for nb in notebook_matches:
        nb_path = REPO_ROOT / nb
        if not nb_path.exists():
            issues.append(f"README.md references non-existent notebook: {nb}")

    # 3. Benchmark files cited in README
    bench_matches = re.findall(r"edge/benchmarks/results/[\w\-_]+\.json", readme_text)
    for b in bench_matches:
        b_path = REPO_ROOT / b
        if not b_path.exists():
            issues.append(f"README.md references non-existent benchmark result: {b}")

    # 4. Model artifacts
    best_int8 = REPO_ROOT / "runs" / "export" / "best_int8.onnx"
    if not best_int8.exists():
        issues.append(f"Missing verified model artifact: {best_int8}")

    return issues

def main():
    print("=" * 60)
    print("ScamRoad Claims & Asset Traceability Check")
    print("=" * 60)

    banned_violations = check_banned_phrases()
    traceability_issues = check_traceability()

    if banned_violations:
        print(f"\n[FAIL] Found {len(banned_violations)} banned phrase violation(s):")
        for v in banned_violations:
            print(f"  - {v}")
    else:
        print("\n[PASS] Zero banned phrases found across scanned targets.")

    if traceability_issues:
        print(f"\n[FAIL] Found {len(traceability_issues)} traceability issue(s):")
        for iss in traceability_issues:
            print(f"  - {iss}")
    else:
        print("[PASS] All claims, rate cards, and artifacts traced to real files.")

    total_errors = len(banned_violations) + len(traceability_issues)
    if total_errors > 0:
        print(f"\n[FAIL] Check failed with {total_errors} issue(s).")
        sys.exit(1)
    else:
        print("\n[PASS] System claims and assets verified.")
        sys.exit(0)

if __name__ == "__main__":
    main()

