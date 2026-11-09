from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import time
import os

options = Options()
options.add_argument('--headless=new')
options.add_argument('--window-size=1680,1100')
driver = webdriver.Chrome(options=options)

brain_dir = r"C:\Users\PRIYE RANJAN\.gemini\antigravity\brain\0e20c874-7353-488a-adc2-7caefedb3d34"

try:
    # 1. Dark Mode Overview
    driver.get("http://localhost:3000/")
    time.sleep(1)
    driver.execute_script("localStorage.setItem('scamroad_theme', 'dark'); window.location.reload();")
    time.sleep(2)
    driver.save_screenshot(os.path.join(brain_dir, "perfect_overview_dark.png"))
    print("Saved perfect_overview_dark.png")

    # 2. Light Mode Overview
    driver.execute_script("localStorage.setItem('scamroad_theme', 'light'); window.location.reload();")
    time.sleep(2)
    driver.save_screenshot(os.path.join(brain_dir, "perfect_overview_light.png"))
    print("Saved perfect_overview_light.png")

    # 3. Light Mode Maintenance
    driver.get("http://localhost:3000/maintenance")
    time.sleep(2)
    driver.save_screenshot(os.path.join(brain_dir, "perfect_maintenance_light.png"))
    print("Saved perfect_maintenance_light.png")

finally:
    driver.quit()

