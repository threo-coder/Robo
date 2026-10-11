import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  for (const [width, height] of [[1536,696],[1366,640],[1920,800],[2560,900],[1440,1000],[1024,768],[1001,1000],[1000,768],[768,1024],[700,600],[390,844],[320,640]]) {
    await page.setViewportSize({ width, height });
    await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
    const robot = page.locator('[data-hero-robot]');
    await expect(robot).toHaveAttribute('data-robot-state', 'ready', { timeout: 20000 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, 'No overflow at ' + width);
    await expect(page.locator('.site-header')).not.toContainText('Malerkotla');
    const header = await page.evaluate(() => ({ nav: document.querySelector('.nav-bar').getBoundingClientRect().bottom, contact: document.querySelector('.utility-bar').getBoundingClientRect().top }));
    assert.ok(header.contact >= header.nav - 1);
    for (const pose of ['seated', 'standing', 'resting']) {
      await page.locator('button[data-robot-pose="' + pose + '"]').click();
      const bounds = (await robot.getAttribute('data-robot-bounds')).split(',').map(Number);
      assert.ok(bounds.every(value => Math.abs(value) < .97), width + ' ' + pose + ': full robot within canvas: ' + bounds);
      assert.ok(Number(await robot.getAttribute('data-robot-facing')) > .92, 'Optics always face viewer');
    }
    await page.locator('button[data-robot-pose="seated"]').click();
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.screenshot({ path: 'artifacts/robot-framing-' + width + 'x' + height + '.png' });
  }
  console.log('Full model fits all three poses at 12 viewport sizes; contact row below navigation; no header address.');
} finally { await browser.close(); }
