import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

options = Options()
options.add_argument("--headless=new")
options.add_argument("--window-size=1680,1100")
options.add_argument("--no-sandbox")
options.add_argument("--disable-gpu")

brain_dir = r"C:\Users\PRIYE RANJAN\.gemini\antigravity\brain\0e20c874-7353-488a-adc2-7caefedb3d34"

driver = webdriver.Chrome(options=options)
try:
    # 1. Overview Page
    driver.get("http://localhost:3000/")
    time.sleep(2)
    p1 = os.path.join(brain_dir, "final_overview.png")
    driver.save_screenshot(p1)
    print("Saved final_overview.png")

    # 2. Scanner Page (Step 7 layout)
    driver.get("http://localhost:3000/scanner")
    time.sleep(2)
    p2 = os.path.join(brain_dir, "final_scanner_step7.png")
    driver.save_screenshot(p2)
    print("Saved final_scanner_step7.png")

    # 3. Maintenance Page (Compact Kanban)
    driver.get("http://localhost:3000/maintenance")
    time.sleep(2)
    p3 = os.path.join(brain_dir, "final_maintenance_compact.png")
    driver.save_screenshot(p3)
    print("Saved final_maintenance_compact.png")

    # 4. Maintenance Page (Verification Tab)
    driver.get("http://localhost:3000/maintenance?tab=verification")
    time.sleep(2)
    p4 = os.path.join(brain_dir, "final_maintenance_verification.png")
    driver.save_screenshot(p4)
    print("Saved final_maintenance_verification.png")

    # 5. Benchmarks Page (Edge Telemetry)
    driver.get("http://localhost:3000/benchmarks")
    time.sleep(2)
    p5 = os.path.join(brain_dir, "final_benchmarks_telemetry.png")
    driver.save_screenshot(p5)
    print("Saved final_benchmarks_telemetry.png")

    # 6. Benchmarks Page (Drift Monitoring Tab)
    buttons = driver.find_elements(By.TAG_NAME, "button")
    for b in buttons:
        if "Drift" in b.text or "Monitoring" in b.text:
            b.click()
            break
    time.sleep(2)
    p6 = os.path.join(brain_dir, "final_benchmarks_drift.png")
    driver.save_screenshot(p6)
    print("Saved final_benchmarks_drift.png")

finally:
    driver.quit()

