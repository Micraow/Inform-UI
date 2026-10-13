import { test, expect } from '@playwright/test';

const panes = '.preview-background, .code-scroll';
const selected = async (page, type) => {
  await expect(page.locator('#preview')).toHaveAttribute('data-component', type);
  await expect(page.locator('#preview')).toHaveAttribute('data-status', type === 'native' ? 'rejected' : 'mounted');
};
const ready = async (page, type) => {
  await page.goto(`/#${type}`);
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  await selected(page, type);
};
const expectAtStart = async page => {
  await expect.poll(() => page.locator(panes).evaluateAll(elements => elements.map(element => ({ top: element.scrollTop, left: element.scrollLeft })))).toEqual([
    { top: 0, left: 0 },
    { top: 0, left: 0 },
  ]);
};
const scrollToEnd = async page => {
  await page.locator(panes).evaluateAll(elements => {
    for (const element of elements) {
      element.scrollTop = element.scrollHeight;
      element.scrollLeft = element.scrollWidth;
    }
  });
  const offsets = await page.locator(panes).evaluateAll(elements => elements.map(element => element.scrollTop));
  for (const offset of offsets) expect(offset).toBeGreaterThan(0);
};
const previewBounds = page => page.locator('.preview-background').evaluate(pane => {
  const viewport = pane.getBoundingClientRect(), content = pane.firstElementChild.getBoundingClientRect();
  const style = getComputedStyle(pane);
  return {
    top: content.top - viewport.top,
    bottom: content.bottom - viewport.top,
    height: pane.clientHeight,
    scrollHeight: pane.scrollHeight,
    paddingTop: parseFloat(style.paddingTop),
    paddingBottom: parseFloat(style.paddingBottom),
    contentHeight: content.height,
  };
});

for (const width of [390, 1440]) {
  test(`tall previews have reachable beginnings and ends at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    for (const type of ['file-nav-list', 'restaurant-reviews']) {
      await ready(page, type);
      await expectAtStart(page);
      const start = await previewBounds(page);
      expect(start.scrollHeight, type).toBeGreaterThan(start.height);
      expect(start.top, `${type} must not overflow above the scroll origin`).toBeGreaterThanOrEqual(start.paddingTop - 1);
      const jsonStart = await page.locator('.code-scroll').evaluate(pane => {
        const range = document.createRange();
        range.setStart(document.querySelector('#json-code').firstChild, 0);
        range.setEnd(document.querySelector('#json-code').firstChild, 1);
        return range.getBoundingClientRect().top - pane.getBoundingClientRect().top;
      });
      expect(jsonStart).toBeGreaterThanOrEqual(0);
      await scrollToEnd(page);
      const end = await previewBounds(page);
      expect(end.bottom, `${type} must remain reachable at the bottom`).toBeLessThanOrEqual(end.height + 1);
    }
  });

  test(`switching, history and repeated resets restore both pane origins at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await ready(page, 'file-nav-list');
    await scrollToEnd(page);
    await page.locator('.component-link[data-type="restaurant-reviews"]').click();
    await selected(page, 'restaurant-reviews');
    await expectAtStart(page);

    await scrollToEnd(page);
    await page.goBack();
    await selected(page, 'file-nav-list');
    await expectAtStart(page);
    await scrollToEnd(page);
    await page.goForward();
    await selected(page, 'restaurant-reviews');
    await expectAtStart(page);

    for (let iteration = 0; iteration < 2; iteration++) {
      await scrollToEnd(page);
      await page.locator('#reset').click();
      await expectAtStart(page);
    }

    await scrollToEnd(page);
    await page.locator('.component-link[data-type="native"]').click();
    await selected(page, 'native');
    await expectAtStart(page);
    await page.locator('#reset').click();
    await expectAtStart(page);
  });

  test(`short previews retain their vertical centering at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await ready(page, 'text');
    const bounds = await previewBounds(page);
    expect(bounds.contentHeight).toBeLessThan(bounds.height - bounds.paddingTop - bounds.paddingBottom);
    expect(Math.abs(bounds.top - (bounds.height - bounds.contentHeight) / 2)).toBeLessThanOrEqual(1);
    await expectAtStart(page);
  });
}

test('JSON uses upright Consolas or Source Code Pro despite page typography', async ({ page }) => {
  await ready(page, 'file-nav-list');
  await page.locator('body').evaluate(element => element.classList.add('serif'));
  await page.addStyleTag({ content: '.serif { font-family: serif; font-style: italic; } .serif pre, .serif code, .serif span { font-family: serif; font-style: italic; }' });
  const fonts = await page.locator('.code-scroll pre, #json-code, #json-code span').evaluateAll(elements => elements.map(element => {
    const style = getComputedStyle(element);
    return { family: style.fontFamily, style: style.fontStyle };
  }));
  expect(fonts.length).toBeGreaterThan(2);
  for (const font of fonts) {
    expect(font.family).toContain('Consolas');
    expect(font.family).toContain('Source Code Pro');
    expect(font.style).toBe('normal');
  }
});
