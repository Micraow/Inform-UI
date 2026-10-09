import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const fixture = JSON.parse(await readFile(new URL('../../examples/finance.json', import.meta.url)));
const kind = (page, value) => page.locator(`[data-kind="finance-${value}"]`);
const range = (root, value) => root.locator(`[data-finance-action="range"][data-value="${value}"]`);
const series = (root, value) => root.locator(`[data-finance-action="series"][data-value="${value}"]`);
const noOverflow = page => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

test.beforeEach(async ({ page }) => { page.on('pageerror', error => { throw error; }); });

for (const theme of ['light', 'dark']) for (const width of [390, 768, 1100]) {
  test(`finance ${theme} ${width}px: exact timestamps, focus, local ranges, legend and readable full tables`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 }); await page.emulateMedia({ colorScheme: theme });
    const requests = []; page.on('request', request => requests.push(request.url()));
    await page.goto('/finance.html'); await expect(page.locator('.iui-finance')).toHaveCount(3);
    await page.locator('.iui-root').evaluate((root, value) => { root.dataset.theme = value; }, theme);
    const quote = kind(page, 'quote'), history = kind(page, 'chart'), comparison = kind(page, 'comparison');
    await expect(quote.locator('.iui-finance-price')).toHaveText('112 USD');
    await expect(quote.locator('.iui-finance-meta')).toContainText('休市'); await expect(quote.locator('.iui-finance-meta')).toContainText('延迟 15 分钟');
    await expect(quote.locator('.iui-finance-updated')).toHaveAttribute('datetime', '2026-11-01T06:15:00-08:00');
    for (const root of [quote, history, comparison]) await expect(root.locator('.iui-finance-source')).toContainText('合成演示');
    expect(await noOverflow(page)).toBe(true);
    await expect(history.locator('[data-finance-series="orbit"] path')).toHaveCount(2);
    const xs = await history.locator('circle').evaluateAll(nodes => nodes.map(node => Number(node.getAttribute('cx'))));
    expect((xs[2] - xs[1]) / (xs[1] - xs[0])).toBeCloseTo(2, 9);
    await expect(history.locator('[data-time="2026-11-01T02:00:00-08:00"]')).toHaveCount(0);
    const dst = range(history, 'dst'); await dst.focus(); await page.keyboard.press('Enter');
    await expect(dst).toBeFocused(); await expect(dst).toHaveAttribute('aria-pressed', 'true'); await expect(history.locator('circle')).toHaveCount(2);
    const chart = history.locator('svg'); await chart.focus(); await page.keyboard.press('Home');
    await expect(history.locator('output')).toContainText('GMT-7'); await page.keyboard.press('ArrowRight'); await expect(history.locator('output')).toContainText('GMT-8');
    const before = await history.locator('output').textContent();
    await page.setViewportSize({ width: width + 20, height: 1000 }); await expect(chart).toBeFocused(); await expect(history.locator('output')).toHaveText(before);
    await page.setViewportSize({ width, height: 1000 });
    await range(history, 'point').click(); await expect(history.locator('circle')).toHaveCount(1); await expect(history.locator('.iui-finance-empty')).toContainText('一个有效观测点');
    await range(history, 'empty').click(); await expect(history.locator('.iui-finance-empty')).toContainText('暂无观测记录'); await expect(chart).toBeHidden();
    await range(history, 'all').click();
    for (let index = 0; index < 6; index++) { await range(history, 'dst').click(); await range(history, 'all').click(); }
    await expect(history.locator('[data-finance-series="orbit"] path')).toHaveCount(2);
    await expect(comparison.locator('[data-finance-series="seed"] circle')).toHaveCount(0);
    await expect(comparison.locator('.iui-finance-incomparable')).toContainText('没有有效价格');
    const relative = await comparison.locator('[data-finance-series="tide"] circle').last().getAttribute('data-value'); expect(Number(relative)).toBeCloseTo(12, 9);
    for (const id of ['orbit', 'tide', 'seed']) await series(comparison, id).click();
    await expect(comparison.locator('svg')).toBeHidden(); await expect(comparison.locator('.iui-finance-empty')).toContainText('所有系列已隐藏');
    const tide = series(comparison, 'tide'); await tide.focus(); await page.keyboard.press('Enter'); await expect(tide).toBeFocused();
    await expect(tide).toHaveAttribute('aria-pressed', 'true'); await expect(comparison.locator('[data-finance-series="tide"] circle')).toHaveCount(5);
    await series(comparison, 'orbit').click(); await series(comparison, 'seed').click();
    await page.screenshot({ path: testInfo.outputPath('finance-charts.png'), fullPage: true });
    await history.locator('summary').click(); await comparison.locator('summary').click();
    await expect(history.locator('table')).toBeVisible(); await expect(history.locator('tbody tr')).toHaveCount(6);
    await expect(history.locator('tbody')).toContainText('GMT-7'); await expect(history.locator('tbody')).toContainText('GMT-8'); await expect(history.locator('tbody')).toContainText('缺测');
    await expect(comparison.locator('tbody')).toContainText('不可比'); await expect(comparison.locator('tbody')).not.toContainText('USD');
    expect(await noOverflow(page)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('finance-full-tables.png'), fullPage: true });
    expect(requests.filter(url => !url.startsWith('http://127.0.0.1:4173/'))).toEqual([]);
  });
}

