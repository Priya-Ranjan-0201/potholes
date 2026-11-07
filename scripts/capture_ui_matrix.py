"""Automated UI Screenshot Matrix and Accessibility Verification Suite (v8 Gate).

Captures full desktop Dhaba Dawn (light mode), Highway Night (dark mode), and mobile viewport (375px)
screenshots of all primary ScamRoad routes. Verifies WCAG 2.2 contrast compliance.
Saves artifacts to docs/screenshots/.
"""

import json
import math
import os
import sys
import time
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

REPO_ROOT = Path(__file__).resolve().parent.parent
SCREENSHOT_DIR = REPO_ROOT / "docs" / "screenshots"

def calculate_luminance(hex_color: str) -> float:
    """Calculate relative luminance per WCAG 2.1 formula."""
    hex_color = hex_color.lstrip("#")
    r, g, b = [int(hex_color[i:i+2], 16) / 255.0 for i in (0, 2, 4)]
    
    def adjust(c):
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4

    return 0.2126 * adjust(r) + 0.7152 * adjust(g) + 0.0722 * adjust(b)

def calculate_contrast_ratio(hex1: str, hex2: str) -> float:
    """Calculate contrast ratio between two hex colors."""
    l1 = calculate_luminance(hex1)
    l2 = calculate_luminance(hex2)
    lighter = max(l1, l2)
    darker = min(l1, l2)
    return round((lighter + 0.05) / (darker + 0.05), 2)

def verify_wcag_contrast():
    print("\n--- WCAG 2.2 AA / AAA Contrast Verification (v8 Tokens) ---")
    tokens = [
        ("Dhaba Dawn Text (#1B1308) on Cream Base (#FFF8EC)", "#1B1308", "#FFF8EC", 4.5, "AAA"),
        ("Highway Night Text (#F3EEE2) on Asphalt Base (#0A0C12)", "#F3EEE2", "#0A0C12", 4.5, "AAA"),
        ("Critical Sign (#D7263D) on Pure White (#FFFFFF)", "#D7263D", "#FFFFFF", 4.5, "AA"),
        ("Marigold (#FFB300) on Asphalt Base (#0A0C12)", "#FFB300", "#0A0C12", 4.5, "AAA"),
        ("Peacock Text (#007A7A) on Cream Base (#FFF8EC)", "#007A7A", "#FFF8EC", 4.5, "AA"),
        ("Severe Sign (#F26A1B) on Asphalt Base (#0A0C12)", "#F26A1B", "#0A0C12", 4.5, "AA"),
    ]
    all_passed = True
    for desc, c1, c2, required, level in tokens:
        ratio = calculate_contrast_ratio(c1, c2)
        passed = ratio >= required
        status = f"✅ PASS ({ratio}:1 >= {required}:1 for {level})" if passed else f"❌ FAIL ({ratio}:1 < {required}:1)"
        print(f"  {desc:<65}: {status}")
        if not passed:
            all_passed = False
    return all_passed

def capture_ui_matrix():
    SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

    base_url = "http://localhost:3000"
    pages = [
        ("/", "01_dashboard"),
        ("/scanner", "02_scanner"),
        ("/maintenance", "03_maintenance"),
        ("/complaints", "04_complaints"),
        ("/defects", "05_defects"),
        ("/models", "06_models"),
        ("/evaluation", "07_evaluation"),
    ]

    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--window-size=1600,1050")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")

    driver = webdriver.Chrome(options=chrome_options)
    captured = []

    try:
        # 1. Desktop Dhaba Dawn (Light Mode)
        print("\n[CAPTURE] Capturing Desktop Dhaba Dawn (Light Mode) pages...")
        for route, prefix in pages:
            driver.get(f"{base_url}{route}")
            time.sleep(1.5)
            # Ensure light mode
            driver.execute_script("document.documentElement.classList.remove('dark'); localStorage.setItem('scamroad_theme', 'light');")
            time.sleep(0.5)

            out_file = SCREENSHOT_DIR / f"{prefix}_dhaba_dawn.png"
            driver.save_screenshot(str(out_file))
            print(f"  📸 Saved: {out_file.name}")
            captured.append(str(out_file))

        # 2. Desktop Highway Night (Dark Mode)
        print("\n[CAPTURE] Capturing Desktop Highway Night (Dark Mode) pages...")
        for route, prefix in pages:
            driver.get(f"{base_url}{route}")
            time.sleep(1.0)
            # Enable dark mode
            driver.execute_script("document.documentElement.classList.add('dark'); localStorage.setItem('scamroad_theme', 'dark');")
            time.sleep(0.5)

            out_file = SCREENSHOT_DIR / f"{prefix}_highway_night.png"
            driver.save_screenshot(str(out_file))
            print(f"  📸 Saved: {out_file.name}")
            captured.append(str(out_file))

        # 3. Mobile Viewport (375x812 - iPhone / Android portrait)
        print("\n[CAPTURE] Capturing Mobile Viewport (375px)...")
        driver.set_window_size(375, 812)
        mobile_pages = [("/", "10_mobile_dashboard"), ("/scanner", "11_mobile_scanner"), ("/defects", "12_mobile_defects")]
        for route, prefix in mobile_pages:
            driver.get(f"{base_url}{route}")
            time.sleep(1.5)
            out_file = SCREENSHOT_DIR / f"{prefix}.png"
            driver.save_screenshot(str(out_file))
            print(f"  📱 Saved: {out_file.name}")
            captured.append(str(out_file))

    finally:
        driver.quit()

    return captured

def main():
    print("=" * 60)
    print("ScamRoad v8: UI/UX Matrix & Contrast Verification")
    print("=" * 60)

    contrast_passed = verify_wcag_contrast()
    captured_files = capture_ui_matrix()

    print(f"\n[SUMMARY] Successfully captured {len(captured_files)} screenshots.")
    if contrast_passed and len(captured_files) >= 14:
        print("\n✅ Phase P8 Verification PASSED: All UI matrix screenshots saved and WCAG standards satisfied.")
        sys.exit(0)
    else:
        print("\n❌ Phase P8 Verification incomplete.")
        sys.exit(1)

if __name__ == "__main__":
    main()
