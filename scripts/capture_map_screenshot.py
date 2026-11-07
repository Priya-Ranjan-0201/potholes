"""Captures live browser screenshot of restored GIS map for Phase 5 Gate."""

import os
import sys
import time
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

REPO_ROOT = Path(__file__).resolve().parent.parent

def capture_map():
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--window-size=1600,1050")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")

    driver = webdriver.Chrome(options=chrome_options)
    try:
        url = "http://localhost:3000/map"
        print(f"[SCREENSHOT] Navigating to {url}...")
        driver.get(url)

        # Wait for map container to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, "leaflet-container"))
        )
        print("  Leaflet container rendered.")
        time.sleep(3) # Allow tiles and vector markers to render

        # Check if markers rendered and click one if present to open slide drawer
        markers = driver.find_elements(By.CLASS_NAME, "leaflet-interactive")
        if markers:
            print(f"  Found {len(markers)} interactive map markers. Clicking first marker to open drawer...")
            markers[0].click()
            time.sleep(1)

        out_path = REPO_ROOT / "docs" / "screenshots" / "map_restored.png"
        out_path.parent.mkdir(parents=True, exist_ok=True)
        driver.save_screenshot(str(out_path))
        print(f"✅ Successfully captured screenshot to: {out_path}")

    finally:
        driver.quit()

if __name__ == "__main__":
    capture_map()
