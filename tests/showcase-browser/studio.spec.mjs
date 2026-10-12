import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const catalog = JSON.parse(await readFile('output/showcase/catalog.json', 'utf8'));
const select = async (page, type) => {
  await page.evaluate(value => { location.hash = value; }, type);
  await expect(page.locator('#preview')).toHaveAttribute('data-component', type);
  await expect(page.locator('#preview')).toHaveAttribute('data-status', type === 'native' ? 'rejected' : 'mounted');
};
const ready = async page => { await page.goto('/'); await expect(page.locator('html')).toHaveAttribute('data-ready', 'true'); };
for (const width of [390, 1440]) test(`all 218 entries mount or deliberately reject at ${width}px, without overflow or third-party requests`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 });
  const errors = [], remote = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:4176') && !request.url().startsWith('data:') && !request.url().startsWith('blob:')) remote.push(request.url()); });
  await ready(page);
  for (const entry of catalog.entries) {
    await select(page, entry.type);
    const json = JSON.parse(await page.locator('#json-code').textContent());
    expect(json, entry.type).toEqual({ ...entry.document, theme: 'light' });
    if (entry.status === 'renderable') expect(await page.locator('#preview > .iui-root').count(), entry.type).toBe(1);
    const geometry = await page.evaluate(() => ({ width: innerWidth, document: document.documentElement.scrollWidth }));
    expect(geometry.document, entry.type).toBeLessThanOrEqual(geometry.width + 1);
  }
  expect(errors).toEqual([]); expect(remote).toEqual([]);
});
test('search, categories, empty results and keyboard recovery', async ({ page }) => {
  await ready(page);
  await expect(page.locator('.component-link')).toHaveCount(218);
  await page.keyboard.press('/'); await expect(page.locator('#search')).toBeFocused();
  await page.locator('#search').fill('questionnaire'); await expect(page.locator('.component-link')).toHaveCount(1);
  await page.locator('#search').fill('no-such-component'); await expect(page.locator('.no-results')).toBeVisible();
  await page.keyboard.press('Escape'); await expect(page.locator('.component-link')).toHaveCount(218);
  await page.locator('#category').selectOption('finance');
  await expect(page.locator('.component-link')).toHaveCount(catalog.entries.filter(entry => entry.group === 'finance').length);
  await page.locator('#clear-filters').click(); await expect(page.locator('.component-link')).toHaveCount(218);
});
test('controls update locally, reset, switch safely and preserve back/forward navigation', async ({ page }) => {
  await ready(page); await select(page, 'slider');
  const slider = page.locator('#preview input[type=range]');
  await slider.focus(); await page.keyboard.press('ArrowRight');
  await page.locator('.event-panel summary').click();
  const beforeReset = await page.locator('#state-view').textContent();
  await page.locator('#reset').click(); expect(await page.locator('#state-view').textContent()).not.toBe(beforeReset);
  await select(page, 'label'); const input = page.locator('#preview input');
  await page.locator('#preview label').first().click(); await expect(input).toBeFocused();
  await select(page, 'tab-panel'); await page.locator('#preview [role=tab]').last().click();
  await expect(page.locator('#preview [role=tab]').last()).toHaveAttribute('aria-selected', 'true');
  await select(page, 'popover'); await page.locator('#preview button').first().click();
  await page.keyboard.press('Escape');
  await select(page, 'native'); await expect(page.locator('.boundary-message')).toContainText('rejects');
  await page.goBack(); await expect(page.locator('#component-title')).toHaveText('popover');
  await page.goForward(); await expect(page.locator('#component-title')).toHaveText('native');
});
test('exact JSON copy and download, safe sample links, and blocked demo video', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await ready(page); await select(page, 'chart');
  await page.locator('#copy-json').click();
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(JSON.parse(clipboard)).toEqual({ ...catalog.entries.find(entry => entry.type === 'chart').document, theme: 'light' });
  const download = page.waitForEvent('download'); await page.locator('#download-json').click(); expect((await download).suggestedFilename()).toBe('chart.json');
  await select(page, 'link'); await page.locator('#preview a').first().click();
  expect(page.url()).toContain('#link'); await expect(page.locator('#event-count')).toHaveText('1 events');
  await select(page, 'youtube'); await page.locator('.iui-youtube-load').click(); await expect(page.locator('#preview iframe')).toHaveCount(0);
});
test('light/dark desktop, tablet and mobile visual cases', async ({ page }, testInfo) => {
  await ready(page);
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1050 });
    for (const mode of ['light', 'dark']) {
      const isDark = await page.locator('html').evaluate(element => element.classList.contains('dark'));
      if (isDark !== (mode === 'dark')) await page.locator('#theme-toggle').click();
      for (const type of ['chart', 'questionnaire', 'grid-item', 'tab-panel', 'ledger-net-worth', 'image-grid', 'native']) {
        await select(page, type);
        const json = JSON.parse(await page.locator('#json-code').textContent()); expect(json.theme).toBe(mode);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
      }
      await select(page, 'chart'); await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: testInfo.outputPath(`studio-${width}-${mode}.png`), fullPage: true });
      if (width === 1440 && mode === 'light') await page.locator('.example-grid').screenshot({ path: testInfo.outputPath('studio-detail.png') });
    }
  }
});
test('supplied media loads locally, opens its real viewer and emits a bounded video request', async ({ page }) => {
  const errors = [], remote = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:4176') && !request.url().startsWith('data:') && !request.url().startsWith('blob:')) remote.push(request.url()); });
  await ready(page); await select(page, 'search-image');
  await expect.poll(() => page.locator('#preview img').evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
  await select(page, 'image-grid');
  await page.locator('.iui-image-grid-open').first().click();
  await expect(page.getByRole('dialog', { name: 'Local image viewer' })).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('dialog').locator('output')).toContainText('2 /');
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.iui-image-grid-open').first()).toBeFocused();
  await select(page, 'async-video-carousel'); await page.locator('#preview button').first().click();
  await expect(page.locator('#event-log')).toContainText('iui:video-open');
  expect(page.context().pages()).toHaveLength(1);
  expect(errors).toEqual([]); expect(remote).toEqual([]);
});
