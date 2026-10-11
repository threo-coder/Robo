import { chromium } from '@playwright/test';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await page.locator('[data-neck-state="ready"]').waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'artifacts/neck-neutral.png' });
  await page.mouse.move(30, 150);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'artifacts/neck-left.png' });
  await page.mouse.move(1410, 800);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'artifacts/neck-right.png' });
  await page.evaluate(async () => {
    await Promise.all([...document.images].map(image => { image.loading = 'eager'; return image.decode(); }));
  });
  await page.screenshot({ path: 'artifacts/v3-home-full.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'artifacts/neck-mobile.png' });
  await page.goto('http://localhost:4173/lab/', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'artifacts/neck-lab-mobile.png', fullPage: true });
  console.log(JSON.stringify({ errors }));
} finally { await browser.close(); }
