// Portable acceptance specification. Copy into repository tests/browser after
// integration. No browser execution has occurred in the isolated candidate.
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { compileHtml } from '../../dist/index.js';
const fixture = JSON.parse(await readFile(new URL('../../examples/loading-states.json', import.meta.url), 'utf8'));
const byId = (page, id) => page.locator(`[data-iui][id$="-${id}"]`);
async function mount(page, spec = fixture, lang = 'en') {
  await page.goto('/mount.html'); await page.waitForFunction(() => Boolean(window.iui));
  const requests = []; page.on('request', request => requests.push(request.url()));
  await page.evaluate(({spec, lang}) => { const host = document.getElementById('host'); host.lang = lang; window.loadingSpec = spec; window.loadingController = window.iui.mount(host, spec); }, {spec, lang});
  return requests;
}
test.beforeEach(async ({page}) => { page.__loadingErrors = []; page.on('pageerror', error => page.__loadingErrors.push(error.message)); });
test.afterEach(async ({page}) => expect(page.__loadingErrors).toEqual([]));

for (const theme of ['light', 'dark']) for (const width of [390, 768, 1100]) {
  test(`loading ${theme} ${width}px: exact ratio, all bounded shapes, labels, focus and no overflow`, async ({page}, testInfo) => {
    await page.setViewportSize({width, height: 1050}); await page.emulateMedia({colorScheme: theme, reducedMotion: 'reduce'});
    const requests = await mount(page, {...fixture, theme});
    const reactive = byId(page, 'reactive-progress'); await expect(reactive).toHaveAttribute('role', 'progressbar'); await expect(reactive).toHaveAccessibleName('Explicit sample progress');
    await expect(reactive).toHaveAttribute('aria-valuenow', '25');
    for (const [id, value, height] of [['zero-progress', 0, 4], ['full-progress', 100, 12], ['fraction-progress', 100 / 3, 8]]) {
      const node = byId(page, id); await expect(node).toHaveAttribute('aria-valuenow', String(value));
      const geometry = await node.evaluate(el => ({track: el.querySelector('.iui-loading-track').getBoundingClientRect().width, fill: el.querySelector('.iui-loading-fill').getBoundingClientRect().width, height: el.querySelector('.iui-loading-track').getBoundingClientRect().height, raw: el.dataset.value}));
      expect(geometry.height).toBe(height); expect(geometry.raw).toBe(String(value)); expect(Math.abs(geometry.fill - geometry.track * value / 100)).toBeLessThan(.1);
    }
    const indeterminate = byId(page, 'indeterminate'); await expect(indeterminate).not.toHaveAttribute('aria-valuenow'); await expect(indeterminate.locator('.iui-loading-hint')).toHaveText('Progress not supplied');
    expect(await indeterminate.locator('svg').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
    await expect(byId(page, 'hidden-value').locator('.iui-loading-value')).toHaveCount(0); await expect(byId(page, 'hidden-value')).toHaveAttribute('aria-valuenow', '12.5');
    await expect(byId(page, 'text-placeholder').locator('.iui-loading-block-line')).toHaveCount(3);
    await expect(byId(page, 'card-placeholder').locator('.iui-loading-block-piece')).toHaveCount(3);
    await expect(byId(page, 'circle-placeholder').locator('.iui-loading-block-circle')).toHaveCount(1);
    await expect(byId(page, 'long-placeholder').locator('.iui-loading-block-line')).toHaveCount(10);
    const measurements = await page.locator('.iui-loading,.iui-loading-block').evaluateAll(nodes => nodes.map(el => {
      const rect = el.getBoundingClientRect(), label = el.querySelector('.iui-loading-label,.iui-loading-block-label');
      const range = el.ownerDocument.createRange(); range.selectNodeContents(label);
      return {width: rect.width, overflow: el.scrollWidth > el.clientWidth + 1, labelHidden: Boolean(label.closest('[aria-hidden=true]')), text: [...range.getClientRects()].filter(r => r.width && r.height).map(r => ({left: r.left, right: r.right})), bounds: {left: rect.left, right: rect.right}};
    }));
    for (const item of measurements) { expect(item.width).toBeGreaterThan(0); expect(item.overflow).toBe(false); expect(item.labelHidden).toBe(false); expect(item.text.length).toBeGreaterThan(0); for (const fragment of item.text) { expect(fragment.left).toBeGreaterThanOrEqual(item.bounds.left - 1); expect(fragment.right).toBeLessThanOrEqual(item.bounds.right + 1); } }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const slider = page.getByRole('slider', {name: 'Supplied completion'}); await slider.focus();
    await page.evaluate(() => { window.loadingElement = document.querySelector('[id$="-reactive-progress"]'); window.loadingFill = window.loadingElement.querySelector('.iui-loading-fill'); window.loadingController.setState({done: 50, other: 2}); });
    await expect(slider).toBeFocused(); await expect(reactive).toHaveAttribute('aria-valuenow', '50');
    expect(await reactive.evaluate(el => el === window.loadingElement && el.querySelector('.iui-loading-fill') === window.loadingFill)).toBe(true);
    await page.evaluate(() => window.loadingController.setState({done: 50})); await expect(slider).toBeFocused();
    expect(await reactive.evaluate(el => el === window.loadingElement && el.querySelector('.iui-loading-fill') === window.loadingFill)).toBe(true);
    await page.keyboard.press('ArrowRight'); await expect(slider).toBeFocused(); await expect(reactive).toHaveAttribute('aria-valuenow', String(50.125 / 100 * 100));
    const palette = await reactive.evaluate(el => ({ink: getComputedStyle(el).color, fill: getComputedStyle(el.querySelector('.iui-loading-fill')).backgroundColor})); expect(palette.fill).toBe(palette.ink); expect(palette.ink).toBe(theme === 'dark' ? 'rgb(255, 255, 255)' : 'rgb(13, 13, 13)');
    expect(requests).toEqual([]); await page.screenshot({path: testInfo.outputPath(`loading-${theme}-${width}.png`), fullPage: true});
  });
}

test('loading CSS motion respects reduced motion and animate:false without changing numeric or authored meaning', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'no-preference'}); await mount(page);
  const spinner = byId(page, 'indeterminate').locator('svg'), pulse = byId(page, 'text-placeholder').locator('.iui-loading-block-piece').first(), staticPiece = byId(page, 'circle-placeholder').locator('.iui-loading-block-piece');
  expect(await spinner.evaluate(el => getComputedStyle(el).animationName)).toBe('iui-loading-spin'); expect(await pulse.evaluate(el => getComputedStyle(el).animationName)).toBe('iui-loading-soft-pulse'); expect(await staticPiece.evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  await page.emulateMedia({reducedMotion: 'reduce'}); expect(await spinner.evaluate(el => getComputedStyle(el).animationName)).toBe('none'); expect(await pulse.evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  await expect(byId(page, 'indeterminate').locator('.iui-loading-label')).toHaveText('No progress was supplied'); await expect(byId(page, 'text-placeholder').locator('.iui-loading-block-label')).toHaveText('Text placeholder');
  await expect(byId(page, 'reactive-progress')).toHaveAttribute('aria-valuenow', '25');
  expect(await page.locator('.iui-loading[aria-live],.iui-loading-block[aria-live],.iui-loading-block[role],[aria-busy]').count()).toBe(0);
});

