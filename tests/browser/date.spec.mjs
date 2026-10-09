import { test, expect } from '@playwright/test';

// Prepared for combined CI; NOT executed locally. Native picker popup geometry
// and visible date order are browser/OS/locale-owned, not an Inform UI contract.
test.beforeEach(async ({ page }) => {
  page.__dateErrors = []; page.on('pageerror', error => page.__dateErrors.push(error.message));
});
test.afterEach(async ({ page }) => { expect(page.__dateErrors).toEqual([]); });

for (const colorScheme of ['light', 'dark']) for (const width of [390, 768, 1100]) {
  test(`date native label, first-click submit and layout ${colorScheme} ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 }); await page.emulateMedia({ colorScheme });
    const external = []; page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:4173/')) external.push(request.url()); });
    await page.goto('/date-practice.html');
    const form = page.getByRole('form', { name: '本地日期练习' }), field = form.getByLabel('练习日期', { exact: false }).first();
    await expect(field).toHaveAttribute('type', 'date'); await expect(field).toHaveValue('2024-02-29'); await expect(field).toHaveAccessibleDescription(/原始值/);
    const label = page.locator(`label[for="${await field.getAttribute('id')}"]`); await label.click(); await expect(field).toBeFocused();
    await field.fill(''); await form.getByRole('button', { name: '检查日期' }).click();
    await expect(form).toHaveAttribute('data-status', 'invalid'); await expect(field).toBeFocused(); await expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(form.locator('.iui-field-error').first()).toHaveText('请填写此项。');
    await field.fill('2024-12-31'); await expect(field).toHaveAttribute('aria-invalid', 'false'); await form.getByRole('button', { name: '检查日期' }).click();
    await expect(form).toHaveAttribute('data-status', 'success');
    await field.fill('2025-01-01'); await form.getByRole('button', { name: '检查日期' }).click(); await expect(form).toHaveAttribute('data-status', 'invalid');
    await expect(form.locator('.iui-field-error').first()).toHaveText('日期晚于允许的最晚日期。');
    await form.getByRole('button', { name: '恢复初值' }).click(); await expect(field).toHaveValue('2024-02-29'); await expect(field).toHaveAttribute('aria-invalid', 'false');
    expect(await field.evaluate(node => node.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
    expect(await field.evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(16);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); expect(external).toEqual([]);
    await page.screenshot({ path: `test-results/date-${colorScheme}-${width}.png`, fullPage: true });
  });
}

async function mountDate(page, { required = true, pending = false, rtl = false } = {}) {
  await page.goto('/mount.html'); await page.waitForFunction(() => !!window.iui);
  await page.evaluate(({ required, pending, rtl }) => {
    document.documentElement.lang = 'en'; document.documentElement.dir = rtl ? 'rtl' : 'ltr';
    window.dateCalls = []; window.dateSignals = []; window.dateEvents = []; window.datePending = [];
    const host = document.getElementById('host'); host.addEventListener('iui:submit', event => window.dateEvents.push(event.detail.values));
    window.dateSpec = { version: 'iui/1', description: rtl ? 'مثال أصلي للتاريخ.' : 'Original date-only example.', state: { day: '2024-06-15', other: 0, locked: false }, body: [{ type: 'form', label: 'Date practice', action: 'save', children: [
      { type: 'field', label: 'Details', disabled: { $: 'locked' }, children: [{ type: 'input', kind: 'date', label: 'Practice date', bind: 'day', required, minDate: '2024-01-01', maxDate: '2024-12-31', hint: 'Browser-native date field.' }] },
      { type: 'button', label: 'Restore date', action: { kind: 'set', bind: 'day', value: '2024-06-15' } }
    ] }] };
    window.dateController = window.iui.mount(host, window.dateSpec, { actions: { save: ({ values, signal }) => {
      window.dateCalls.push(values); window.dateSignals.push(signal); if (pending) return new Promise(resolve => window.datePending.push(resolve));
    } } });
  }, { required, pending, rtl });
  return { form: page.getByRole('form', { name: 'Date practice' }), field: page.getByLabel('Practice date', { exact: false }) };
}

test('native date range drafts never publish; same-value overwrite and submit snapshot remain exact strings', async ({ page }) => {
  const { field, form } = await mountDate(page);
  for (const [raw, message] of [['2023-12-31', /earliest/], ['2025-01-01', /latest/], ['', /required/]]) {
    await field.fill(raw); await page.evaluate(() => window.dateController.setState({ other: window.dateController.getState().other + 1 }));
    await expect(field).toHaveValue(raw); expect(await page.evaluate(() => window.dateController.getState().day)).toBe('2024-06-15');
    await form.getByRole('button', { name: 'Submit', exact: true }).click(); await expect(form).toHaveAttribute('data-status', 'invalid'); await expect(field).toBeFocused(); await expect(form.locator('.iui-field-error')).toHaveText(message);
    expect(await page.evaluate(() => window.dateCalls)).toEqual([]);
  }
  await page.evaluate(() => window.dateController.setState({ day: '2024-06-15' })); await expect(field).toHaveValue('2024-06-15'); await expect(field).toHaveAttribute('aria-invalid', 'false');
  await field.fill('2024-12-31'); await form.getByRole('button', { name: 'Submit', exact: true }).click(); await expect(form).toHaveAttribute('data-status', 'success');
  expect(await page.evaluate(() => ({ calls: window.dateCalls, events: window.dateEvents }))).toEqual({ calls: [{ day: '2024-12-31' }], events: [{ day: '2024-12-31' }] });
});

test('native segment keyboard edits preserve incomplete optional drafts, then accept deliberate clear', async ({ page }) => {
  const { field, form } = await mountDate(page, { required: false });
  await field.focus(); await field.press('ArrowUp');
  const edited = await field.inputValue(); expect(edited).toMatch(/^2024-\d{2}-\d{2}$/); expect(edited).not.toBe('2024-06-15'); expect(await page.evaluate(() => window.dateController.getState().day)).toBe(edited);
  // This tests real Chromium date segments, not a mocked validity object or popup pixels.
  await field.press('Delete'); expect(await field.evaluate(node => node.validity.badInput)).toBe(true); await expect(field).toHaveValue('');
  expect(await page.evaluate(() => window.dateController.getState().day)).toBe(edited);
  await form.getByRole('button', { name: 'Submit', exact: true }).click(); await expect(form).toHaveAttribute('data-status', 'invalid'); await expect(form.locator('.iui-field-error')).toHaveText('Enter a valid date.');
  await form.getByRole('button', { name: 'Restore date' }).click(); await expect(field).toHaveValue('2024-06-15');
  await field.fill(''); await form.getByRole('button', { name: 'Submit', exact: true }).click(); await expect(form).toHaveAttribute('data-status', 'success'); expect(await page.evaluate(() => window.dateCalls)).toEqual([{ day: '' }]);
});

test('date pending action, repeated click, cancel and stale completion use shared Forms behavior', async ({ page }) => {
  const { field, form } = await mountDate(page, { pending: true }); await field.fill('2024-03-01');
  await form.getByRole('button', { name: 'Submit', exact: true }).dblclick(); await expect(form).toHaveAttribute('aria-busy', 'true'); await expect(field).toBeDisabled(); expect(await page.evaluate(() => window.dateCalls.length)).toBe(1);
  await form.getByRole('button', { name: 'Cancel', exact: true }).click(); expect(await page.evaluate(() => window.dateSignals[0].aborted)).toBe(true); await expect(field).toHaveValue('2024-06-15');
  await page.evaluate(() => window.datePending[0]()); await expect(form).toHaveAttribute('data-status', 'cancelled'); expect(await page.evaluate(() => window.dateEvents)).toEqual([]);
  await form.getByRole('button', { name: 'Submit', exact: true }).click(); await page.evaluate(() => window.dateController.dispose()); expect(await page.evaluate(() => window.dateSignals[1].aborted)).toBe(true); await expect(page.locator('#host')).toBeEmpty();
});

test('date RTL, forced colors, native label focus and disabled fieldsets remain accessible', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' }); const { field, form } = await mountDate(page, { rtl: true });
  await expect(page.locator('.iui-field')).toHaveCSS('direction', 'rtl');
  await page.locator(`label[for="${await field.getAttribute('id')}"]`).click(); await expect(field).toBeFocused(); await field.press('ArrowUp'); await expect(field).toHaveCSS('outline-style', 'solid');
  await page.evaluate(() => window.dateController.setState({ locked: true })); await expect(field).toBeDisabled(); await form.getByRole('button', { name: 'Submit', exact: true }).click(); await expect(form).toHaveAttribute('data-status', 'success'); expect(await page.evaluate(() => window.dateCalls)).toEqual([{}]);
  await page.evaluate(() => window.dateController.setState({ locked: false, day: '2024-06-15' })); await expect(field).toBeEnabled(); await expect(field).toHaveValue('2024-06-15');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
