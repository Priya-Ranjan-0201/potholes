from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
import time
import os
import sys

options = Options()
options.add_argument('--headless=new')
options.add_argument('--window-size=1680,1050')
options.add_argument('--disable-gpu')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')

chromedriver_path = r"C:\Users\PRIYE RANJAN\.cache\selenium\chromedriver\win64\156.0.8078.80\chromedriver.exe"
service = Service(chromedriver_path)
driver = webdriver.Chrome(service=service, options=options)

brain_dir = r"C:\Users\PRIYE RANJAN\.gemini\antigravity\brain\0e20c874-7353-488a-adc2-7caefedb3d34"

try:
    print("Navigating to app...", flush=True)
    driver.get("http://localhost:3000/")
    time.sleep(1.5)

    # 1. Light Mode Overview
    driver.execute_script("localStorage.setItem('scamroad_theme', 'light'); window.location.reload();")
    time.sleep(2)
    driver.save_screenshot(os.path.join(brain_dir, "human_overview_light.png"))
    print("Saved human_overview_light.png", flush=True)

    # 2. Light Mode Scanner
    driver.get("http://localhost:3000/scanner")
    time.sleep(2)
    driver.save_screenshot(os.path.join(brain_dir, "human_scanner_light.png"))
    print("Saved human_scanner_light.png", flush=True)

    # 3. Light Mode Maintenance - Work Orders
    driver.get("http://localhost:3000/maintenance?tab=work-orders")
    time.sleep(2)
    driver.save_screenshot(os.path.join(brain_dir, "human_maintenance_light.png"))
    print("Saved human_maintenance_light.png", flush=True)

    # 4. Light Mode Maintenance - Repair Verification
    driver.get("http://localhost:3000/maintenance?tab=verification")
    time.sleep(2)
    driver.save_screenshot(os.path.join(brain_dir, "human_verification_light.png"))
    print("Saved human_verification_light.png", flush=True)

    # 5. Light Mode Benchmarks - Edge
    driver.get("http://localhost:3000/benchmarks")
    time.sleep(2)
    driver.save_screenshot(os.path.join(brain_dir, "human_benchmarks_light.png"))
    print("Saved human_benchmarks_light.png", flush=True)

    # Switch to Dark Mode
    driver.execute_script("localStorage.setItem('scamroad_theme', 'dark'); window.location.reload();")
    time.sleep(2)

    # 6. Dark Mode Overview
    driver.get("http://localhost:3000/")
    time.sleep(2)
    driver.save_screenshot(os.path.join(brain_dir, "human_overview_dark.png"))
    print("Saved human_overview_dark.png", flush=True)

    # 7. Dark Mode Scanner
    driver.get("http://localhost:3000/scanner")
    time.sleep(2)
    driver.save_screenshot(os.path.join(brain_dir, "human_scanner_dark.png"))
    print("Saved human_scanner_dark.png", flush=True)

    # 8. Dark Mode Verification
    driver.get("http://localhost:3000/maintenance?tab=verification")
    time.sleep(2)
    driver.save_screenshot(os.path.join(brain_dir, "human_verification_dark.png"))
    print("Saved human_verification_dark.png", flush=True)

    print("ALL 8 HUMAN AUDIT SCREENSHOTS CAPTURED SUCCESSFULLY", flush=True)

finally:
    driver.quit()
