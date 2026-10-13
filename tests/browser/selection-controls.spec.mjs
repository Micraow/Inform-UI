import {test, expect} from '@playwright/test';
import {selectionControlsDocument} from '../selection-controls-fixture.mjs';

async function setup(page, theme = 'light', direction = 'ltr') {
  await page.goto('/mount.html');
  await page.waitForFunction(() => Boolean(window.iui));
  await page.evaluate(({input, direction}) => {
    document.documentElement.lang = 'en';
    document.documentElement.dir = direction;
    window.selectionController = window.iui.mount(document.getElementById('host'), input);
  }, {input: selectionControlsDocument(theme), direction});
  await expect(page.locator('.iui-root')).toHaveCSS('--iui-control-height', '44px');
}

const plainChoices = '.iui-root input:is([type=radio],[type=checkbox]):not(.iui-segmented input,.iui-rating input)';
test.beforeEach(async ({page}) => {
  page.__selectionErrors = [];
  page.on('pageerror', error => page.__selectionErrors.push(error.message));
});
test.afterEach(async ({page}) => { expect(page.__selectionErrors).toEqual([]); });

for (const theme of ['light', 'dark']) for (const width of [320, 768, 1100]) {
  test(`shared selection controls ${theme} ${width}px retain neutral indicators and usable fields`, async ({page}) => {
    await page.setViewportSize({width, height: 900});
    await setup(page, theme);
    const metrics = await page.locator('.iui-root').evaluate(root => {
      const fields = [...root.querySelectorAll('input[type=text],textarea,select')].filter(el => !el.closest('[hidden]'));
      const choices = [...root.querySelectorAll('input:is([type=radio],[type=checkbox]):not(.iui-segmented input,.iui-rating input)')];
      return {
        fields: fields.map(el => ({height: el.getBoundingClientRect().height, radius: getComputedStyle(el).borderRadius, font: getComputedStyle(el).fontSize, labels: el.labels.length})),
        choices: choices.map(el => ({width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height, appearance: getComputedStyle(el).appearance, labelHeight: el.labels[0].getBoundingClientRect().height})),
        radioColor: getComputedStyle(root.querySelector('.iui-choices:not(.iui-segmented) input:checked')).borderTopColor,
        checkboxColor: getComputedStyle(root.querySelector('.iui-toggle input:checked')).backgroundColor,
        ink: getComputedStyle(root).color,
        overflow: document.documentElement.scrollWidth > innerWidth + 1
      };
    });
    expect(metrics.fields.length).toBeGreaterThan(10);
    for (const field of metrics.fields) {
      expect(field.height).toBeGreaterThanOrEqual(44);
      expect(field.radius).toBe('8px');
      expect(field.font).toBe('16px');
      expect(field.labels).toBe(1);
    }
    for (const choice of metrics.choices) {
      expect(choice.width).toBe(18);
      expect(choice.height).toBe(18);
      expect(choice.appearance).toBe('none');
      expect(choice.labelHeight).toBeGreaterThanOrEqual(44);
    }
    expect(metrics.radioColor).toBe(metrics.ink);
    expect(metrics.checkboxColor).toBe(metrics.ink);
    expect(metrics.overflow).toBe(false);
    await expect(page.getByRole('textbox', {name: 'Draft title', exact: true})).toHaveAccessibleDescription('A local draft only.');
    await expect(page.getByRole('radio', {name: 'Unavailable choice', exact: true})).toBeDisabled();
    await expect(page.locator('.iui-rox [data-value=rox]')).toHaveText('9.5');
    await page.screenshot({path: `test-results/selection-controls-${theme}-${width}.png`, fullPage: true});
  });
}

test('native arrow, Space, labels, select keys, draft focus and reset remain intact', async ({page}) => {
  await setup(page);
  const first = page.getByRole('radio', {name: 'First choice', exact: true});
  const second = page.getByRole('radio', {name: 'Second choice', exact: true});
  await first.focus();
  await first.press('ArrowRight');
  await expect(second).toBeChecked();
  await expect(second).toBeFocused();
  await expect(second).toHaveCSS('outline-style', 'solid');
  await second.press('ArrowRight');
  await expect(first).toBeChecked();
  const check = page.getByRole('checkbox', {name: 'Accept this local choice', exact: true});
  await check.focus();
  await check.press('Space');
  await expect(check).toBeChecked();
  await expect(check).toHaveAccessibleDescription('Space toggles this choice.');
  await page.locator(`label[for="${await check.getAttribute('id')}"]`).click();
  await expect(check).not.toBeChecked();
  const select = page.getByRole('combobox', {name: 'Region filter', exact: true});
  await select.focus();
  await select.press('End');
  await expect(select).toHaveValue('1');
  await expect(select).toBeFocused();
  const draft = page.getByRole('textbox', {name: 'Draft title', exact: true});
  await draft.fill('Edited original draft');
  await draft.evaluate(el => { el.setSelectionRange(2, 8); window.savedSelectionDraft = el; });
  await page.evaluate(() => window.selectionController.setState({locked: true}));
  await expect(draft).toBeFocused();
  expect(await draft.evaluate(el => ({same: el === window.savedSelectionDraft, start: el.selectionStart, end: el.selectionEnd}))).toEqual({same: true, start: 2, end: 8});
  await expect(page.getByRole('checkbox', {name: 'Inherited checkbox', exact: true})).toBeDisabled();
  const roxRate = page.locator('.iui-rox [data-field=respiratoryRate]');
  await roxRate.fill('10');
  await expect(page.locator('.iui-rox [data-value=rox]')).toHaveText('19.0');
  await page.locator('.iui-rox [data-action=reset]').click();
  await expect(roxRate).toHaveValue('20');
  await expect(page.locator('.iui-rox [data-value=rox]')).toHaveText('9.5');
});

