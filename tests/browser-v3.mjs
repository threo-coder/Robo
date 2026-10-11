import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({channel:'chrome',headless:true});
const errors = [], results = [];
try {
  const context = await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write']});
  const page = await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
  await page.goto('http://localhost:4173/',{waitUntil:'networkidle'});
  assert.equal(await page.title(), 'RoboKing | Intelligence in Motion');
  await expect(page.locator('[data-hero-robot]')).toHaveAttribute('data-robot-state', 'ready', { timeout: 20000 });
  await expect(page.locator('#robot-viewer, [data-open-viewer], .neck-canvas')).toHaveCount(0);
  await page.locator('.brand').first().focus();await page.mouse.move(2,2);
  const initialSector=await page.locator('#sector-count').textContent();
  await expect(page.locator('#sector-count')).not.toHaveText(initialSector,{timeout:7500});
  await page.locator('[data-sector="4"]').click();await expect(page.locator('#sector-title')).toHaveText('Precision, put to work.');
  await page.locator('[data-sector="4"]').focus();await page.keyboard.press('ArrowRight');await expect(page.locator('[data-sector="5"]')).toHaveAttribute('aria-selected','true');
  await page.locator('#carousel-pause').click();await page.locator('.brand').first().focus();await page.mouse.move(2,2);
  const pausedSector=await page.locator('#sector-count').textContent();await page.waitForTimeout(6500);await expect(page.locator('#sector-count')).toHaveText(pausedSector);
  await page.emulateMedia({reducedMotion:'reduce'});await expect(page.locator('#motion-toggle')).toHaveText('Motion: off');
  results.push('Automatic sector switching, manual tabs, keyboard navigation, pause and reduced motion');
  const imageSet=new Set();
  for (const route of ['/','/solutions/','/lab/','/contact/']) {
    await page.goto(`http://localhost:4173${route}`,{waitUntil:'networkidle'});
    await expect(page.locator('.utility-bar a[href^="tel:"]')).toHaveText('+91 96505 26625');
    await expect(page.locator('.utility-bar a[href^="mailto:"]')).toHaveText('sales@roboking.in');
    await expect(page.locator('.footer-address address')).toContainText('Malerkotla');
    await page.evaluate(async()=>{await Promise.all([...document.images].map(i=>{i.loading='eager';return i.decode();}));});
    for(const src of await page.locator('main img').evaluateAll(images=>images.map(i=>i.src)))imageSet.add(src);
    const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    assert.deepEqual(axe.violations.map(v=>({id:v.id,description:v.description,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),[],`Accessibility ${route}`);
    for(const width of [320,390,768,1024,1440]) {
      await page.setViewportSize({width,height:1000});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`Overflow ${route} at ${width}`);
    }
    await page.screenshot({path:`artifacts/v3-${route==='/'?'home':route.replaceAll('/','')}-full.png`,fullPage:true});
  }
  assert.ok(imageSet.size>=10,`Expected ten unique images, got ${imageSet.size}`);
  results.push('Four pages, ten distinct images, header/footer contacts, accessibility and five viewport sizes');
  await page.goto('http://localhost:4173/lab/',{waitUntil:'networkidle'});
  await expect(page.locator('.result-number')).toHaveText('1.6hours');
  await page.locator('#input-capacity').fill('20');await expect(page.locator('.result-number')).toHaveText('3.2hours');
  await page.locator('#input-load').fill('0');await expect(page.locator('#tool-error')).toBeVisible();
  await page.locator('#input-load').fill('120');
  for(const [tool,result] of [['drive','0.71m/s'],['drone','1.92: 1'],['power','5.56A']]){await page.locator(`[data-tool="${tool}"]`).click();await expect(page.locator('.result-number')).toHaveText(result);}
  await page.locator('[data-tool="battery"]').click();await expect(page.locator('#input-capacity')).toHaveValue('20');
  results.push('Four calculators, invalid values and preserved inputs');
  await page.goto('http://localhost:4173/contact/?field=drones',{waitUntil:'networkidle'});
  await expect(page.locator('#contact-sector')).toHaveValue('Drone technology');
  await page.locator('#contact-name').fill('Test User');await page.locator('#contact-email').fill('test@example.com');await page.locator('#contact-message').fill('A prototype inspection platform for a university research project.');
  await page.locator('#brief-form button[type="submit"]').click();await expect(page.locator('#brief-dialog')).toBeVisible();
  await expect(page.locator('#brief-preview')).toContainText('Test User');
  await expect(page.locator('#brief-mailto')).toHaveAttribute('href',/^mailto:sales@roboking.in\?subject=/);
  await page.locator('#brief-copy').click();await expect(page.locator('#copy-status')).toContainText('copied');
  const downloadPromise=page.waitForEvent('download');await page.locator('#brief-download').click();assert.equal((await downloadPromise).suggestedFilename(),'roboking-project-brief.txt');
  await page.keyboard.press('Escape');await expect(page.locator('#brief-dialog')).toBeHidden();
  await page.setViewportSize({width:390,height:844});await page.locator('.menu-toggle').click();await expect(page.locator('.main-nav')).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('.main-nav')).toBeHidden();
  results.push('Contact preselection, draft preview, copy/download and mobile menu');
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({passed:results,uniqueImages:imageSet.size,errors},null,2));
} finally {await browser.close();}
