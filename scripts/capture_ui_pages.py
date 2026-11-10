import time
import os
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

artifact_dir = r"C:\Users\PRIYE RANJAN\.gemini\antigravity\brain\0e20c874-7353-488a-adc2-7caefedb3d34"
os.makedirs(artifact_dir, exist_ok=True)

opts = Options()
opts.add_argument("--headless=new")
opts.add_argument("--window-size=1440,960")
driver = webdriver.Chrome(options=opts)

pages = [
    ("overview", "http://localhost:3000/"),
    ("scanner", "http://localhost:3000/scanner"),
    ("maintenance", "http://localhost:3000/maintenance"),
    ("benchmarks", "http://localhost:3000/benchmarks")
]

try:
    for name, url in pages:
        driver.get(url)
        time.sleep(2)
        # Dark mode screenshot
        driver.execute_script("document.documentElement.classList.add('dark'); document.documentElement.classList.remove('light'); localStorage.setItem('scamroad_theme', 'dark');")
        time.sleep(0.5)
        dark_path = os.path.join(artifact_dir, f"screen_{name}_dark.png")
        driver.save_screenshot(dark_path)
        print(f"Saved {dark_path}")

        # Light mode screenshot
        driver.execute_script("document.documentElement.classList.remove('dark'); document.documentElement.classList.add('light'); localStorage.setItem('scamroad_theme', 'light');")
        time.sleep(0.5)
        light_path = os.path.join(artifact_dir, f"screen_{name}_light.png")
        driver.save_screenshot(light_path)
        print(f"Saved {light_path}")
finally:
    driver.quit()
    print("Done capturing screenshots.")