test('ROX invalid, disabled, and native picker presentation share a stable control box', async ({page}) => {
  await setup(page);
  const rate = page.locator('.iui-rox [data-field=respiratoryRate]');
  const unit = page.locator('.iui-rox [data-field=fio2Unit]');
  const before = await rate.boundingBox();
  await rate.fill('0');
  await expect(rate).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('.iui-rox [data-value=rox]')).toHaveCount(0);
  const after = await rate.boundingBox();
  expect(after.height).toBe(before.height);
  expect(after.width).toBe(before.width);
  await expect(unit).toHaveCSS('appearance', 'auto');
  await page.evaluate(() => document.querySelector('.iui-rox fieldset').disabled = true);
  await expect(rate).toBeDisabled();
  await expect(unit).toBeDisabled();
  await expect(rate).toHaveCSS('cursor', 'not-allowed');
  await expect(unit).toHaveCSS('cursor', 'not-allowed');
  await expect(rate).toHaveCSS('opacity', '1');
});

test('forced colors and RTL preserve native state, readable focus, and 44px labels', async ({page}) => {
  await page.emulateMedia({forcedColors: 'active', reducedMotion: 'reduce'});
  await page.setViewportSize({width: 390, height: 900});
  await setup(page, 'dark', 'rtl');
  const checked = page.getByRole('radio', {name: 'First choice', exact: true});
  await expect(checked).toHaveCSS('appearance', 'auto');
  await expect(checked).toBeChecked();
  await checked.focus();
  await expect(checked).toHaveCSS('outline-style', 'solid');
  const checkbox = page.getByRole('checkbox', {name: 'Keep local preference', exact: true});
  await expect(checkbox).toHaveCSS('appearance', 'auto');
  await checkbox.focus();
  await checkbox.press('Space');
  await expect(checkbox).not.toBeChecked();
  await checkbox.press('Space');
  await expect(checkbox).toBeChecked();
  expect(await checkbox.evaluate(el => getComputedStyle(el, '::after').display)).toBe('none');
  const labels = await page.locator(plainChoices).evaluateAll(inputs => inputs.map(el => el.labels[0].getBoundingClientRect().height));
  expect(labels.every(height => height >= 44)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({path: 'test-results/selection-controls-forced-colors-rtl.png', fullPage: true});
});

test('indeterminate checkbox, special presentations, and unrelated host fields stay independent', async ({page}) => {
  await setup(page);
  const check = page.getByRole('checkbox', {name: 'Accept this local choice', exact: true});
  await check.evaluate(el => el.indeterminate = true);
  expect(await check.evaluate(el => ({indeterminate: el.indeterminate, opacity: getComputedStyle(el, '::after').opacity, transform: getComputedStyle(el, '::after').transform}))).toEqual({indeterminate: true, opacity: '1', transform: 'none'});
  const pill = page.getByRole('radio', {name: 'Brief', exact: true});
  await expect(pill).toHaveCSS('opacity', '0');
  await pill.focus();
  await pill.press('ArrowRight');
  await expect(page.getByRole('radio', {name: 'Detailed', exact: true})).toBeChecked();
  await expect(page.locator('.iui-rating input').first()).toHaveCSS('appearance', 'auto');
  await expect(page.getByRole('slider', {name: 'Separate range presentation', exact: true})).toHaveCSS('height', '44px');
  const outside = await page.evaluate(() => {
    const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; document.body.append(checkbox);
    const textbox = document.createElement('input'); textbox.type = 'text'; document.body.append(textbox);
    const out = {choiceAppearance: getComputedStyle(checkbox).appearance, fieldHeight: textbox.getBoundingClientRect().height};
    checkbox.remove(); textbox.remove(); return out;
  });
  expect(outside.choiceAppearance).toBe('auto');
  expect(outside.fieldHeight).toBeLessThan(44);
  await page.evaluate(() => window.selectionController.dispose());
  await expect(page.locator('#host')).toBeEmpty();
});
