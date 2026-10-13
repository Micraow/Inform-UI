import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const catalog = JSON.parse(await readFile('src/icons/catalog.json', 'utf8'));
const ready = async page => {
  await page.goto('/icons.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
};
const card = (page, name) => page.locator(`.icon-card[data-icon="${name}"]`);
const select = async (page, name) => { await card(page, name).click(); await expect(page.getByRole('dialog')).toBeVisible(); await expect(page.locator('#icon-title')).toHaveText(name); };
const close = async page => { await page.locator('#close-icon').click(); await expect(page.getByRole('dialog')).not.toBeVisible(); };
const noOverflow = async page => {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  expect(await page.locator('#icon-dialog').evaluate(element => !element.open || element.scrollWidth <= element.clientWidth + 1)).toBe(true);
};

for (const width of [390, 1440]) test(`icon catalog renders 755 original SVGs offline without requests or overflow at ${width}px`, async ({ page, context }, testInfo) => {
  const requests = [], errors = [];
  page.on('request', request => { if (!/\/icons\.html(?:$|[?#])/.test(request.url()) && !/^(data|blob):/.test(request.url())) requests.push(request.url()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width, height: 1000 }); await ready(page); await context.setOffline(true);
  await expect(page.locator('#icon-grid .icon-card')).toHaveCount(755);
  await expect(page.locator('#icon-grid svg')).toHaveCount(755);
  const rendered = await page.locator('#icon-grid svg').evaluateAll(nodes => nodes.map(node => ({ name: node.dataset.iuiIcon, viewBox: node.getAttribute('viewBox'), hidden: node.getAttribute('aria-hidden'), childCount: node.childElementCount })));
  expect(rendered.map(({ name, viewBox }) => ({ name, viewBox }))).toEqual(catalog.icons.map(({ name, viewBox }) => ({ name, viewBox })));
  expect(rendered.every(icon => icon.hidden === 'true' && icon.childCount > 0)).toBe(true);
  await noOverflow(page);
  await page.screenshot({ path: testInfo.outputPath(`icons-${width}-light.png`) });
  for (const name of ['Jira', 'AtSign', 'ChevronDownVector', 'Linear', 'Zendesk', 'DownloadGifWatermark', 'OpenaiLogoBold', 'OpenaiLogoRegular']) {
    await page.locator('#icon-search').fill(name); await select(page, name);
    const icon = catalog.icons.find(icon => icon.name === name);
    await expect(page.locator('#icon-preview svg')).toHaveAttribute('viewBox', icon.viewBox);
    await expect(page.locator('#icon-preview svg')).toHaveAttribute('role', 'img');
    await expect(page.locator('#icon-preview svg')).toHaveAttribute('aria-label', name);
    await expect(page.locator('#icon-source')).toHaveAttribute('href', icon.source.url);
    expect(await page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map(node => node.id);
      return new Set(ids).size === ids.length && [...document.querySelectorAll('[clip-path]')].every(node => {
        const id = node.getAttribute('clip-path').slice(5, -1), target = document.getElementById(id);
        return target?.tagName === 'clipPath' && target.closest('svg') === node.closest('svg');
      });
    })).toBe(true);
    if (name === 'Jira') expect(await page.locator('#icon-preview [fill^="#"]').count()).toBeGreaterThan(0);
    await page.locator('#preview-size').selectOption('96'); await expect(page.locator('#icon-preview svg')).toHaveAttribute('width', '96');
    await noOverflow(page); await close(page); await expect(card(page, name)).toBeFocused();
  }
  await page.locator('#clear-filters').click();
  await page.locator('#theme-toggle').click(); await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await noOverflow(page); await page.screenshot({ path: testInfo.outputPath(`icons-${width}-dark.png`) });
  await page.locator('#icon-search').fill('Jira'); await select(page, 'Jira');
  const colors = await page.locator('#icon-preview [fill^="#"]').evaluateAll(nodes => nodes.map(node => ({ attr: node.getAttribute('fill'), rendered: getComputedStyle(node).fill })));
  expect(colors.length).toBeGreaterThan(0);
  expect(colors.every(color => color.rendered !== 'none')).toBe(true);
  await noOverflow(page); await page.screenshot({ path: testInfo.outputPath(`icons-${width}-detail.png`) });
  expect(requests).toEqual([]); expect(errors).toEqual([]);
});

test('every canonical name and alias remains searchable, with category intersections and explicit empty results', async ({ page }) => {
  await ready(page);
  const missing = await page.evaluate(catalog => {
    const input = document.getElementById('icon-search'), missing = [];
    for (const entry of [...catalog.icons.map(icon => ({ query: icon.name, name: icon.name })), ...catalog.aliases.map(alias => ({ query: alias.alias.toUpperCase(), name: alias.name }))]) {
      input.value = entry.query; input.dispatchEvent(new Event('input', { bubbles: true }));
      if (document.querySelector(`.icon-card[data-icon="${entry.name}"]`).parentElement.hidden) missing.push(entry);
    }
    return missing;
  }, catalog);
  expect(missing).toEqual([]);
  await page.locator('#icon-search').fill('curved right'); await expect(card(page, 'ArrowCurvedRight')).toBeVisible();
  await page.locator('#icon-search').fill('');
  for (const category of catalog.categories) {
    await page.locator('#icon-category').selectOption(category.id);
    await expect(page.locator('#icon-grid > li:not([hidden])')).toHaveCount(category.count);
  }
  await page.locator('#icon-category').selectOption('actions-editing');
  await page.locator('#icon-search').fill('arrows and navigation'); await expect(page.locator('#empty-state')).toBeVisible();
  await page.locator('#clear-filters').click(); await page.locator('#icon-search').fill('unknown-no-such-icon-123456');
  await expect(page.locator('#empty-state')).toBeVisible(); await expect(page.locator('#result-count')).toHaveText('0 of 755 icons');
  await page.keyboard.press('Escape'); await expect(page.locator('#icon-grid > li:not([hidden])')).toHaveCount(755);
});

test('keyboard dialog lifecycle, copy and exact catalog/icon downloads work', async ({ page, context }) => {
  await ready(page);
  await page.keyboard.press('/'); await expect(page.locator('#icon-search')).toBeFocused();
  await page.locator('#icon-search').fill('Check');
  await card(page, 'Check').focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#close-icon')).toBeFocused();
  await page.locator('#copy-import').click();
  await expect(page.locator('#dialog-status')).toHaveText('Import example copied.');
  const iconDownload = page.waitForEvent('download'); await page.locator('#download-icon').click();
  const downloadedIcon = await iconDownload;
  expect(downloadedIcon.suggestedFilename()).toBe('Check.icon.json');
  const record = JSON.parse(await readFile(await downloadedIcon.path(), 'utf8'));
  expect(record.icon).toEqual(catalog.icons.find(icon => icon.name === 'Check')); expect(record.definition.name).toBe('Check');
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).not.toBeVisible(); await expect(card(page, 'Check')).toBeFocused();
  await page.keyboard.press('Space'); await expect(page.getByRole('dialog')).toBeVisible(); await close(page);
  const downloadPromise = page.waitForEvent('download'); await page.locator('#download-catalog').click();
  const downloaded = await downloadPromise; expect(downloaded.suggestedFilename()).toBe('inform-ui-icons.catalog.json');
  expect(JSON.parse(await readFile(await downloaded.path(), 'utf8'))).toEqual(catalog);
});

test('single file opens directly with networking disabled and has a clipboard fallback', async ({ page, context }) => {
  await context.setOffline(true);
  await page.goto(pathToFileURL(resolve('output/showcase/icons.html')).href);
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('#icon-grid svg')).toHaveCount(755);
  await page.locator('#icon-search').fill('warning'); await select(page, 'TriangleExclamationErrorWarning');
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw Error('Clipboard disabled for test'); } } });
    document.execCommand = () => false;
  });
  await page.locator('#copy-import').click();
  await expect(page.locator('#dialog-status')).toContainText('Automatic copy is unavailable');
  expect(await page.evaluate(() => getSelection().toString())).toBe(await page.locator('#import-example').textContent());
  await close(page); await page.locator('#clear-filters').click(); await expect(page.locator('#icon-grid > li:not([hidden])')).toHaveCount(755);
});

test('single file served over HTTP stays offline and has a clipboard fallback', async ({ page, context }) => {
  await page.goto('/icons.html');
  await context.setOffline(true);
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('#icon-grid svg')).toHaveCount(755);
  await page.locator('#icon-search').fill('warning'); await select(page, 'TriangleExclamationErrorWarning');
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw Error('Clipboard disabled for test'); } } });
    document.execCommand = () => false;
  });
  await page.locator('#copy-import').click();
  await expect(page.locator('#dialog-status')).toContainText('Automatic copy is unavailable');
  expect(await page.evaluate(() => getSelection().toString())).toBe(await page.locator('#import-example').textContent());
  await close(page); await page.locator('#clear-filters').click(); await expect(page.locator('#icon-grid > li:not([hidden])')).toHaveCount(755);
});
