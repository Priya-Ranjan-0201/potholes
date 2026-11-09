from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
import time

options = Options()
options.add_argument('--headless=new')
service = Service(r"C:\Users\PRIYE RANJAN\.cache\selenium\chromedriver\win64\156.0.8078.80\chromedriver.exe")
driver = webdriver.Chrome(service=service, options=options)

try:
    driver.get("http://localhost:3000/")
    driver.execute_script("localStorage.setItem('scamroad_theme', 'light'); window.location.reload();")
    time.sleep(2)

    var_bg = driver.execute_script("return window.getComputedStyle(document.documentElement).getPropertyValue('--bg');")
    print("Computed --bg on :root:", repr(var_bg))

    div_style = driver.execute_script("return window.getComputedStyle(document.querySelector('#root > div')).backgroundColor;")
    print("Computed bg on root div:", div_style)

finally:
    driver.quit()
