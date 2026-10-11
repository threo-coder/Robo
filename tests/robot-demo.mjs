import { chromium, expect } from '@playwright/test';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1536, height: 760 }, recordVideo: { dir: 'artifacts/recordings', size: { width: 1536, height: 760 } } });
  const page = await context.newPage();
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  const robot = page.locator('[data-hero-robot]');
  await expect(robot).toHaveAttribute('data-robot-state', 'ready', { timeout: 20000 });
  await page.locator('[data-robot-auto]').click();
  for (const [x, y] of [[80, 190], [1450, 200], [100, 530], [1380, 470]]) {
    await page.mouse.move(x, y, { steps: 45 }); await page.waitForTimeout(650);
  }
  for (const pose of ['standing', 'resting', 'seated']) {
    await page.locator('button[data-robot-pose="' + pose + '"]').click();
    await page.mouse.move(100, 280, { steps: 25 });
    await expect(robot).toHaveAttribute('data-robot-phase', 'hold', { timeout: 15000 });
    await page.waitForTimeout(1100);
  }
  await page.screenshot({ path: 'artifacts/robot-final-desktop.png' });
  const video = page.video(); await context.close();
  await video.saveAs('artifacts/robot-natural-motion.webm');
  console.log('Saved robot-natural-motion.webm');
} finally { await browser.close(); }