test('finance public mount handles loading/error/empty, long labels, decimals/zero and disposal', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 }); await page.goto('/mount.html'); await page.waitForFunction(() => window.iui);
  await page.evaluate(spec => {
    document.documentElement.lang = 'en'; const next = structuredClone(spec); next.state = { tick: 0 };
    next.body[0].instrument.name = 'A deliberately extremely long original synthetic name that wraps correctly on a narrow viewport';
    window.financeController = window.iui.mount(document.getElementById('host'), next);
    window.oldFinance = document.querySelector('[data-kind="finance-chart"]'); window.oldFinanceButton = window.oldFinance.querySelector('[data-value="all"]');
  }, fixture);
  const quote = kind(page, 'quote'), history = kind(page, 'chart');
  expect(await noOverflow(page)).toBe(true);
  await range(history, 'dst').focus(); await page.keyboard.press('Enter');
  await page.evaluate(() => window.financeController.setState({ tick: 1 })); await expect(range(history, 'dst')).toBeFocused();
  const chart = history.locator('svg'); await chart.focus(); await page.keyboard.press('Home'); const before = await history.locator('output').textContent();
  await page.evaluate(() => window.financeController.setState({ tick: 2 })); await expect(chart).toBeFocused(); await expect(history.locator('output')).toHaveText(before);
  for (const status of ['loading', 'error', 'ready', 'loading', 'ready']) {
    await page.evaluate(({ spec, status }) => { const next = structuredClone(spec); for (const node of next.body) node.status = status; window.financeController.update(next); }, { spec: fixture, status });
    await expect(history).toHaveAttribute('data-status', status);
    await expect(history.locator('.iui-finance-source')).toContainText('Synthetic demonstration');
    if (status !== 'ready') { await expect(history.locator('.iui-finance-body')).toBeHidden(); await expect(history.locator('.iui-finance-status')).toBeVisible(); }
  }
  expect(await page.evaluate(() => { window.oldFinanceButton.click(); return window.oldFinance.dataset.range; })).toBe('dst');
  await page.evaluate(spec => {
    const next = structuredClone(spec); next.body[0].instrument.price = 0; next.body[0].instrument.previousClose = 0;
    next.body[1].instrument.history.forEach(point => { point.price = null; }); window.financeController.update(next);
  }, fixture);
  await expect(quote.locator('.iui-finance-price')).toHaveText('0 USD'); await expect(quote.locator('.iui-finance-change-percent')).toHaveText('(Unavailable)');
  await expect(history.locator('.iui-finance-empty')).toContainText('No valid values'); await history.locator('summary').click(); await expect(history.locator('tbody tr')).toHaveCount(6);
  await page.evaluate(spec => { const next = structuredClone(spec); next.body[0].instrument.price = 0.0000321; next.body[0].instrument.previousClose = 0.00003; window.financeController.update(next); }, fixture);
  await expect(quote.locator('.iui-finance-price')).toHaveText('0.0000321 USD'); await expect(quote.locator('.iui-finance-change-percent')).toHaveText('(+7%)');
  expect(await noOverflow(page)).toBe(true);
  await page.evaluate(() => { window.detachedFinance = document.querySelector('[data-kind="finance-chart"]'); window.financeController.dispose(); window.detachedFinance.querySelector('[data-value="dst"]').click(); });
  await expect(page.locator('#host')).toBeEmpty(); expect(await page.evaluate(() => window.detachedFinance.dataset.range)).toBe('all');
});

test('finance comparison exposes zero and missing baselines without inventing normalization', async ({ page }) => {
  await page.goto('/mount.html'); await page.waitForFunction(() => window.iui);
  await page.evaluate(spec => {
    document.documentElement.lang = 'en'; const next = structuredClone(spec); next.body = [next.body[2]];
    next.body[0].baselineAt = '2026-11-01T07:30:00Z'; next.body[0].instruments[0].history[0].price = 0;
    next.body[0].instruments[1].history.shift(); window.financeController = window.iui.mount(document.getElementById('host'), next);
  }, fixture);
  const root = kind(page, 'comparison'); await expect(root.locator('svg')).toBeHidden(); await expect(root.locator('.iui-finance-incomparable')).toHaveCount(3);
  await expect(root.locator('[data-instrument="orbit"] .iui-finance-incomparable')).toContainText('above zero');
  await expect(root.locator('[data-instrument="tide"] .iui-finance-incomparable')).toContainText('no valid price');
  await root.locator('summary').click(); await expect(root.locator('tbody')).toContainText('Not comparable');
  await page.evaluate(() => window.financeController.dispose());
});
