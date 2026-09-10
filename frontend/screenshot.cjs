const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const screenshotsDir = path.join(__dirname, 'docs', 'screenshots');
  if (!fs.existsSync(screenshotsDir)){
      fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: "new",
    defaultViewport: { width: 1440, height: 900 }
  });
  const page = await browser.newPage();
  
  // Go to root, which should redirect to login
  console.log("Navigating to root page...");
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
  
  // Wait a bit for potential redirects
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("Typing credentials...");
  await page.type('input[type="email"]', 'admin@netshield.ai');
  await page.type('input[type="password"]', 'AdminPass123!');
  
  // Click login button
  await page.click('button[type="submit"]');
  console.log("Logging in...");
  
  // Wait for redirect to dashboard
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("Taking Dashboard screenshot...");
  await page.screenshot({ path: path.join(screenshotsDir, '1_dashboard.png'), fullPage: true });

  console.log("Navigating to Anomalies...");
  await page.goto('http://localhost:5173/anomalies', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(screenshotsDir, '2_anomalies.png'), fullPage: true });

  console.log("Navigating to Reports...");
  await page.goto('http://localhost:5173/reports', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(screenshotsDir, '3_reports.png'), fullPage: true });

  console.log("Navigating to Traffic...");
  await page.goto('http://localhost:5173/traffic', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(screenshotsDir, '4_traffic.png'), fullPage: true });

  await browser.close();
  console.log("Screenshots captured successfully!");
})();
