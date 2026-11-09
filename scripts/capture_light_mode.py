from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import time

options = Options()
options.add_argument('--headless=new')
options.add_argument('--window-size=1680,1100')
driver = webdriver.Chrome(options=options)

try:
    driver.get('http://localhost:3000/')
    time.sleep(2)
    # Set light mode in localStorage and reload
    driver.execute_script("localStorage.setItem('scamroad_theme', 'light'); window.location.reload();")
    time.sleep(2)
    driver.save_screenshot(r'C:\Users\PRIYE RANJAN\.gemini\antigravity\brain\0e20c874-7353-488a-adc2-7caefedb3d34\debug_light_mode.png')
    print('Saved debug_light_mode.png')
finally:
    driver.quit()
