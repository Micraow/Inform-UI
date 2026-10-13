import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const baseURL = process.env.GALLERY_URL ?? 'http://127.0.0.1:4175';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
try {
 const page = await browser.newPage({ viewport: { width: 2160, height: 1440 }, deviceScaleFactor: 1, locale: 'en-US', timezoneId: 'UTC' });
 const errors = []; page.on('pageerror', error => errors.push(error.message));
 await mkdir('docs/assets', { recursive: true });
 for (const id of ['create', 'explore', 'compose']) {
  await page.goto(`${baseURL}/gallery.html?capture#${id}`);
  await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
  await page.evaluate(() => document.fonts.ready);
  const panel = page.locator(`#${id}`), bounds = await panel.boundingBox();
  if (bounds.width !== 2160 || bounds.height !== 1440) throw Error(`${id} does not fit the 2160 × 1440 frame: ${JSON.stringify(bounds)}`);
  await panel.screenshot({ path: `docs/assets/gallery-${id}.png` });
  console.log(`Captured ${id}: 2160 × 1440`);
 }
 await page.setViewportSize({ width: 6480, height: 1440 });
 await page.addStyleTag({ content: '.collection{width:6480px;overflow:visible}.page{flex:0 0 2160px!important}' });
 await page.evaluate(() => { document.querySelector('.collection').scrollLeft=0; window.scrollTo(0,0); });
 await page.screenshot({ path: 'docs/assets/gallery-panorama.png', fullPage: true });
 if (errors.length) throw Error(errors.join('\n'));
 console.log('Captured three-page panorama. No runtime errors.');
} finally { await browser.close(); }
