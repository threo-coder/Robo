import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

await mkdir('artifacts', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    await Promise.all([...document.images].map(image => { image.loading = 'eager'; return image.decode(); }));
  });
  await page.screenshot({ path: 'artifacts/desktop-top.png' });
  await page.screenshot({ path: 'artifacts/desktop-full.png', fullPage: true });
  assert.equal(await page.title(), 'Roboking | Intelligence in Motion');
  assert.equal(await page.locator('.result-number').innerText(), '1.6hours');
  await page.locator('#input-capacity').fill('20');
  assert.equal(await page.locator('.result-number').innerText(), '3.2hours');
  await page.locator('#input-load').fill('0');
  assert.equal(await page.locator('#tool-error').isVisible(), true);
  assert.match(await page.locator('#tool-result').innerText(), /ADJUST YOUR INPUTS/);
  await page.locator('#input-load').fill('120');
  for (const [tool, result] of [['drive', '0.71m/s'], ['drone', '1.92: 1'], ['power', '5.56A']]) {
    await page.locator(`[data-tool="${tool}"]`).click();
    assert.equal(await page.locator('.result-number').innerText(), result);
  }
  await page.locator('[data-tool="battery"]').click();
  assert.equal(await page.locator('#input-capacity').inputValue(), '20');
  for (const sector of ['drones', 'healthcare', 'defence', 'industrial', 'custom', 'quadrupeds']) {
    await page.locator(`[data-sector="${sector}"]`).click();
    assert.equal(await page.locator(`[data-sector="${sector}"]`).getAttribute('aria-selected'), 'true');
    await page.locator('#sector-image').evaluate(img => img.decode());
  }
  await page.locator('[data-sector="quadrupeds"]').focus();
  await page.keyboard.press('ArrowDown');
  assert.equal(await page.locator('[data-sector="drones"]').getAttribute('aria-selected'), 'true');
  await page.locator('#sector-enquire').click();
  assert.equal(await page.locator('#contact-sector').inputValue(), 'Drone technology');
  await page.locator('#contact-name').fill('Prototype Team');
  await page.locator('#contact-email').fill('team@example.com');
  await page.locator('#contact-message').fill('We would like to explore a robotics platform for indoor inspection.');
  await page.getByRole('button', { name: 'Prepare my brief' }).click();
  assert.equal(await page.locator('#brief-dialog').isVisible(), true);
  assert.match(await page.locator('#brief-preview').innerText(), /Prototype Team/);
  assert.match(await page.locator('#brief-mailto').getAttribute('href'), /^mailto:sales@roboking.in\?subject=/);
  await page.locator('#brief-copy').click();
  await expect(page.locator('#copy-status')).toHaveText(/Brief copied/);
  const downloadWait = page.waitForEvent('download');
  await page.locator('#brief-download').click();
  const download = await downloadWait;
  assert.equal(download.suggestedFilename(), 'roboking-project-brief.txt');
  await page.screenshot({ path: 'artifacts/project-brief.png' });
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#brief-dialog').isVisible(), false);
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await page.mouse.move(200, 500);
  await page.waitForTimeout(150);
  const eyeLeft = await page.locator('.pupil').first().getAttribute('style');
  await page.mouse.move(1430, 100);
  await page.waitForTimeout(150);
  const eyeRight = await page.locator('.pupil').first().getAttribute('style');
  assert.notEqual(eyeLeft, eyeRight);
  await page.locator('#dog-button').click();
  assert.equal(await page.locator('#dog-status').innerText(), 'HELLO!');
  await page.locator('#motion-toggle').click();
  assert.equal(await page.locator('#motion-toggle').innerText(), 'MOTION: OFF');

  for (const width of [1440, 1024, 768, 600, 390, 360, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    const dims = await page.evaluate(() => ({ width: innerWidth, document: document.documentElement.scrollWidth }));
    assert.ok(dims.document <= dims.width, `Horizontal overflow at ${width}: ${dims.document}`);
    if (width === 390) {
      await page.screenshot({ path: 'artifacts/mobile-top.png' });
      await page.screenshot({ path: 'artifacts/mobile-full.png', fullPage: true });
      await page.locator('.menu-toggle').click();
      assert.equal(await page.locator('.main-nav').isVisible(), true);
      await page.locator('.main-nav a[href="#lab"]').click();
      assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'false');
    }
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await page.locator('#motion-toggle').innerText(), 'MOTION: OFF');
  assert.equal(await page.locator('.dog-body').evaluate(node => getComputedStyle(node).animationName), 'none');
  assert.deepEqual(errors, []);
  console.log('PASS: desktop/mobile rendering, all calculators, invalid inputs, six sectors, keyboard tabs, eye tracking, greeting, motion preference, email draft, clipboard and brief download.');
  console.log('Screenshots: artifacts/desktop-top.png, desktop-full.png, mobile-top.png, mobile-full.png, project-brief.png');
} finally { await browser.close(); }
