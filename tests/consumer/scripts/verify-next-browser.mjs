/** Prepared original browser regression; run only in an authorized browser environment. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdtemp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function argument(flag) { const at = process.argv.indexOf(flag); if (at < 0) return; const result = process.argv[at + 1]; assert.ok(result && !result.startsWith('--'), `${flag} needs a value`); return result; }
const library = path.resolve(argument('--library') ?? ''), revision = argument('--revision');
assert.match(revision ?? '', /^[0-9a-f]{40}$/, 'Require a frozen --library PATH --revision SHA; no browser defaults');
const frozen = spawnSync('git', ['-C', library, 'rev-parse', 'HEAD'], { encoding: 'utf8' });
assert.equal(frozen.status, 0, frozen.stderr); assert.equal(frozen.stdout.trim(), revision, 'Browser checkout must match the explicitly supplied frozen SHA');
const require = createRequire(path.join(library, 'package.json')), { chromium, expect } = require('@playwright/test');
const pkg = JSON.parse(await readFile(path.join(library, 'package.json'), 'utf8'));
const { validateDocument, compileHtml } = await import(pathToFileURL(path.resolve(library, pkg.exports['.'].import)).href);
const names = ['foundation-explainer', 'local-time', 'local-overlays', 'local-number-draft', 'timed-local-practice', 'local-status-primitives', 'primitives-with-form-and-time'];
const screenshots = path.resolve(argument('--screenshots') ?? path.join(root, 'artifacts/next-guidance'));
await mkdir(screenshots, { recursive: true });
const temporary = await mkdtemp(path.join(tmpdir(), 'inform-next-guidance-'));
let browser, count = 0;
try {
 browser = await chromium.launch({ headless: true, ...(process.env.IUI_BROWSER_EXECUTABLE ? { executablePath: process.env.IUI_BROWSER_EXECUTABLE } : {}) });
 for (const name of names) for (const theme of ['light', 'dark']) for (const width of [390, 768, 1100]) {
  const document = JSON.parse(await readFile(path.join(root, 'examples', name + '.json'), 'utf8'));
  const valid = validateDocument(document); assert.equal(valid.ok, true, `${name}: ${JSON.stringify(valid.issues)}`);
  const label = `${name}-${theme}-${width}`, output = path.join(temporary, label + '.html');
  await writeFile(output, await compileHtml({ ...document, theme }, { backend: 'portable', assets: 'inline', lang: 'zh-CN' }));
  const page = await browser.newPage({ viewport: { width, height: 950 }, colorScheme: theme, reducedMotion: 'reduce' });
  const errors = [], external = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (/^https?:/.test(request.url())) external.push(request.url()); });
  await page.clock.install({ time: new Date('2026-10-09T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-10-09T00:00:01Z'));
  await page.goto(pathToFileURL(output).href); await page.waitForSelector('.iui-root');
  const time = kind => page.locator(`.iui-time[data-kind="${kind}"]`), action = (node, which) => node.locator(`[data-time-action="${which}"]`);
  if (name === 'local-time') {
   await expect(time('clock').first().locator('.iui-time-digits')).toHaveText('08:00');
   const stopwatch = time('stopwatch'), timer = time('timer');
   await expect(stopwatch).toHaveAttribute('data-status', 'ready'); await expect(timer).toHaveAttribute('data-status', 'ready');
   await action(stopwatch, 'start').focus(); await page.keyboard.press('Enter'); await page.clock.runFor(250);
   await expect(stopwatch.locator('.iui-time-digits')).toHaveAttribute('data-milliseconds', '250');
   await expect(action(stopwatch, 'pause')).toBeFocused(); await page.keyboard.press('Space');
   await expect(stopwatch).toHaveAttribute('data-status', 'paused');
   await action(timer, 'start').click(); await page.clock.fastForward(120000);
   await expect(timer).toHaveAttribute('data-status', 'complete'); await expect(timer.getByRole('status')).toHaveText('倒计时结束。');
   await action(timer, 'reset').click(); await expect(timer.locator('.iui-time-digits')).toHaveAttribute('data-milliseconds', '120000');
   await expect(time('clock').first().locator('.iui-time-digits')).toHaveText('08:00');
  }
  if (name === 'local-overlays') {
   const trigger = page.getByRole('button', { name: '展开补充说明', exact: true });
   await trigger.focus(); await page.keyboard.press('Enter');
   const outer = page.getByRole('dialog', { name: '局部查看，随时返回', exact: true });
   await expect(outer).toBeVisible(); await expect(outer.locator(':scope > .iui-popover-header .iui-overlay-close')).toBeFocused();
   await page.getByRole('button', { name: '查看嵌套面板的规则', exact: true }).click();
   const inner = page.getByRole('dialog', { name: '一步关闭一层', exact: true }); await expect(inner).toBeVisible();
   await page.keyboard.press('Escape'); await expect(inner).toBeHidden(); await expect(outer).toBeVisible();
   await page.keyboard.press('Escape'); await expect(outer).toBeHidden(); await expect(trigger).toBeFocused();
   await page.getByRole('button', { name: '什么是合成示例？', exact: true }).focus();
   await expect(page.getByRole('tooltip')).toBeVisible(); await page.keyboard.press('Escape'); await expect(page.getByRole('tooltip')).toBeHidden();
  }
  if (name === 'local-number-draft') {
   const trigger = page.getByRole('button', { name: '编辑本地试算输入', exact: true });
   await trigger.click(); const input = page.getByLabel('偶数样本数', { exact: false });
   await input.fill('3'); await page.getByRole('button', { name: '检查输入', exact: true }).click();
   await expect(input).toHaveAttribute('aria-invalid', 'true');
   await expect(page.locator('[data-iui=metric] .iui-metric-value > span:first-child')).toHaveText('6');
   await page.keyboard.press('Escape');
   await page.getByRole('button', { name: '明确写回6（也覆盖同值数字草稿）', exact: true }).click();
   await trigger.click(); await expect(input).toHaveValue('6'); await expect(input).toHaveAttribute('aria-invalid', 'false');
   await input.fill(''); await page.getByRole('button', { name: '恢复表单初值', exact: true }).click();
   await expect(input).toHaveValue('6'); await expect(input).toHaveAttribute('aria-invalid', 'false');
  }
  if (name === 'timed-local-practice') {
   const timer = time('timer'); await action(timer, 'start').click(); await page.clock.runFor(250);
   await page.getByLabel('组数', { exact: false }).fill('4'); await expect(page.locator('[data-iui=metric] .iui-metric-value > span:first-child')).toHaveText('32');
   await page.getByRole('button', { name: '恢复计划输入初值', exact: true }).click();
   await expect(page.locator('[data-iui=metric] .iui-metric-value > span:first-child')).toHaveText('24');
   await expect(timer).toHaveAttribute('data-status', 'running');
   await page.clock.runFor(250); await expect(timer.locator('.iui-time-digits')).toHaveAttribute('data-milliseconds', '119500');
   await action(timer, 'pause').click();
  }
  if (name === 'foundation-explainer') {
   await expect(page.locator('blockquote')).toHaveCount(1);
   await expect(page.locator('table tbody th[scope=rowgroup]')).toHaveText('第一批');
   await expect(page.locator('table thead tr')).toHaveCount(2);
   await expect(page.locator('table tbody tr').first()).toContainText('0');
   const positions = await page.locator('.iui-grid-item').evaluateAll(nodes => nodes.map(node => { const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width }; }));
   if (width === 390) assert.ok(positions[1].y > positions[0].y, 'Narrow grid must retain reading order');
  }
  if (name === 'local-status-primitives') {
   const flows = page.locator('.iui-flow'); await expect(flows).toHaveCount(2);
   assert.deepEqual(await flows.first().evaluate(node => [...node.children].map(child => child.dataset.iui)), ['icon', 'text']);
   await expect(flows.first().locator('.iui-icon')).toHaveAttribute('aria-hidden', 'true');
   const named = page.getByRole('img', { name: '静态时钟图案', exact: true }); await expect(named).toHaveAttribute('focusable', 'false');
   assert.equal(await named.getAttribute('tabindex'), null); assert.equal(Math.round((await named.boundingBox()).width), 24);
   const pulses = page.locator('.iui-pulse-indicator'); await expect(pulses).toHaveCount(3);
   assert.deepEqual(await pulses.locator('.iui-pulse-status').allTextContents(), ['空闲', '忙碌', '成功']);
   assert.equal(await pulses.locator('[aria-live], [role=status]').count(), 0);
   const busy = page.locator('.iui-pulse-indicator[data-status=busy]');
   assert.equal(await busy.locator('.iui-pulse-dot').evaluate(node => getComputedStyle(node).animationName), 'none');
   await page.clock.fastForward(5000); await expect(busy).toHaveAttribute('data-status', 'busy');
  }
  if (name === 'primitives-with-form-and-time') {
   const input = page.getByLabel('组数', { exact: true }); await input.fill('4');
   await expect(page.locator('[data-iui=metric] .iui-metric-value > span:first-child')).toHaveText('4');
   const timer = time('timer'); await action(timer, 'start').click(); await page.clock.runFor(250);
   await input.fill('9'); await page.getByRole('button', { name: '检查计划', exact: true }).click();
   await expect(input).toHaveAttribute('aria-invalid', 'true');
   await expect(page.locator('[data-iui=metric] .iui-metric-value > span:first-child')).toHaveText('4');
   await page.getByRole('button', { name: '恢复计划', exact: true }).click(); await expect(input).toHaveValue('3');
   await expect(timer).toHaveAttribute('data-status', 'running');
   await page.clock.runFor(250); await expect(timer.locator('.iui-time-digits')).toHaveAttribute('data-milliseconds', '119500');
   await expect(page.locator('.iui-pulse-indicator')).toHaveAttribute('data-status', 'idle');
   await action(timer, 'pause').click();
   await page.getByRole('button', { name: '为什么状态点不自动改变？', exact: true }).click();
   const panel = page.getByRole('dialog', { name: '不同层次的状态', exact: true }); await expect(panel).toBeVisible();
   await expect(panel.locator('.iui-flow > .iui-icon')).toHaveAttribute('aria-hidden', 'true');
   await page.keyboard.press('Escape'); await expect(panel).toBeHidden();
  }
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${label}: page-wide overflow`);
  assert.deepEqual(errors, [], `${label}: browser errors`); assert.deepEqual(external, [], `${label}: unsolicited network requests`);
  await page.screenshot({ path: path.join(screenshots, label + '.png'), fullPage: true });
  await page.close(); count++; console.log(`PASS ${label}`);
 }
 await writeFile(path.join(screenshots, 'RESULTS.json'), JSON.stringify({ revision,exampleLanguages:{"foundation-explainer":"zh-CN","local-time":"zh-CN","local-overlays":"zh-CN","local-number-draft":"zh-CN","timed-local-practice":"zh-CN","local-status-primitives":"zh-CN","primitives-with-form-and-time":"zh-CN"}, localCompiledViews: count, widths: [390, 768, 1100], themes: ['light', 'dark'], browser: 'chromium', publicCdn: 'not-run', screenReader: 'not-run', screenshotReview: 'pending-human-review' }, null, 2) + '\n');
 console.log(`PASS ${count} local-compiled Chromium views. Public CDN and manual screenshot/assistive-technology review are separate.`);
} finally { await browser?.close(); await rm(temporary, { recursive: true, force: true }); }
