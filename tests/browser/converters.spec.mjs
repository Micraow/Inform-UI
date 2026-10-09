import { test, expect } from '@playwright/test';
const unit = { type: 'unit-converter', category: 'temperature', amount: 10, from: 'C', to: 'F', temperatureMode: 'difference' };
const currency = { type: 'currency-converter', amount: 100, base: 'USD', from: 'USD', to: 'EUR', source: { label: 'Original synthetic rate snapshot', synthetic: true, url: 'https://example.org/rates' }, asOf: '2026-10-08T10:00:00+08:00', rates: [{ currency: 'EUR', rate: .8 }, { currency: 'JPY', rate: 160 }, { currency: 'GBP', rate: null }] };
const document = nodes => ({ version: 'iui/1', title: 'Original converter acceptance fixture', state: { tick: 0 }, body: Array.isArray(nodes) ? nodes : [nodes] });
const rootOf = (page, type) => page.locator(`[data-kind="${type}-converter"]`);
const control = (root, name) => root.locator(`[data-converter-control="${name}"]`);
const action = (root, name) => root.locator(`[data-converter-action="${name}"]`);
const noOverflow = page => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

test.beforeEach(async ({ page }) => { page.on('pageerror', error => { throw error; }); await page.goto('/mount.html'); await page.waitForFunction(() => window.iui); });
for (const theme of ['light', 'dark']) for (const width of [390, 768, 1100]) {
  test(`converters ${theme} ${width}px: keyboard, temperature, rates, status, reset and narrow layout`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1100 }); await page.emulateMedia({ colorScheme: theme });
    const requests = []; page.on('request', request => requests.push(request.url()));
    await page.evaluate(({ spec, theme }) => { document.documentElement.lang = 'en'; window.converterController = window.iui.mount(document.getElementById('host'), { ...spec, theme }); }, { spec: document([unit, currency]), theme });
    const units = rootOf(page, 'unit'), currencies = rootOf(page, 'currency'), amount = control(units, 'amount'), output = units.locator('output');
    await expect(output).toHaveText('18 Δ°F'); await amount.fill('20'); await expect(output).toHaveText('36 Δ°F');
    await page.evaluate(() => window.converterController.setState({ tick: 1 })); await expect(amount).toBeFocused();
    await amount.fill('1e'); await expect(amount).toHaveValue('1e'); await expect(amount).toHaveAttribute('aria-invalid', 'true'); await expect(output).toHaveText('—');
    await action(units, 'reset').focus(); await page.keyboard.press('Enter'); await expect(action(units, 'reset')).toBeFocused(); await expect(output).toHaveText('18 Δ°F');
    await action(units, 'swap').focus(); await page.keyboard.press('Enter'); await expect(action(units, 'swap')).toBeFocused(); await expect(amount).toHaveValue('10'); expect(Number(await output.getAttribute('data-raw-value'))).toBeCloseTo(10 / 1.8, 12);
    await control(units, 'category').selectOption('data'); await control(units, 'from').selectOption('MiB'); await control(units, 'to').selectOption('MB'); await amount.fill('1'); await expect(output).toHaveText('1.048576 MB');
    await control(units, 'category').focus(); await page.keyboard.press('Home'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter'); await expect(control(units, 'category')).toHaveValue('mass'); await expect(control(units, 'category')).toBeFocused();await page.keyboard.press('Escape');await expect(control(units, 'category')).toHaveValue('mass');await expect(control(units, 'category')).toBeFocused();
    await control(units, 'category').selectOption('temperature'); await control(units, 'from').selectOption('C'); await control(units, 'to').selectOption('F'); await control(units, 'mode').selectOption('absolute'); await amount.fill('-300'); await expect(output).toHaveText('—'); await expect(units.locator('.iui-converter-error')).toContainText('absolute zero');
    await amount.fill('0'); await expect(output).toHaveText('32 °F');
    await expect(currencies.locator('output')).toHaveText('80 EUR'); await control(currencies, 'to').selectOption('GBP'); await expect(currencies).toHaveAttribute('data-result', 'missing'); await expect(currencies.locator('output')).toHaveText('—'); await control(currencies, 'amount').fill('0'); await expect(currencies.locator('output')).toHaveText('—');
    await control(currencies, 'to').selectOption('JPY'); await expect(currencies.locator('output')).toHaveText('0 JPY'); await action(currencies, 'reset').click();
    await currencies.locator('summary').focus(); await page.keyboard.press('Enter'); await expect(currencies.locator('table')).toBeVisible(); await expect(currencies.locator('tbody tr')).toHaveCount(4); await expect(currencies.locator('time')).toHaveAttribute('datetime', currency.asOf); await expect(currencies.locator('footer')).toContainText('Synthetic demonstration');
    expect(await noOverflow(page)).toBe(true);
    const sizes = await page.locator('.iui-converter input,.iui-converter select,.iui-converter button').evaluateAll(nodes => nodes.filter(node => node.getClientRects().length).map(node => node.getBoundingClientRect().height)); expect(sizes.every(height => height >= 43)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`converters-${theme}-${width}.png`), fullPage: true });
    expect(requests.filter(url => !url.startsWith('http://127.0.0.1:4173/'))).toEqual([]);
  });
}

