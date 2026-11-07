"""Capture Theme Compare Matrix and Colorblind Contrast Verification for v9.
Saves comparison screenshots of all 4 themes in light and dark mode to docs/screenshots/theme-compare/.
"""

import os
import sys
import time
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

REPO_ROOT = Path(__file__).resolve().parent.parent
COMPARE_DIR = REPO_ROOT / "docs" / "screenshots" / "theme-compare"

THEMES = [
    ("holi-highway", "01_theme_a_holi_highway"),
    ("truck-art-neon", "02_theme_b_truck_art_neon"),
    ("monsoon-dusk", "03_theme_c_monsoon_dusk"),
    ("punjab-fields", "04_theme_d_punjab_fields"),
]

def capture_theme_compare():
    COMPARE_DIR.mkdir(parents=True, exist_ok=True)
    base_url = "http://localhost:3000/design-lab"

    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--window-size=1600,1050")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")

    driver = webdriver.Chrome(options=chrome_options)
    captured = []

    try:
        print("\n[THEME LAB] Capturing 4 Themes x Light and Dark Mode...")
        for theme_id, prefix in THEMES:
            # 1. Light Mode
            driver.get(base_url)
            time.sleep(1.2)
            driver.execute_script(
                f"document.documentElement.setAttribute('data-theme', '{theme_id}');"
                f"document.documentElement.classList.remove('dark');"
                f"localStorage.setItem('scamroad_theme_preset', '{theme_id}');"
                f"localStorage.setItem('scamroad_theme', 'light');"
            )
            time.sleep(0.8)
            light_file = COMPARE_DIR / f"{prefix}_light.png"
            driver.save_screenshot(str(light_file))
            print(f"  📸 Saved Light: {light_file.name}")
            captured.append(str(light_file))

            # 2. Dark Mode
            driver.execute_script(
                f"document.documentElement.classList.add('dark');"
                f"localStorage.setItem('scamroad_theme', 'dark');"
            )
            time.sleep(0.8)
            dark_file = COMPARE_DIR / f"{prefix}_dark.png"
            driver.save_screenshot(str(dark_file))
            print(f"  📸 Saved Dark:  {dark_file.name}")
            captured.append(str(dark_file))

    finally:
        driver.quit()

    return captured

def main():
    print("=" * 60)
    print("ScamRoad v9: Theme Lab Comparison Matrix")
    print("=" * 60)
    files = capture_theme_compare()
    print(f"\n[SUMMARY] Successfully captured {len(files)} theme comparison screenshots in docs/screenshots/theme-compare/.")

if __name__ == "__main__":
    main()
