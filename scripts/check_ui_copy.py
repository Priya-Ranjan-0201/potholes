#!/usr/bin/env python3
"""Anti-slop copy and styling verification guardrail for ScamRoad.
Scans web/src, web/public, and i18n files to ensure zero banned marketing buzzwords,
zero prompt-rule references, and zero novelty theme gimmicks.
"""

import os
import sys
import re

BANNED_STRINGS = [
    r"Rule R",
    r"Rule B",
    r"\(Rule",
    r"Clause \d",
    r"IRC:SP",
    r"Empirical",
    r"Autonomous",
    r"Hyper-",
    r"Quantized Neural",
    r"Command Center",
    r"Sparkles",
    r"dhaba",
    r"truck art",
    r"TruckArt",
    r"PatternBand",
    r"CatsEye",
    r"cats-eye",
    r"milestone",
    r"KM \d",
    r"ambient-glow",
    r"mesh",
    r"Zero Mock",
    r"Frozen",
    r"Design Lab",
    r"design-lab",
    r"marquee",
    r"kolam",
    r"phulkari",
    r"madhubani",
    r"warli",
    r"rangoli",
]

BANNED_CSS = [
    r"blur-3xl",
]

def scan_files(root_dir="web/src"):
    violations = []
    
    for root, _, files in os.walk(root_dir):
        # Exclude node_modules, dist, tests of the checker itself
        if "node_modules" in root or "dist" in root or ".git" in root:
            continue
        for file in files:
            if not file.endswith((".tsx", ".ts", ".css", ".html", ".json")):
                continue
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                lines = f.readlines()
                
            for idx, line in enumerate(lines, 1):
                # Check banned strings
                for pattern in BANNED_STRINGS:
                    if re.search(pattern, line, re.IGNORECASE):
                        violations.append((path, idx, line.strip(), pattern))
                for pattern in BANNED_CSS:
                    if re.search(pattern, line, re.IGNORECASE):
                        violations.append((path, idx, line.strip(), f"CSS pattern: {pattern}"))
                        
    return violations

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "web/src"
    violations = scan_files(target)
    
    if violations:
        print(f"❌ Found {len(violations)} anti-slop copy/styling violations in {target}:")
        for path, line_no, content, rule in violations[:30]:
            print(f"  {path}:{line_no} [{rule}] -> {content}")
        if len(violations) > 30:
            print(f"  ... and {len(violations) - 30} more violations.")
        sys.exit(1)
    else:
        print(f"✅ Anti-slop copy check passed with 0 violations in {target}!")
        sys.exit(0)