test('converter update/dispose, empty/loading/error, missing-rate identity and invalid drafts are stable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.evaluate(spec => { document.documentElement.lang = 'en'; window.converterController = window.iui.mount(document.getElementById('host'), spec); window.oldConverter = document.querySelector('.iui-converter'); }, document(currency));
  const root = rootOf(page, 'currency');
  for (const status of ['loading', 'error', 'ready', 'loading', 'ready']) { await page.evaluate(({ spec, status }) => { spec.body[0].status = status; window.converterController.update(spec); }, { spec: document(currency), status }); await expect(root).toHaveAttribute('data-status', status); if (status === 'ready') await expect(root.locator('.iui-converter-body')).toBeVisible(); else await expect(root.locator('.iui-converter-body')).toBeHidden(); await expect(root.locator('footer')).toContainText('Original synthetic rate snapshot'); }
  expect(await page.evaluate(() => { window.oldConverter.querySelector('[data-converter-action="swap"]').click(); return window.oldConverter.querySelector('output').value; })).toBe('80 EUR');
  await page.evaluate(spec => window.converterController.update(spec), document({ ...currency, rates: [], from: 'USD', to: 'USD' })); await expect(root).toHaveAttribute('data-status', 'empty'); await expect(root.locator('.iui-converter-body')).toBeHidden();
  await page.evaluate(spec => window.converterController.update(spec), document(currency)); await control(root, 'from').selectOption('GBP'); await control(root, 'to').selectOption('GBP'); await expect(root.locator('output')).toHaveText('100 GBP');
  for (const text of ['', ' ', '.', '-', '1e+', '1,000', 'NaN', '1e999', '1e-999']) { await control(root, 'amount').fill(text); await expect(control(root, 'amount')).toHaveValue(text); await expect(root.locator('output')).toHaveText('—'); }
  await action(root, 'reset').click(); await page.emulateMedia({ forcedColors: 'active' }); await expect(control(root, 'amount')).toBeVisible(); expect(await noOverflow(page)).toBe(true); await page.emulateMedia({ forcedColors: 'none' });
  await page.evaluate(() => { window.detachedConverter = document.querySelector('.iui-converter'); window.converterController.dispose(); window.detachedConverter.querySelector('[data-converter-action="swap"]').click(); }); await expect(page.locator('#host')).toBeEmpty(); expect(await page.evaluate(() => window.detachedConverter.querySelector('output').value)).toBe('80 EUR');
});

for(const [theme,width]of [['light',1100],['dark',390]])test(`Chinese converter teaching page ${theme} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.emulateMedia({colorScheme:theme});await page.goto('/converters.html');
 const units=page.locator('[data-kind="unit-converter"]');await expect(units).toHaveCount(2);await expect(units.first().locator('output')).toHaveText('18 Δ°F');await expect(units.nth(1).locator('output')).toHaveText('1.048576 MB');
 const rates=rootOf(page,'currency');await expect(rates.locator('output')).toHaveText('80 EUR');await expect(rates.locator('footer')).toContainText('合成演示');await rates.locator('summary').click();await expect(rates.locator('table')).toBeVisible();expect(await noOverflow(page)).toBe(true);
 await page.screenshot({path:`test-results/converters-zh-${theme}-${width}.png`,fullPage:true});
});
