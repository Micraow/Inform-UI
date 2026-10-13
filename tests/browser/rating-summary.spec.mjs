import {test, expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

// Prepared real-browser checks; run with the owner's integrated acceptance batch.
const fixture = JSON.parse(await readFile(new URL('../../examples/rating-summary.json', import.meta.url)));
async function setup(page, input = fixture, language = 'en', direction = 'auto') {
  await page.goto('/mount.html');
  await page.waitForFunction(() => !!window.iui);
  await page.evaluate(({input, language, direction}) => {
    const host = document.getElementById('host');
    host.lang = language;
    host.dir = direction;
    window.ratingSummaryController = window.iui.mount(host, input);
  }, {input, language, direction});
}

for (const colorScheme of ['light', 'dark']) for (const width of [320, 390, 768]) {
  test(`rating-summary stays read-only and single-row in ${colorScheme} at ${width}px`, async ({page}) => {
    const errors = [], external = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => {if (!request.url().startsWith('http://127.0.0.1:4173/')) external.push(request.url());});
    await page.setViewportSize({width, height: 700});
    await page.emulateMedia({colorScheme});
    await setup(page);
    const rows = page.locator('.iui-rating-summary');
    await expect(rows).toHaveCount(4);
    await expect(page.locator('.iui-rating-summary-star')).toHaveCount(4);
    await expect(rows.first()).toHaveText('4.8 (120 reviews)');
    await expect(rows.nth(2)).toHaveText('Not rated Review count unavailable');
    await expect(rows.last()).toHaveText('Rating unavailable');
    await expect(page.getByRole('link', {name: '4.6 out of 5 (28 reviews) Example reviews', exact: true})).toHaveAttribute('href', 'https://example.com/reviews');
    await expect(page.locator('input,button,output,[role=slider],[role=radio]')).toHaveCount(0);
    expect(await rows.evaluateAll(elements => elements.every(row => {
      const style = getComputedStyle(row), labels = [...row.querySelectorAll('bdi')];
      return style.whiteSpace === 'nowrap' && style.flexWrap === 'nowrap' && labels.every(label => Math.abs(label.getBoundingClientRect().top - labels[0].getBoundingClientRect().top) < 1);
    }))).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(external).toEqual([]);
    expect(errors).toEqual([]);
    await page.screenshot({path: `test-results/rating-summary-${colorScheme}-${width}.png`, fullPage: true});
  });
}

test('rating-summary native source anchor activates with Enter and normal same-tab navigation', async ({page}) => {
  await page.route('https://example.com/reviews', route => route.fulfill({contentType: 'text/html', body: '<h1>Test review destination</h1>'}));
  await setup(page);
  const link = page.getByRole('link', {name: '4.6 out of 5 (28 reviews) Example reviews', exact: true});
  await page.keyboard.press('Tab');
  await expect(link).toBeFocused();
  await expect(link).toHaveCSS('outline-style', 'solid');
  await expect(link).toHaveAttribute('rel', 'noreferrer');
  await expect(link).toHaveAttribute('referrerpolicy', 'no-referrer');
  await expect(link).not.toHaveAttribute('target', '_blank');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('https://example.com/reviews');
  await expect(page.getByRole('heading', {name: 'Test review destination'})).toBeVisible();
});

test('rating-summary click anywhere on the linked rating text follows one native source link', async ({page}) => {
  await setup(page);
  const clicks = await page.evaluate(() => {
    const link = document.querySelector('a.iui-rating-summary');
    let count = 0;
    link.addEventListener('click', event => {count++; event.preventDefault();});
    for (const part of link.querySelectorAll('svg,bdi')) part.dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true}));
    return {count, nodes: link.querySelectorAll('svg,bdi').length, state: window.ratingSummaryController.getState()};
  });
  expect(clicks.count).toBe(clicks.nodes);
  expect(clicks.state).toEqual({});
});

test('rating-summary genuinely RTL document keeps narrow isolated labels and full accessible names without overflow', async ({page}) => {
  const ratingLabel = 'تقييم مقدم من المصدر '.repeat(8), reviewCountLabel = 'عدد المراجعات غير معروف '.repeat(6), provider = {label: 'مصدر المراجعات '.repeat(10), url: 'https://example.com/reviews'};
  await page.setViewportSize({width: 320, height: 600});
  await page.emulateMedia({forcedColors: 'active', reducedMotion: 'reduce'});
  await setup(page, {version: 'iui/1', description: 'ملخص تقييم مقدم من المصدر، من دون تحقق عبر الإنترنت.', body: [{type: 'rating-summary', ratingLabel, reviewCountLabel, provider}]}, 'ar', 'rtl');
  await expect(page.locator('.iui-root')).toHaveCSS('direction', 'rtl');
  const row = page.locator('.iui-rating-summary');
  await expect(row).toHaveCSS('direction', 'rtl');
  await expect(row).toHaveCSS('white-space', 'nowrap');
  await expect(page.getByRole('link', {name: `${ratingLabel} ${reviewCountLabel} ${provider.label}`.replace(/\s+/g, ' ').trim(), exact: true})).toBeVisible();
  await expect(row.locator('.iui-rating-summary-rating')).toHaveAttribute('title', ratingLabel);
  await expect(row.locator('.iui-rating-summary-count')).toHaveAttribute('title', reviewCountLabel);
  await expect(row.locator('.iui-rating-summary-provider')).toHaveAttribute('title', provider.label);
  await expect(row.locator('bdi[dir=auto]')).toHaveCount(3);
  await row.focus();
  await expect(row).toHaveCSS('outline-style', 'solid');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await row.evaluate(element => [...element.querySelectorAll('bdi')].some(label => label.scrollWidth > label.clientWidth))).toBe(true);
  await page.screenshot({path: 'test-results/rating-summary-narrow-rtl-forced-colors.png', fullPage: true});
});
