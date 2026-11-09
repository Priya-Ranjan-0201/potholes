from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
import time
import os

options = Options()
options.add_argument('--headless=new')
options.add_argument('--window-size=1680,1100')
driver = webdriver.Chrome(options=options)

brain_dir = r"C:\Users\PRIYE RANJAN\.gemini\antigravity\brain\0e20c874-7353-488a-adc2-7caefedb3d34"

try:
    # 1. Scanner Page in Light Mode
    driver.get("http://localhost:3000/scanner")
    time.sleep(1)
    driver.execute_script("localStorage.setItem('scamroad_theme', 'light'); window.location.reload();")
    time.sleep(2)
    driver.save_screenshot(os.path.join(brain_dir, "debug_light_scanner.png"))
    print("Saved debug_light_scanner.png")

    # 2. Maintenance Page in Light Mode
    driver.get("http://localhost:3000/maintenance")
    time.sleep(2)
    driver.save_screenshot(os.path.join(brain_dir, "debug_light_maintenance.png"))
    print("Saved debug_light_maintenance.png")

    # 3. Model Benchmarks Page in Light Mode
    driver.get("http://localhost:3000/benchmarks")
    time.sleep(2)
    driver.save_screenshot(os.path.join(brain_dir, "debug_light_benchmarks.png"))
    print("Saved debug_light_benchmarks.png")

finally:
    driver.quit()
