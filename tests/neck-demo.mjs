import { chromium } from '@playwright/test';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 880 },
    recordVideo: { dir: 'artifacts/recordings', size: { width: 1280, height: 880 } },
  });
  const page = await context.newPage();
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await page.locator('[data-neck-state="ready"]').waitFor();
  // A recording-only marker makes the cursor visible in headless browser video.
  await page.evaluate(() => {
    const marker = document.createElement('div');
    marker.style.cssText = 'position:fixed;width:18px;height:18px;border:1px solid #f4d29f;border-radius:50%;box-shadow:0 0 0 4px #e5b36b25;pointer-events:none;z-index:9999;transform:translate(-50%,-50%)';
    document.body.append(marker);
    document.addEventListener('pointermove', event => { marker.style.left = event.clientX + 'px'; marker.style.top = event.clientY + 'px'; });
  });
  for (const [x, y] of [[80, 170], [1190, 180], [1190, 780], [180, 730], [100, 160]]) {
    await page.mouse.move(x, y, { steps: 55 });
    await page.waitForTimeout(1300);
  }
  await page.evaluate(() => document.documentElement.dispatchEvent(new PointerEvent('pointerleave')));
  await page.waitForTimeout(1200);
  const video = page.video();
  await context.close();
  await video.saveAs('artifacts/neck-follow-preview.webm');
  console.log('Saved artifacts/neck-follow-preview.webm');
} finally { await browser.close(); }
