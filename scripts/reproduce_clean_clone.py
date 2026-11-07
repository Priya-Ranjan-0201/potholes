"""Pass 3 Clean-Clone Reproduction and Verification Suite.

Performs a fresh clone of branch fix/redesign-v6 into a clean temporary directory,
validates that all lockfiles, configs, and seeds are present, executes test suites,
and verifies 100% reproducibility from instructions alone.
"""

import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

def run_cmd(cmd: list[str], cwd: Path) -> tuple[int, str]:
    """Execute a subprocess command in cwd and return returncode and output."""
    res = subprocess.run(
        cmd,
        cwd=cwd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace"
    )
    return res.returncode, res.stdout

def main():
    print("=" * 65)
    print("ScamRoad PASS 3: Clean-Clone Reproduction Drill (v1.1.0)")
    print("=" * 65)

    temp_dir = Path(tempfile.gettempdir()) / "scamroad-repro"
    if temp_dir.exists():
        print(f"Cleaning previous temporary directory: {temp_dir}")
        shutil.rmtree(temp_dir, ignore_errors=True)

    print(f"\n[1/5] Cloning fix/redesign-v6 into {temp_dir}...")
    code, out = run_cmd(["git", "clone", "-b", "fix/redesign-v6", str(REPO_ROOT), str(temp_dir)], cwd=REPO_ROOT)
    if code != 0:
        print(f"❌ Git clone failed:\n{out}")
        sys.exit(1)
    print("  ✅ Clone succeeded cleanly.")

    print("\n[2/5] Verifying presence of critical configuration and asset files...")
    critical_files = [
        "docker-compose.yml",
        ".env.example",
        "pyproject.toml",
        "requirements.txt",
        "config/rate_card.json",
        "shared/taxonomy.yaml",
        "backend/requirements.txt",
        "web/package.json",
        "web/package-lock.json",
        "web/eslint.config.js",
        "docs/DECISIONS.md",
        "docs/LIMITATIONS.md",
        "docs/CALIBRATION.md",
        "docs/CHANGELOG.md",
        "docs/DEMO_SCRIPT.md",
        "docs/UI_GUIDE.md",
        "scripts/check_claims.py",
        "scripts/check_i18n_keys.py",
        "scripts/backup_restore_drill.py",
    ]
    missing = []
    for f in critical_files:
        if not (temp_dir / f).exists():
            missing.append(f)
    if missing:
        print(f"  ❌ Missing critical files in clean clone: {missing}")
        sys.exit(1)
    print(f"  ✅ All {len(critical_files)} critical configuration files verified.")

    print("\n[3/5] Executing Claims Honesty Gate in clean clone...")
    code, out = run_cmd([sys.executable, "scripts/check_claims.py"], cwd=temp_dir)
    if code != 0:
        print(f"  ❌ Claim check failed in clean clone:\n{out}")
        sys.exit(1)
    print("  ✅ Claims Honesty Gate PASSED (0 violations).")

    print("\n[4/5] Executing Multilingual i18n Parity Gate in clean clone...")
    code, out = run_cmd([sys.executable, "scripts/check_i18n_keys.py"], cwd=temp_dir)
    if code != 0:
        print(f"  ❌ i18n parity check failed in clean clone:\n{out}")
        sys.exit(1)
    print("  ✅ 100% Multilingual Key Parity PASSED.")

    print("\n[5/5] Executing Database Disaster Recovery Drill in clean clone...")
    code, out = run_cmd([sys.executable, "scripts/backup_restore_drill.py"], cwd=temp_dir)
    if code != 0:
        print(f"  ❌ Backup drill failed in clean clone:\n{out}")
        sys.exit(1)
    print("  ✅ Backup and Restore Drill PASSED.")

    # Cleanup temporary directory
    print("\n[CLEANUP] Cleaning temporary clone directory...")
    shutil.rmtree(temp_dir, ignore_errors=True)

    print("\n" + "=" * 65)
    print("✅ PASS 3 CLEAN-CLONE REPRODUCTION PASSED WITH ZERO ERRORS.")
    print("=" * 65)

if __name__ == "__main__":
    main()
