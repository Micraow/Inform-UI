import { test, expect } from '@playwright/test';

// CI owns Chromium execution. These tests do not require public network access.
test.beforeEach(async ({ page }) => {
  page.__formErrors = [];
  page.on('pageerror', error => page.__formErrors.push(error.message));
});
test.afterEach(async ({ page }) => { expect(page.__formErrors).toEqual([]); });

for (const colorScheme of ['light', 'dark']) for (const width of [390, 768, 1100]) {
  test(`forms: ${colorScheme} ${width}px native inputs, errors, keyboard and layout`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme });
    const external = [];
    page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:4173/')) external.push(request.url()); });
    await page.goto('/forms.html');
    const form = page.getByRole('form', { name: '合成分账表单' });
    const title = form.getByRole('textbox', { name: '分账名称' });
    const amount = form.getByRole('spinbutton', { name: '总点数' });
    const people = form.getByRole('spinbutton', { name: '参与人数' });
    await expect(form).toBeVisible();
    await expect(title).toHaveAccessibleName('分账名称');
    await expect(title).toHaveAccessibleDescription(/必填/);
    await expect(form.getByRole('group', { name: '点数与人数' })).toBeVisible();
    await expect(form.getByRole('group', { name: '演示场景' })).toBeVisible();
    await expect(form.getByRole('radio', { name: '未开放的合成场景' })).toBeDisabled();
    await amount.fill('150');
    await expect(form.locator('.iui-metric-value')).toHaveText('50点');
    await people.focus();
    await page.keyboard.press('ArrowUp');
    await expect(people).toHaveValue('4');
    await expect(form.locator('.iui-metric-value')).toHaveText('37.5点');
    await title.fill('');
    await form.getByRole('button', { name: '确认分账' }).click();
    await expect(title).toBeFocused();
    await expect(title).toHaveAttribute('aria-invalid', 'true');
    await expect(form.locator('.iui-field-error').first()).toHaveText('请填写此项。');
    await title.fill('新的合成示例');
    await expect(title).toHaveAttribute('aria-invalid', 'false');
    await amount.fill('');
    await form.getByRole('button', { name: '确认分账' }).click();
    await expect(amount).toBeFocused();
    await expect(form).toHaveAttribute('data-status', 'invalid');
    await amount.fill('150');
    const meal = form.getByRole('radio', { name: '聚餐', exact: true });
    await meal.focus();
    await page.keyboard.press('ArrowRight');
    await expect(form.getByRole('radio', { name: '出游', exact: true })).toBeChecked();
    const precision = form.getByRole('radio', { name: '整数', exact: true });
    await precision.focus();
    await page.keyboard.press('Space');
    await expect(precision).toBeChecked();
    await page.keyboard.press('ArrowRight');
    await expect(form.getByRole('radio', { name: '两位小数', exact: true })).toBeChecked();
    await form.getByRole('textbox', { name: '演示邮箱' }).focus();
    await page.keyboard.press('Enter');
    await expect(form).toHaveAttribute('data-status', 'success');
    await expect(form.getByRole('status')).toHaveText('已完成当前视图的本地提交。');
    await form.getByRole('button', { name: '恢复初值' }).click();
    await expect(amount).toHaveValue('126');
    await expect(people).toHaveValue('3');
    await expect(title).toHaveValue('周末合成示例');
    const empty = page.getByRole('form', { name: '空白清单' });
    await empty.getByRole('button', { name: '确认空清单' }).click();
    await expect(empty).toHaveAttribute('data-status', 'success');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const metrics = await form.evaluate(node => {
      const control = node.querySelector('.iui-field > input');
      const label = control.previousElementSibling;
      const hint = control.nextElementSibling;
      const a = control.getBoundingClientRect(), b = label.getBoundingClientRect(), h = hint.getBoundingClientRect();
      return { labelGap: a.top - b.bottom, hintGap: h.top - a.bottom, controlHeight: a.height, fontSize: parseFloat(getComputedStyle(control).fontSize), pageOverflow: document.documentElement.scrollWidth > innerWidth };
    });
    expect(metrics.labelGap).toBeGreaterThanOrEqual(1);
    expect(metrics.labelGap).toBeLessThanOrEqual(3);
    expect(metrics.hintGap).toBeGreaterThanOrEqual(3);
    expect(metrics.hintGap).toBeLessThanOrEqual(5);
    expect(metrics.controlHeight).toBeGreaterThanOrEqual(44);
    expect(metrics.fontSize).toBeGreaterThanOrEqual(16);
    expect(metrics.pageOverflow).toBe(false);
    expect(external).toEqual([]);
    await page.screenshot({ path: `test-results/forms-${colorScheme}-${width}.png`, fullPage: true });
  });
}

