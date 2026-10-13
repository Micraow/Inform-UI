import {test, expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

const example = JSON.parse(await readFile('showcase/examples/video.json', 'utf8'));
const frameSelector = '#preview iframe[title="Local video playback"]';
const childOf = page => page.frameLocator(frameSelector);

async function openVideo(page, path) {
  await page.goto(path + '#video');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('#preview')).toHaveAttribute('data-component', 'video');
  await expect(page.locator('#preview')).toHaveAttribute('data-status', 'mounted');
  await expect(page.locator(frameSelector)).toHaveAttribute('sandbox', 'allow-scripts');
  expect(JSON.parse(await page.locator('#json-code').textContent())).toEqual({...example, theme: 'light'});
  const video = childOf(page).locator('video');
  await expect.poll(() => video.evaluate(node => node.readyState)).toBeGreaterThanOrEqual(2);
  await expect.poll(() => video.evaluate(node => node.duration)).toBe(8);
  return video;
}

for (const path of ['/', '/standalone.html']) for (const width of [390, 1440]) {
  test(`native video actually plays, pauses, seeks and captions offline at ${width}px in ${path}`, async ({page, context}, testInfo) => {
    const external = [], errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => {if (!/^(http:\/\/127\.0\.0\.1:4176\/|data:|blob:|about:)/.test(request.url())) external.push(request.url());});
    await page.setViewportSize({width, height: 1100});
    const video = await openVideo(page, path), child = childOf(page);
    await context.setOffline(true);
    const meta = await video.evaluate(node => ({controls: node.controls, paused: node.paused, width: node.videoWidth, height: node.videoHeight, source: node.currentSrc, error: node.error}));
    expect(meta).toMatchObject({controls: true, paused: true, width: 320, height: 180, error: null});
    expect(meta.source).toMatch(/^data:video\/mp4;base64,/);
    // Exercise a real native player key activation, then verify decoded time moves.
    await video.focus(); await video.press('Space');
    await expect.poll(() => video.evaluate(node => !node.paused && node.currentTime > 0)).toBe(true);
    await expect(child.locator('#video-status')).toContainText('Playing');
    await video.press('Space');
    await expect.poll(() => video.evaluate(node => node.paused)).toBe(true);
    const pausedAt = await video.evaluate(node => node.currentTime);
    await page.waitForTimeout(200);
    expect(await video.evaluate(node => node.currentTime)).toBeCloseTo(pausedAt, 1);
    await video.evaluate(node => {node.currentTime = 4;});
    await expect.poll(() => video.evaluate(node => !node.seeking && Math.abs(node.currentTime - 4) < .05)).toBe(true);
    await expect.poll(() => child.locator('track').evaluate(node => node.readyState)).toBe(2);
    expect(await video.evaluate(node => Array.from(node.textTracks[0].cues, cue => cue.text))).toEqual([
      'A blue dot moves across three rising bars.',
      'The bars gently change height as the dot travels.',
      'The dot returns to its starting point.',
    ]);
    await video.evaluate(node => {node.textTracks[0].mode = 'showing';});
    await expect.poll(() => video.evaluate(node => Array.from(node.textTracks[0].activeCues ?? [], cue => cue.text))).toEqual(['The bars gently change height as the dot travels.']);
    await video.evaluate(node => {node.textTracks[0].mode = 'disabled';});
    expect(await video.evaluate(node => node.textTracks[0].mode)).toBe('disabled');
    await video.evaluate(node => {node.currentTime = 7.75; return node.play();});
    await expect.poll(() => video.evaluate(node => node.ended)).toBe(true);
    await expect(child.locator('#video-status')).toContainText('Finished');
    await page.locator('#reset').click();
    await expect.poll(() => child.locator('video').evaluate(node => node.readyState >= 2 && node.paused && node.currentTime === 0)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    expect(await child.locator('body').evaluate(node => node.scrollWidth <= innerWidth + 1)).toBe(true);
    expect(external).toEqual([]); expect(errors).toEqual([]); expect(await context.cookies()).toEqual([]);
    await page.locator('#preview').screenshot({path: testInfo.outputPath(`video-${width}-${path === '/' ? 'studio' : 'offline'}.png`)});
  });
}

test('video failure is explicit and reset restores playback without a provider request', async ({page, context}) => {
  const external = [];
  page.on('request', request => {if (!/^(http:\/\/127\.0\.0\.1:4176\/|data:|blob:|about:)/.test(request.url())) external.push(request.url());});
  const video = await openVideo(page, '/standalone.html'), child = childOf(page);
  await context.setOffline(true);
  await video.evaluate(node => {node.querySelector('source').src = 'data:video/mp4;base64,AA=='; node.load();});
  await expect(child.locator('#video-error')).toBeVisible();
  await expect(child.locator('#video-status')).toHaveText('Video unavailable');
  await child.locator('summary').click(); await expect(child.locator('details p')).toBeVisible();
  await page.locator('#reset').click();
  const replacement = child.locator('video');
  await expect.poll(() => replacement.evaluate(node => node.readyState >= 2 && node.error === null)).toBe(true);
  await expect(child.locator('#video-error')).toBeHidden();
  await replacement.evaluate(node => node.play());
  await expect.poll(() => replacement.evaluate(node => !node.paused && node.currentTime > 0)).toBe(true);
  await page.evaluate(() => {location.hash = 'youtube';});
  await expect(page.locator(frameSelector)).toHaveCount(0);
  await expect(page.locator('#preview')).toHaveAttribute('data-component', 'youtube');
  await page.evaluate(() => {location.hash = 'video';});
  await expect.poll(() => childOf(page).locator('video').evaluate(node => node.readyState >= 2 && node.paused && node.currentTime === 0)).toBe(true);
  expect(external).toEqual([]);
});
