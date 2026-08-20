import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

def main():
    options = Options()
    options.add_argument('--headless')
    options.add_argument('--window-size=1920,1080')
    driver = webdriver.Chrome(options=options)
    
    # Go to the root to initialize localStorage
    driver.get("http://localhost:3001/")
    time.sleep(1)
    
    # Set local storage
    driver.execute_script("localStorage.setItem('netshield_role', 'admin');")
    driver.execute_script("localStorage.setItem('netshield_auth', 'true');")
    
    # Go to dashboard
    driver.get("http://localhost:3001/dashboard-cinematic")
    time.sleep(3)  # Wait for initial load
    
    print("Taking ML Models screenshot...")
    # Click Machine Learning Models tab
    # Find button with text or icon
    try:
        # Based on SidebarTab, the ID or text could be used. Let's find element by text
        elements = driver.find_elements(By.TAG_NAME, "button")
        for el in elements:
            if "Machine Learning" in el.text or "Machine" in el.text:
                el.click()
                time.sleep(2)
                break
        driver.save_screenshot("e:\\NetShield\\screenshots\\ml_models.png")
    except Exception as e:
        print(f"Error on ML models: {e}")
        
    print("Taking Anomaly Detection screenshot...")
    try:
        elements = driver.find_elements(By.TAG_NAME, "button")
        for el in elements:
            if "Anomaly Detection" in el.text:
                el.click()
                time.sleep(2)
                break
        driver.save_screenshot("e:\\NetShield\\screenshots\\anomaly_detection.png")
    except Exception as e:
        print(f"Error on Anomaly Detection: {e}")
        
    print("Taking Security Reports screenshot...")
    try:
        elements = driver.find_elements(By.TAG_NAME, "button")
        for el in elements:
            if "Security Reports" in el.text or "Reports" in el.text:
                el.click()
                time.sleep(2)
                break
        driver.save_screenshot("e:\\NetShield\\screenshots\\security_reports.png")
    except Exception as e:
        print(f"Error on Security Reports: {e}")

    driver.quit()
    print("Done")

if __name__ == "__main__":
    main()
