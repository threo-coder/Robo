import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  const positions = [];
  for (const [label, x, y] of [['top-left', 5, 5], ['bottom-left', 5, 995], ['bottom-right', 1435, 995], ['top-right', 1435, 5], ['middle', 720, 500]]) {
    await page.mouse.move(x, y);
    await page.waitForTimeout(500);
    const pupil = await page.locator('.pupil').first().evaluate(el => {
      const matrix = new DOMMatrix(getComputedStyle(el).transform);
      return { x: matrix.m41, y: matrix.m42 };
    });
    positions.push({ label, ...pupil });
    await page.locator('.companion').screenshot({ path: `artifacts/gaze-${label}.png` });
  }
  assert.ok(positions[0].x < -6 && positions[0].y < -4, 'Pupils look top left');
  assert.ok(positions[1].x < -6 && positions[1].y > 4, 'Pupils look bottom left');
  assert.ok(positions[2].x > 6 && positions[2].y > 4, 'Pupils look bottom right');
  assert.ok(positions[3].x > 6 && positions[3].y < -4, 'Pupils look top right');
  assert.ok(positions[4].x > positions[0].x + 2, 'Gaze changes across the whole viewport rather than saturating');
  await page.evaluate(() => document.documentElement.dispatchEvent(new PointerEvent('pointerleave')));
  await page.waitForTimeout(500);
  const centered = await page.locator('.pupil').first().evaluate(el => {
    const matrix = new DOMMatrix(getComputedStyle(el).transform);
    return Math.abs(matrix.m41) + Math.abs(matrix.m42);
  });
  assert.ok(centered < .1, 'Pupils smoothly recenter when cursor leaves');
  console.log('PASS: eyes track all four corners, respond to middle positions, and recenter on pointer exit.');
  console.log(positions);
} finally { await browser.close(); }
