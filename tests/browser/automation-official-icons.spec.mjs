import {test, expect} from '@playwright/test';

const plan = {type: 'automation-plan-summary', id: 'plan', label: 'Supplied plan', title: 'Prepare a field guide', goalLabel: 'Your plan', showPlanLabel: 'Show plan', hidePlanLabel: 'Hide plan', showCompletedLabel: 'Show completed steps', statusLabels: {completed: 'Completed', in_progress: 'In progress', pending: 'Pending'}, steps: [{id: 'topic', title: 'Select a topic', status: 'completed'}, {id: 'notes', title: 'Gather notes', status: 'completed'}, {id: 'draft', title: 'Draft the guide', status: 'in_progress'}, {id: 'review', title: 'Review the draft', status: 'pending'}]};
async function setup(page, patch = {}) {
  await page.goto('/mount.html');
  await page.waitForFunction(() => !!window.iui);
  await page.evaluate(node => {
    const host = document.getElementById('host'), form = document.createElement('form'); host.before(form); form.append(host);
    window.automationIconEvents = [];
    host.addEventListener('iui:automation-toggle', event => window.automationIconEvents.push(event.detail));
    window.automationIconController = window.iui.mount(host, {version: 'iui/1', body: [node]});
  }, {...plan, ...patch});
}

test('real pointer activation on a status marker leaves steps unchanged while the completed disclosure works', async ({page}) => {
  await page.setViewportSize({width: 390, height: 800});
  await setup(page);
  const root = page.locator('.iui-automation-plan-summary'), active = root.locator('.iui-automation-step[data-status=in_progress]'), pending = root.locator('.iui-automation-step[data-status=pending]');
  await expect(root.locator('input,[role=radio],[role=checkbox]')).toHaveCount(0);
  await expect(active.locator('.iui-automation-step-status')).toHaveText('In progress');
  await expect(pending.locator('.iui-automation-step-status')).toHaveText('Pending');
  await expect(active.locator('.iui-automation-marker')).toHaveAttribute('role', 'img');
  await expect(active.locator('.iui-automation-marker')).toHaveCSS('cursor', 'default');
  const before = await root.locator('.iui-automation-step').evaluateAll(rows => rows.map(row => ({status: row.dataset.status, hidden: row.hidden, title: row.querySelector('.iui-automation-step-title').textContent})));
  await active.locator('.iui-automation-marker').click();
  await pending.locator('.iui-automation-marker').click();
  expect(await page.evaluate(() => window.automationIconEvents)).toEqual([]);
  expect(await root.locator('.iui-automation-step').evaluateAll(rows => rows.map(row => ({status: row.dataset.status, hidden: row.hidden, title: row.querySelector('.iui-automation-step-title').textContent})))).toEqual(before);
  const completed = page.getByRole('button', {name: 'Show completed steps'});
  await completed.click();
  await expect(completed).toHaveAttribute('aria-expanded', 'true');
  await expect(root.locator('.iui-automation-step:visible')).toHaveCount(4);
  await expect(root.locator('[data-iui-icon=CheckCircleFilled]')).toHaveCount(2);
  await expect(root.locator('[data-iui-icon=EmptyCircle]')).toHaveCount(1);
  await expect(root.locator('[data-iui-icon=RadioSelected],[data-iui-icon=Spin]')).toHaveCount(0);
  await page.screenshot({path: 'test-results/automation-official-status-markers.png', fullPage: true});
});

test('native Enter and Space operate the actual disclosure buttons and cancellation/reset remain intact', async ({page}) => {
  await setup(page);
  const toggle = page.locator('.iui-automation-plan-toggle'), completed = page.locator('.iui-automation-completed'), body = page.locator('.iui-automation-plan-body');
  await toggle.focus(); await page.keyboard.press('Enter'); await expect(body).toBeHidden();
  await page.keyboard.press('Space'); await expect(body).toBeVisible();
  await completed.focus(); await page.keyboard.press('Space'); await expect(completed).toHaveAttribute('aria-expanded', 'true');
  await page.evaluate(() => document.getElementById('host').addEventListener('iui:automation-toggle', event => event.preventDefault(), {once: true}));
  await completed.click(); await expect(completed).toHaveAttribute('aria-expanded', 'true');
  await page.evaluate(() => document.querySelector('form').reset());
  await expect(completed).toHaveAttribute('aria-expanded', 'false'); await expect(body).toBeVisible();
  const tabbableMarkers = await page.locator('.iui-automation-marker').evaluateAll(markers => markers.some(marker => marker.tabIndex >= 0 || marker.querySelector('[tabindex],button,input')));
  expect(tabbableMarkers).toBe(false);
});