test('forced colors preserves readable labels, bounded visible marks and static skeletons', async ({page}) => {
  await page.emulateMedia({forcedColors: 'active', reducedMotion: 'reduce'}); await mount(page);
  for (const label of await page.locator('.iui-loading-label,.iui-loading-block-label').all()) await expect(label).toBeVisible();
  const fill = byId(page, 'reactive-progress').locator('.iui-loading-fill'); expect(await fill.evaluate(el => getComputedStyle(el).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)');
  const pieces = await page.locator('.iui-loading-block-piece').evaluateAll(nodes => nodes.map(el => ({animation: getComputedStyle(el).animationName, border: getComputedStyle(el).borderTopStyle, opacity: getComputedStyle(el).opacity})));
  for (const piece of pieces) expect(piece).toEqual({animation: 'none', border: 'solid', opacity: '1'});
  await expect(byId(page, 'reactive-progress')).toHaveAttribute('aria-valuenow', '25'); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('rejected derived-progress state and invalid updates are atomic, while explicit replacement cleans old bindings', async ({page}) => {
  await mount(page); await page.getByRole('slider', {name: 'Supplied completion'}).focus();
  const result = await page.evaluate(() => {
    const controller = window.loadingController, root = document.querySelector('.iui-root'), focus = document.activeElement, progress = document.querySelector('[id$="-reactive-progress"]');
    const state = JSON.stringify(controller.getState()), html = root.outerHTML;
    const patches = [{total: 20}, {total: 0}, {total: -100}, {done: 75, total: 50}];
    const rejected = patches.map(patch => { try { controller.setState(patch); return false; } catch { return JSON.stringify(controller.getState()) === state && root.outerHTML === html && document.activeElement === focus; } });
    const nodes = [{type: 'loading', label: 'Invalid', progress: null}, {type: 'loading-block', label: 'Invalid', shape: 'card', lines: 3}, {type: 'loading', label: 'Invalid', progress: '25'}, {type: 'loading-block', label: 'Invalid', lines: 11}];
    const updates = nodes.map(node => { try { controller.update({version: 'iui/1', body: [node]}); return false; } catch { return document.querySelector('.iui-root') === root && document.activeElement === focus; } });
    controller.update(window.loadingSpec); const oldMarkup = progress.outerHTML; controller.setState({done: 100}); const clean = progress.outerHTML === oldMarkup && !progress.isConnected;
    controller.dispose(); controller.dispose(); return {rejected, updates, clean, empty: document.getElementById('host').childElementCount === 0};
  });
  expect(result).toEqual({rejected: [true, true, true, true], updates: [true, true, true, true], clean: true, empty: true});
});

test('multiple hosts, foreign ownerDocument, Chinese labels and RTL preserve independent state and IDs', async ({page}) => {
  await mount(page);
  const result = await page.evaluate(() => {
    const chinese = document.createElement('div'); chinese.lang = 'zh-Hant'; document.body.append(chinese);
    const frame = document.createElement('iframe'); frame.title = 'Independent owner document'; document.body.append(frame); const foreign = frame.contentDocument.createElement('div'); foreign.lang = 'ar'; foreign.dir = 'rtl'; frame.contentDocument.body.append(foreign);
    const other = window.iui.mount(chinese, {...window.loadingSpec, theme: 'dark'});
    const foreignController = window.iui.mount(foreign, {version: 'iui/1', body: [{type: 'loading', id: 'indeterminate', label: 'جارٍ تجهيز العرض'}, {type: 'loading-block', label: 'نموذج', shape: 'circle'}, {type: 'loading', label: 'تقدم', progress: 25}]});
    window.loadingController.setState({done: 100}); const siblingValue = chinese.querySelector('[id$="-reactive-progress"]').getAttribute('aria-valuenow');
    const hints = chinese.querySelector('.iui-loading-hint').textContent, own = foreign.querySelector('svg').ownerDocument === frame.contentDocument;
    const ids = [...document.querySelectorAll('[data-iui][id]')].map(el => el.id), unique = new Set(ids).size === ids.length;
    const rtl = frame.contentWindow.getComputedStyle(foreign.querySelector('.iui-loading')).direction;
    const track = foreign.querySelector('.iui-loading-track').getBoundingClientRect(), fill = foreign.querySelector('.iui-loading-fill').getBoundingClientRect();
    const rightAligned = Math.abs(fill.right - track.right) < .1 && Math.abs(fill.width - track.width / 4) < .1;
    window.loadingController.dispose(); other.setState({done: 50}); const unaffected = chinese.querySelector('[id$="-reactive-progress"]').getAttribute('aria-valuenow');
    other.dispose(); foreignController.dispose(); return {siblingValue, hints, own, unique, rtl, rightAligned, unaffected};
  });
  expect(result).toEqual({siblingValue: '25', hints: '未提供进度', own: true, unique: true, rtl: 'rtl', rightAligned: true, unaffected: '50'});
});

test('compiled loading document is portable and offline, with unsafe-looking labels remaining literal data', async ({page}) => {
  const label = '</script><img src="https://evil.invalid/pixel" onerror="bad()">';
  const html = await compileHtml({version: 'iui/1', body: [{type: 'loading', label, progress: 0}, {type: 'loading', label}, {type: 'loading-block', label, shape: 'card'}]}, {lang: 'zh-CN'});
  const requests = []; page.on('request', request => requests.push(request.url()));
  await page.route('**/loading-portable.html', route => route.fulfill({contentType: 'text/html', body: html})); await page.goto('/loading-portable.html');
  await expect(page.locator('.iui-loading-label')).toHaveText([label, label]); await expect(page.locator('.iui-loading-block-label')).toHaveText(label); await expect(page.locator('.iui-loading-hint')).toHaveText('未提供进度');
  await expect(page.locator('img,svg use,svg image,foreignObject')).toHaveCount(0); await expect(page.locator('.iui-loading[data-kind=determinate]')).toHaveAttribute('aria-valuenow', '0');
  expect(requests.filter(url => !url.endsWith('/loading-portable.html') && !url.endsWith('/favicon.ico'))).toEqual([]);
});
