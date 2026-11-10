from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
import time
import os

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
clean_sample = r"C:\Users\PRIYE RANJAN\OneDrive\Desktop\COMPUTER VISION\scam_road\web\public\samples\user_tested_potholes_clean.jpg"

try:
    driver.get("http://localhost:3000/scanner")
    time.sleep(2)

    file_input = driver.find_element(By.CSS_SELECTOR, "input[type='file']")
    file_input.send_keys(clean_sample)
    time.sleep(3)

    screenshot_path = os.path.join(brain_dir, "verified_clean_sample_analysis.png")
    driver.save_screenshot(screenshot_path)
    print("Saved verified_clean_sample_analysis.png", flush=True)

finally:
    driver.quit()
