import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

options = Options()
options.add_argument("--headless=new")
options.add_argument("--window-size=1600,1400")
options.add_argument("--no-sandbox")
options.add_argument("--disable-gpu")

driver = webdriver.Chrome(options=options)
try:
    url = "http://localhost:3000/maintenance?tab=verification"
    driver.get(url)
    time.sleep(2)
    # Find button and click
    buttons = driver.find_elements(By.TAG_NAME, "button")
    verify_btn = None
    for b in buttons:
        if "Run AI Verification" in b.text:
            verify_btn = b
            break
    if verify_btn:
        verify_btn.click()
        print("Clicked Run AI Verification, waiting...")
        time.sleep(4)

    # Scroll down to show telemetry metrics and audit table
    driver.execute_script("window.scrollTo(0, 900);")
    time.sleep(1)
    out_path_scroll = r"C:\Users\PRIYE RANJAN\.gemini\antigravity\brain\0e20c874-7353-488a-adc2-7caefedb3d34\repair_verification_telemetry_table.png"
    driver.save_screenshot(out_path_scroll)
    print("Saved scrolled screenshot to", out_path_scroll)
finally:
    driver.quit()
