import { chromium, expect } from '@playwright/test';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1536, height: 760 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  const robot = page.locator('[data-hero-robot]');
  await expect(robot).toHaveAttribute('data-robot-state', 'ready', { timeout: 20000 });
  for (const pose of ['seated', 'standing', 'resting']) {
    await page.locator('button[data-robot-pose="' + pose + '"]').click();
    await expect(robot).toHaveAttribute('data-robot-phase', 'hold', { timeout: 15000 });
    await page.screenshot({ path: 'artifacts/articulated-' + pose + '.png' });
    console.log(pose, await robot.evaluate(el => ({ ...el.dataset })));
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'artifacts/articulated-mobile.png', fullPage: true });
  console.log({ errors });
} finally { await browser.close(); }
