// Copy to tests/browser/ in the integrated repo. The regular build-examples task serves weather.html.
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const fixture = JSON.parse(await readFile(new URL('../../examples/weather.json', import.meta.url)));

test.beforeEach(async ({ page }) => {
  page.on('pageerror', error => { throw error; });
});

for (const theme of ['light', 'dark']) for (const width of [390, 768, 1100]) {
  test(`weather ${theme} ${width}px: local interactions, keyboard, domain geometry and no page overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 }); await page.emulateMedia({ colorScheme: theme });
    const requests = []; page.on('request', request => requests.push(request.url()));
    await page.goto('/weather.html'); const root = page.locator('.iui-weather'); await expect(root).toBeVisible();
    await page.locator('.iui-root').evaluate((element, value) => { element.dataset.theme = value; }, theme);
    await expect(root.locator('.iui-weather-source')).toContainText('合成演示');
    await expect(root.locator('.iui-weather-source')).toContainText('更新时间');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await root.locator('.iui-weather-chart').evaluate(element => Math.round(element.getBoundingClientRect().height))).toBe(120);
    expect(await root.locator('.iui-weather-day-icon').first().evaluate(element => Math.round(element.getBoundingClientRect().width))).toBe(28);
    expect(await root.locator('[role="tab"]').first().evaluate(element => element.getBoundingClientRect().width)).toBeGreaterThanOrEqual(64);
    const first = root.locator('[role="tab"]').first(); await first.focus(); await page.keyboard.press('ArrowRight');
    await expect(root).toHaveAttribute('data-date', '2026-11-02'); await expect(root.locator('[role="tab"]').nth(1)).toBeFocused();
    await page.keyboard.press('End'); await expect(root).toHaveAttribute('data-date', '2026-11-06'); await expect(root.locator('.iui-weather-empty')).toBeVisible();
    await page.keyboard.press('Home'); await expect(root).toHaveAttribute('data-date', '2026-11-01');
    const fahrenheit = root.getByRole('button', { name: '华氏度' }); await fahrenheit.focus(); await page.keyboard.press('Enter');
    await expect(root.locator('.iui-weather-current-temperature')).toHaveText('57.6°F'); await expect(fahrenheit).toBeFocused();
    for (let index = 0; index < 5; index++) { await root.getByRole('button', { name: '摄氏度' }).click(); await fahrenheit.click(); }
    await root.getByRole('button', { name: '摄氏度' }).click(); await expect(root.locator('.iui-weather-current-temperature')).toHaveText('14.2°C');
    const chart = root.locator('.iui-weather-chart'); await chart.focus(); await page.keyboard.press('ArrowRight');
    await expect(root.locator('output')).toContainText('GMT-7'); await page.keyboard.press('ArrowRight'); await expect(root.locator('output')).toContainText('GMT-8');
    await page.keyboard.press('End'); await expect(root.locator('output')).toContainText('23:00');
    await root.getByRole('button', { name: '降水概率', exact: true }).click(); await expect(root.locator('[data-weather-series]')).toHaveAttribute('data-weather-series', 'precipitation');
    await root.getByRole('button', { name: '表格', exact: true }).click(); await expect(root.locator('table')).toBeVisible();
    await expect(root.locator('tbody')).toContainText('GMT-7'); await expect(root.locator('tbody')).toContainText('GMT-8'); await expect(root.locator('tbody')).toContainText('缺测');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/weather-table-${theme}-${width}.png`, fullPage: true });
    await root.getByRole('button', { name: '图表', exact: true }).click(); await root.getByRole('button', { name: '温度', exact: true }).click();
    await page.screenshot({ path: `test-results/weather-chart-${theme}-${width}.png`, fullPage: true });
    expect(requests.filter(url => !url.startsWith('http://127.0.0.1:4173/'))).toEqual([]);
  });
}

test('weather mount update/dispose, loading/error/empty/single point, and accessible offscreen days', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 }); await page.goto('/mount.html'); await page.waitForFunction(() => window.iui);
  await page.evaluate(spec => {
    const host = document.getElementById('host'); document.documentElement.lang = 'en';
    window.weatherController = window.iui.mount(host, spec); window.oldWeather = host.querySelector('.iui-weather'); window.oldWeatherButton = window.oldWeather.querySelector('[data-value="fahrenheit"]');
  }, fixture);
  const root = page.locator('.iui-weather');
  for (const status of ['loading', 'error', 'ready', 'loading', 'ready']) {
    await page.evaluate(({ spec, status }) => { const next = structuredClone(spec); next.body[0].status = status; window.weatherController.update(next); }, { spec: fixture, status });
    await expect(root).toHaveAttribute('data-status', status); await expect(root.locator('.iui-weather-source')).toContainText('Synthetic demonstration');
    if (status !== 'ready') { await expect(root.locator('.iui-weather-body')).toBeHidden(); await expect(root.locator('.iui-weather-status')).toBeVisible(); }
    if (status === 'loading') expect(await root.evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(400);
  }
  expect(await page.evaluate(() => { window.oldWeatherButton.click(); return window.oldWeather.dataset.unit; })).toBe('celsius');
  await root.locator('[role="tab"]').first().focus(); await page.keyboard.press('End'); await expect(root.locator('[role="tab"]').last()).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await root.locator('[data-weather-action="date"][data-value="2026-11-03"]').click(); await expect(root.locator('circle[data-hour]')).toHaveCount(1);
  await page.evaluate(spec => { const next = structuredClone(spec); next.body[0].daily = []; next.body[0].hourly = []; delete next.body[0].initialDate; window.weatherController.update(next); }, fixture);
  await expect(root.locator('.iui-weather-empty')).toContainText('No data available'); await expect(root.locator('[role="tablist"]')).toBeHidden();
  await page.evaluate(() => window.weatherController.dispose()); await expect(page.locator('#host')).toBeEmpty();
});