async function mountHarness(page, mode = 'pending') {
  await page.goto('/mount.html');
  await page.waitForFunction(() => window.iui);
  await page.evaluate(mode => {
    document.documentElement.lang = 'en';
    window.formCalls = 0; window.formSignals = []; window.formPending = []; window.formEvents = [];
    window.formsSpec = { version: 'iui/1', state: { amount: 12, title: 'Synthetic', locked: false }, body: [{ type: 'form', label: 'Action form', action: 'demo.save', children: [{ type: 'field', label: 'Details', disabled: { $: 'locked' }, children: [{ type: 'input', kind: 'number', label: 'Amount', bind: 'amount', required: true }, { type: 'input', kind: 'text', label: 'Title', bind: 'title', required: true }] }] }] };
    const host = document.getElementById('host');
    host.addEventListener('iui:submit', event => window.formEvents.push(event.detail));
    window.formsController = window.iui.mount(host, window.formsSpec, { actions: { 'demo.save': ({ values, signal }) => {
      window.formCalls++; window.formSignals.push(signal); window.formPayload = values;
      if (mode === 'failOnce') return window.formCalls === 1 ? Promise.reject(new Error('Synthetic failure')) : undefined;
      return new Promise((resolve, reject) => window.formPending.push({ resolve, reject }));
    } } });
  }, mode);
}

test('forms: pending action, repeated submit, cancel, retry and stale completion', async ({ page }) => {
  await mountHarness(page);
  const form = page.getByRole('form', { name: 'Action form' });
  await page.getByRole('spinbutton', { name: 'Amount' }).fill('24');
  await form.getByRole('button', { name: 'Submit', exact: true }).click();
  await form.evaluate(node => { node.requestSubmit(); node.requestSubmit(); });
  expect(await page.evaluate(() => window.formCalls)).toBe(1);
  await expect(form).toHaveAttribute('aria-busy', 'true');
  await expect(page.getByRole('spinbutton')).toBeDisabled();
  await expect(form.getByRole('button', { name: 'Submitting…' })).toBeDisabled();
  await form.getByRole('button', { name: 'Cancel', exact: true }).click();
  expect(await page.evaluate(() => window.formSignals[0].aborted)).toBe(true);
  await expect(page.getByRole('spinbutton')).toHaveValue('12');
  await form.getByRole('button', { name: 'Submit', exact: true }).click();
  await page.evaluate(() => window.formPending[1].resolve());
  await expect(form).toHaveAttribute('data-status', 'success');
  await page.evaluate(() => window.formPending[0].reject(new Error('Late ignored failure')));
  await expect(form).toHaveAttribute('data-status', 'success');
  expect(await page.evaluate(() => window.formEvents.length)).toBe(1);
  await page.screenshot({ path: 'test-results/forms-action-success.png', fullPage: true });
});

test('forms: actual failure is announced and retry succeeds', async ({ page }) => {
  await mountHarness(page, 'failOnce');
  const form = page.getByRole('form', { name: 'Action form' });
  await form.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(form).toHaveAttribute('data-status', 'error');
  await expect(form.getByRole('status')).toHaveText('Submission failed. Try again.');
  await page.screenshot({ path: 'test-results/forms-action-error.png', fullPage: true });
  await form.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(form).toHaveAttribute('data-status', 'success');
  expect(await page.evaluate(() => window.formCalls)).toBe(2);
});

test('forms: inherited fieldset disabled, keyboard submission and independent updates', async ({ page }) => {
  await mountHarness(page, 'failOnce');
  await page.evaluate(() => window.formsController.setState({ locked: true }));
  await expect(page.getByRole('spinbutton')).toBeDisabled();
  await expect(page.getByRole('textbox')).toBeDisabled();
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  expect(await page.evaluate(() => window.formPayload)).toEqual({});
  await page.evaluate(() => window.formsController.setState({ locked: false }));
  const title = page.getByRole('textbox', { name: 'Title' });
  await expect(title).toBeEnabled();
  await title.fill('');
  await title.press('Enter');
  await expect(title).toHaveAttribute('aria-invalid', 'true');
  await expect(title).toBeFocused();
});

test('forms: update and dispose abort host work and detach event listeners', async ({ page }) => {
  await mountHarness(page);
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  const result = await page.evaluate(async () => {
    const oldForm = document.querySelector('form');
    window.formsController.update(window.formsSpec);
    const abortedOnUpdate = window.formSignals[0].aborted;
    oldForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    window.formPending[0].resolve(); await Promise.resolve();
    const newStatus = document.querySelector('form').dataset.status;
    document.querySelector('form').requestSubmit();
    window.formsController.dispose();
    const abortedOnDispose = window.formSignals[1].aborted;
    window.formPending[1].resolve(); await Promise.resolve();
    return { abortedOnUpdate, abortedOnDispose, newStatus, calls: window.formCalls, events: window.formEvents.length, empty: document.getElementById('host').childElementCount === 0 };
  });
  expect(result).toEqual({ abortedOnUpdate: true, abortedOnDispose: true, newStatus: 'idle', calls: 2, events: 0, empty: true });
});
