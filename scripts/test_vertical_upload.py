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
        # Test 1: Upload Horizontal User Road Photo
        print("Test 1: Navigating to Scanner UI...")
        driver.get("http://localhost:3000/scanner")
        time.sleep(3)

        file_input = driver.find_element(By.CSS_SELECTOR, "input[type='file']")
        img_horizontal = r"C:\Users\PRIYE RANJAN\.gemini\antigravity\brain\0e20c874-7353-488a-adc2-7caefedb3d34\extracted_user_road.jpg"
        print("Uploading horizontal user road image...")
        file_input.send_keys(img_horizontal)
        time.sleep(4)

        shot1 = r"C:\Users\PRIYE RANJAN\.gemini\antigravity\brain\0e20c874-7353-488a-adc2-7caefedb3d34\verified_horizontal_locked.png"
        driver.save_screenshot(shot1)
        print("Saved screenshot 1 to:", shot1)

        # Test 2: Upload Vertical Road Photo
        file_input = driver.find_element(By.CSS_SELECTOR, "input[type='file']")
        img_vertical = r"C:\Users\PRIYE RANJAN\.gemini\antigravity\brain\0e20c874-7353-488a-adc2-7caefedb3d34\vertical_test_road.jpg"
        print("Uploading vertical road image...")
        file_input.send_keys(img_vertical)
        time.sleep(4)

        shot2 = r"C:\Users\PRIYE RANJAN\.gemini\antigravity\brain\0e20c874-7353-488a-adc2-7caefedb3d34\verified_vertical_locked.png"
        driver.save_screenshot(shot2)
        print("Saved screenshot 2 to:", shot2)

    finally:
        driver.quit()

if __name__ == "__main__":
    main()
