/** Drop into repository tests/browser after time integration; uses the real public mount. */
import { test, expect } from '@playwright/test';
const doc = body => ({ version: 'iui/1', title: 'Original time control fixture', theme: 'auto', state: { tick: 0 }, body });
const nodes = [
  { type: 'clock', title: 'Shanghai snapshot', timezone: 'Asia/Shanghai', mode: 'snapshot', at: '2026-10-09T16:00:00Z' },
  { type: 'clock', title: 'Device clock', timezone: 'UTC', mode: 'live' },
  { type: 'stopwatch', title: 'Session stopwatch', elapsedMs: 1250 },
  { type: 'timer', title: 'Session timer', durationMs: 1200 },
];
async function setup(page, body = nodes, language = 'en') {
  await page.clock.install({ time: new Date('2026-10-09T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-10-09T00:00:01Z'));
  await page.goto('/mount.html'); await page.waitForFunction(() => Boolean(window.iui));
  await page.evaluate(({ input, language }) => {
    const host = document.getElementById('host'); host.lang = language;
    window.timeController = window.iui.mount(host, input);
  }, { input: doc(body), language });
}
const kind = (page, value) => page.locator(`.iui-time[data-kind="${value}"]`);
const action = (root, name) => root.locator(`[data-time-action="${name}"]`);

test('time keyboard controls, monotonic progression, stable focus and atomic update', async ({ page }) => {
  const requests = []; page.on('request', request => { if (request.url().startsWith('http') && !request.url().startsWith('http://127.0.0.1:4173')) requests.push(request.url()); });
  await setup(page);
  const stopwatch = kind(page, 'stopwatch'), start = action(stopwatch, 'start'), pause = action(stopwatch, 'pause'), lap = action(stopwatch, 'lap');
  await start.focus(); await page.keyboard.press('Enter'); await expect(stopwatch).toHaveAttribute('data-status', 'running'); await expect(pause).toBeFocused();
  await page.clock.runFor(250); await expect(stopwatch.locator('.iui-time-digits')).toHaveAttribute('data-milliseconds', '1500');
  await expect(pause).toBeFocused(); await page.keyboard.press('Space'); await expect(start).toBeFocused();
  await expect(stopwatch).toHaveAttribute('data-status', 'paused'); await page.clock.runFor(5000); await expect(stopwatch.locator('.iui-time-digits')).toHaveAttribute('data-milliseconds', '1500');
  await start.focus(); await page.keyboard.press('Space'); await expect(pause).toBeFocused(); await page.clock.runFor(100); await lap.focus(); await page.keyboard.press('Enter'); await expect(stopwatch.locator('tbody tr')).toHaveCount(1);
  await page.evaluate(() => window.timeController.setState({ tick: 5 })); await expect(lap).toBeFocused();
  await page.clock.runFor(100); await expect(lap).toBeFocused(); await expect(stopwatch.locator('tbody tr')).toHaveCount(1);
  const rejected = await page.evaluate(() => { try { window.timeController.update({ version: 'iui/1', body: [{ type: 'timer', durationMs: 0 }] }); return false; } catch { return true; } });
  expect(rejected).toBe(true); await expect(lap).toBeFocused(); await expect(stopwatch).toHaveAttribute('data-status', 'running');
  await pause.click(); await action(stopwatch, 'reset').click(); await expect(stopwatch.locator('.iui-time-digits')).toHaveAttribute('data-milliseconds', '1250'); await expect(stopwatch.locator('tbody tr')).toHaveCount(0);
  expect(requests).toEqual([]);
});
test('time exact completion once, delayed callback catch-up, restart and disposal', async ({ page }) => {
  await setup(page, [{ type: 'timer', durationMs: 1 }, { type: 'stopwatch', elapsedMs: 604799999 }]);
  const timer = kind(page, 'timer'), stopwatch = kind(page, 'stopwatch');
  await expect(timer.locator('.iui-time-digits')).toHaveText('00:00:00.01');
  await action(timer, 'start').click();
  await page.evaluate(() => {
    const status = document.querySelector('[data-kind=timer] [role=status]'); window.timeCompletions = 0;
    window.timeObserver = new MutationObserver(records => { if (status.textContent === 'Timer complete.') window.timeCompletions += records.length; });
    window.timeObserver.observe(status, { childList: true });
  });
  await page.clock.runFor(1); await expect(timer).toHaveAttribute('data-status', 'complete'); await expect(action(timer, 'start')).toBeFocused(); expect(await page.evaluate(() => window.timeCompletions)).toBe(1);
  await page.clock.runFor(10000); expect(await page.evaluate(() => window.timeCompletions)).toBe(1);
  await action(timer, 'start').click(); await page.clock.runFor(1); expect(await page.evaluate(() => window.timeCompletions)).toBe(2);
  await action(timer, 'reset').click(); await expect(timer.locator('.iui-time-digits')).toHaveText('00:00:00.01');
  await action(stopwatch, 'start').click(); await page.clock.fastForward(100000); await expect(stopwatch).toHaveAttribute('data-status', 'limit'); await expect(action(stopwatch, 'reset')).toBeFocused(); await expect(stopwatch.locator('.iui-time-digits')).toHaveText('168:00:00.00');
  await page.evaluate(() => { window.retainedTimeRoot = document.querySelector('[data-kind=timer]'); window.retainedTimeText = window.retainedTimeRoot.textContent; window.timeController.dispose(); window.retainedTimeRoot.querySelector('button').click(); window.timeObserver.disconnect(); });
  await page.clock.runFor(5000); expect(await page.evaluate(() => window.retainedTimeRoot.textContent === window.retainedTimeText)).toBe(true); await expect(page.locator('#host')).toBeEmpty();
});
test('time timezone rollover, DST snapshots, live advancement and translated nearest-host labels', async ({ page }) => {
  await setup(page, [
    { type: 'clock', timezone: 'America/New_York', mode: 'snapshot', at: '2026-03-08T06:59:59Z' },
    { type: 'clock', timezone: 'America/New_York', mode: 'snapshot', at: '2026-03-08T07:00:00Z' },
    { type: 'clock', timezone: 'Asia/Shanghai', mode: 'snapshot', at: '2026-10-09T16:00:00Z' },
    { type: 'clock', timezone: 'UTC', mode: 'live' },
    { type: 'timer', durationMs: 1, title: '<img src=x onerror=alert(1)>' },
  ], 'zh-CN');
  const clocks = kind(page, 'clock'); await expect(clocks.nth(0).locator('.iui-time-digits')).toHaveText('01:59:59'); await expect(clocks.nth(1).locator('.iui-time-digits')).toHaveText('03:00:00');
  await expect(clocks.nth(2).locator('.iui-time-date')).toHaveAttribute('datetime', '2026-10-10');
  const before = await clocks.nth(3).locator('.iui-time-digits').textContent(); await page.clock.runFor(1000); expect(await clocks.nth(3).locator('.iui-time-digits').textContent()).not.toBe(before);
  await expect(clocks.nth(0).locator('.iui-time-digits')).toHaveText('01:59:59');
  const timer = kind(page, 'timer'); await expect(timer.getByRole('button', { name: '开始', exact: true })).toBeVisible(); await expect(page.locator('#host img')).toHaveCount(0);
  await action(timer, 'start').click(); await page.clock.runFor(1); await expect(timer.getByRole('status')).toHaveText('倒计时结束。');
});
for (const theme of ['light', 'dark']) for (const width of [390, 768, 1100]) {
  test(`time visual and accessible geometry ${theme} ${width}`, async ({ page }) => {
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width, height: 950 }); await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' }); await setup(page);
    const stopwatch = kind(page, 'stopwatch'); await action(stopwatch, 'start').click();
    for (let i = 0; i < 4; i++) { await page.clock.runFor(250); await action(stopwatch, 'lap').click(); }
    await action(stopwatch, 'pause').click();
    const region = stopwatch.getByRole('region', { name: 'Laps', exact: true });
    // Pointer activation does not establish :focus-visible. Reach the region via
    // real keyboard navigation, then require its unchanged visible-focus rule.
    await action(stopwatch, 'reset').focus(); await page.keyboard.press('Tab'); await expect(region).toBeFocused();
    expect(await region.evaluate(node => getComputedStyle(node).outlineStyle)).toBe('solid');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const fit = await page.locator('.iui-time-digits').evaluateAll(nodes => nodes.every(node => node.scrollWidth <= node.clientWidth + 1)); expect(fit).toBe(true);
    const buttons = await page.locator('.iui-time-actions button').evaluateAll(nodes => nodes.every(node => node.getBoundingClientRect().height >= 44)); expect(buttons).toBe(true);
    await expect(stopwatch.locator('time')).toHaveAttribute('aria-live', 'off');
    await page.screenshot({ path: `test-results/time-${theme}-${width}.png`, fullPage: true });
    expect(errors).toEqual([]);
  });
}

test('bounded lap table stays keyboard-scrollable and cap preserves earlier records', async ({ page }) => {
  await setup(page, [{ type: 'stopwatch' }]);
  const stopwatch = kind(page, 'stopwatch'); await action(stopwatch, 'start').click(); await page.clock.runFor(250);
  await action(stopwatch, 'lap').focus();
  await page.evaluate(() => { const lap = document.querySelector('[data-time-action=lap]'); for (let i = 0; i < 101; i++) lap.click(); });
  await expect(stopwatch.locator('tbody tr')).toHaveCount(100); await expect(action(stopwatch, 'lap')).toBeDisabled(); await expect(action(stopwatch, 'pause')).toBeFocused();
  await expect(stopwatch.locator('tbody tr').first().locator('td').first()).toHaveAttribute('data-milliseconds', '250');
  const region = stopwatch.getByRole('region', { name: 'Laps', exact: true }); await region.focus(); await page.keyboard.press('PageDown');
  await page.clock.runFor(500); expect(await region.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
});
