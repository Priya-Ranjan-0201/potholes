import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

def main():
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--window-size=1680,1050")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")

    driver = webdriver.Chrome(options=chrome_options)
    try:
        print("Navigating to Scanner UI...")
        driver.get("http://localhost:3000/scanner")
        time.sleep(3)

        file_input = driver.find_element(By.CSS_SELECTOR, "input[type='file']")
        img_path = r"C:\Users\PRIYE RANJAN\.gemini\antigravity\brain\0e20c874-7353-488a-adc2-7caefedb3d34\extracted_user_road.jpg"
        print("Uploading user road image...")
        file_input.send_keys(img_path)

        # Wait for inference and crop generation
        time.sleep(4)

        screenshot_path = r"C:\Users\PRIYE RANJAN\.gemini\antigravity\brain\0e20c874-7353-488a-adc2-7caefedb3d34\perfect_model_ensemble_verification.png"
        driver.save_screenshot(screenshot_path)
        print(f"Saved verified screenshot to {screenshot_path}")

        # Check records
        rows = driver.find_elements(By.CSS_SELECTOR, "table tbody tr")
        print(f"Table records displayed: {len(rows)}")

    finally:
        driver.quit()

if __name__ == "__main__":
    main()
