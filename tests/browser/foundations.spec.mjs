import { test, expect } from '@playwright/test';
for (const theme of ['light', 'dark']) for (const width of [390, 768, 1100]) {
  test(`foundations ${theme} ${width}: inline semantics, responsive spans and keyboard updates`, async ({ page }) => {
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width, height: 950 }); await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    await page.goto('/foundations.html');
    const root = page.locator('.iui-root'), grid = root.locator('.iui-grid'), first = grid.locator('.iui-grid-item').first();
    await expect(root.locator('.iui-text').first().locator('strong').last()).toHaveText('75');
    const slider = root.getByRole('slider', { name: /合成命中数/ }); await slider.focus(); await page.keyboard.press('ArrowRight');
    await expect(slider).toBeFocused(); await expect(root.locator('.iui-text').first().locator('strong').last()).toHaveText('76');
    await expect(root.locator('.iui-inline-code').first()).toHaveText('cache_hit');
    await expect(root.locator('blockquote')).toContainText('本项目原创写作示例');
    const marks = await root.locator('.iui-text').first().evaluate(node => ({ italic: getComputedStyle(node.querySelector('em')).fontStyle, underline: getComputedStyle(node.querySelector('u')).textDecorationLine, code: getComputedStyle(node.querySelector('code')).fontFamily }));
    expect(marks.italic).toBe('italic'); expect(marks.underline).toContain('underline'); expect(marks.code).toMatch(/monospace/);
    const geometry = await grid.evaluate(node => { const first = node.querySelector('.iui-grid-item'); return { grid: node.getBoundingClientRect().width, item: first.getBoundingClientRect().width, columns: getComputedStyle(node).gridTemplateColumns.split(' ').length, row: getComputedStyle(first).gridRowStart, gap: parseFloat(getComputedStyle(node).columnGap) }; });
    expect(geometry.columns).toBe(width === 390 ? 2 : 3);
    expect(Math.abs(geometry.item - (width === 390 ? geometry.grid : (geometry.grid - 2 * geometry.gap) * 2 / 3 + geometry.gap))).toBeLessThan(1);
    expect(geometry.row).toBe(width === 390 ? 'auto' : 'span 2');
    const shimmer = root.locator('.iui-text-shimmer'); expect(await shimmer.evaluate(node => getComputedStyle(node, '::after').animationName)).toBe('none');
    await page.emulateMedia({ reducedMotion: 'no-preference', colorScheme: theme }); expect(await shimmer.evaluate(node => getComputedStyle(node, '::after').animationName)).toBe('iui-text-shimmer');
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: theme });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/foundations-${theme}-${width}.png`, fullPage: true });
    const link = root.getByRole('link', { name: 'HTML 表格规范' }); await link.focus(); await expect(link).toBeFocused(); expect(await link.evaluate(node => getComputedStyle(node).outlineStyle)).toBe('solid');
    expect(errors).toEqual([]);
  });
}