for (const {width, colorScheme, layout, column, gap, rowHeight} of [
  {width: 320, colorScheme: 'light', layout: 'chat', column: 28, gap: 4, rowHeight: 50},
  {width: 768, colorScheme: 'dark', layout: 'library', column: 24, gap: 16, rowHeight: 56}
]) test(`official status glyphs align in ${layout} at ${width}px`, async ({page}) => {
  await page.setViewportSize({width, height: 850}); await page.emulateMedia({colorScheme, reducedMotion: 'reduce'});
  await setup(page, {layout, completedExpanded: true});
  const metrics = await page.locator('.iui-automation-step').evaluateAll(rows => rows.map(row => {
    const marker = row.querySelector('.iui-automation-marker'), glyph = row.querySelector('.iui-automation-marker-glyph'), graphic = glyph.querySelector('svg,.iui-automation-status-spinner'), copy = row.querySelector('.iui-automation-step-copy');
    const m = marker.getBoundingClientRect(), g = glyph.getBoundingClientRect(), p = graphic.getBoundingClientRect(), c = copy.getBoundingClientRect();
    return {width: m.width, gap: c.left - m.right, minimum: parseFloat(getComputedStyle(row).minHeight), last: row.dataset.last === 'true', status: row.dataset.status, glyphHeight: g.height, graphicWidth: p.width, graphicHeight: p.height, centered: Math.abs(p.left + p.width / 2 - (m.left + m.width / 2)) < .6};
  }));
  for (const metric of metrics) {
    expect(metric.width).toBe(column); expect(metric.gap).toBeCloseTo(gap, 0); expect(metric.graphicWidth).toBe(20); expect(metric.graphicHeight).toBe(20); expect(metric.centered).toBe(true);
    expect(metric.glyphHeight).toBe(metric.status === 'in_progress' ? 28 : 20);
    expect(metric.minimum).toBe(layout === 'chat' && metric.last ? 20 : rowHeight);
  }
  await expect(page.locator('.iui-automation-status-spinner')).toHaveCSS('animation-name', 'none');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (layout === 'library') await expect(page.locator('.iui-automation-marker-connector')).toHaveCount(0);
  else await expect(page.locator('.iui-automation-step[data-last=true] .iui-automation-marker-connector')).toHaveCount(0);
});

test('official loading indicator remains visible with reduced motion and forced colors', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'reduce', forcedColors: 'active'}); await setup(page);
  const spinner = page.locator('.iui-automation-status-spinner');
  await expect(spinner).toHaveCSS('animation-name', 'none');
  await expect(spinner).toBeVisible();
  const styling = await spinner.evaluate(el => {const s = getComputedStyle(el, '::before'); return {mask: s.maskImage, border: s.borderTopStyle};});
  expect(styling.mask).toBe('none'); expect(styling.border).toBe('solid');
  await expect(page.locator('.iui-automation-step[data-status=in_progress] .iui-automation-step-status')).toHaveText('In progress');
});

for (const width of [320, 1440]) test(`completed disclosure keeps clear separation from the first visible step at ${width}px`, async ({page}) => {
  await page.setViewportSize({width, height: 850});
  await setup(page);
  const completed = page.locator('.iui-automation-completed');
  for (const expanded of [false, true]) {
    if (expanded) await completed.click();
    const gap = await page.locator('.iui-automation-plan-summary').evaluate(root => {
      const button = root.querySelector('.iui-automation-completed');
      const first = [...root.querySelectorAll('.iui-automation-step')].find(row => !row.hidden);
      return first.getBoundingClientRect().top - button.getBoundingClientRect().bottom;
    });
    expect(gap).toBeGreaterThanOrEqual(12);
    await expect(page.locator('.iui-automation-step[data-status=in_progress] .iui-automation-step-copy')).toHaveCSS('column-gap', '12px');
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
