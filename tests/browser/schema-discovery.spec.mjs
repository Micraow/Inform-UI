import { test, expect } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { assertClosedReferences } from '../../scripts/schema-subsets.mjs';
const lock = JSON.parse(await readFile('cdn-lock.json', 'utf8'));
const base = new URL('.', lock.js).href;
const allowed = new Set([lock.js, lock.css, lock.schema, lock.schemaIndex]);
for (const name of Object.keys(lock.integrity)) if (name.endsWith('.woff2') || name.startsWith('schema/')) allowed.add(new URL(name, base).href);
for(const file of ['finance-preview','time'])allowed.add(new URL(`../../examples/${file}.json`,lock.schemaIndex).href);
test.use({ serviceWorkers: 'block' });

test('a file page discovers closed domain schemas and renders the same-version example using only the CDN API', async ({ page }) => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  const transport = [], requests = [], errors = [], assets = {}, pending = [];
  cdp.on('Network.responseReceived', ({ response: r }) => { if (allowed.has(r.url)) transport.push({ url: r.url, status: r.status, disk: r.fromDiskCache === true, worker: r.fromServiceWorker === true, mime: r.mimeType }); });
  page.on('request', r => requests.push(r.url())); page.on('pageerror', e => errors.push(e.message));
  page.on('requestfailed', r => errors.push(r.url() + ': ' + r.failure()?.errorText));
  await page.route('**/*', route => route.request().url().startsWith('file:') || allowed.has(route.request().url()) ? route.continue() : route.abort());
  page.on('response', r => { if (allowed.has(r.url())) pending.push((async () => { const bytes = await r.body(); assets[r.url()] = { sha256: createHash('sha256').update(bytes).digest('hex'), status: r.status(), headers: await r.allHeaders() }; })()); });
  await page.goto(pathToFileURL(resolve('examples/browser/cdn-minimal.html')).href);
  await expect(page.locator('#status')).toBeEmpty();
  const data = await page.evaluate(async indexURL => {
    const get = async url => { const response = await fetch(url, { cache: 'no-store' }); if (!response.ok) throw Error(`Schema fetch failed: ${response.status}`); return response.json(); };
    const index = await get(indexURL), finance = index.groups.find(group => group.id === 'finance');
    const schemas = {};
    for (const id of ['finance', 'forms', 'converters', 'time']) { const group = index.groups.find(group => group.id === id); schemas[id] = await get(new URL(group.documentSchema.path, indexURL)); }
    const node = await get(new URL(finance.nodeSchema.path, indexURL));
    const timeGroup=index.groups.find(group=>group.id==='time'),timeNode=await get(new URL(timeGroup.nodeSchema.path,indexURL)),timeExample=await get(new URL(timeGroup.examples[0].path,indexURL));
    const timeValid=IUI.validateDocument(timeExample);if(!timeValid.ok)throw Error(JSON.stringify(timeValid.issues));
    const timeHost=document.createElement('section');timeHost.id='schema-time-example';document.body.append(timeHost);IUI.mount(timeHost,timeValid.document,{styles:false});
    const example = await get(new URL(finance.examples[0].path, indexURL));
    const result = IUI.validateDocument(example);
    if (!result.ok) throw Error(JSON.stringify(result.issues));
    const host = document.createElement('section'); host.id = 'schema-example'; document.body.append(host);
    IUI.mount(host, result.document, { styles: false });
    return { index, schemas, node, timeNode, exampleVersion: example.version };
  }, lock.schemaIndex);
  expect(data.index.format).toBe('inform-ui-schema-index/1'); expect(data.index.schemaVersion).toBe('iui/1'); expect(Object.keys(data.index.nodeOwners)).toHaveLength(lock.nodeCount); expect(data.exampleVersion).toBe('iui/1');
  expect(data.index.groups.find(group => group.id === 'finance').includedGroups).toEqual(['base', 'finance']);
  expect(data.index.groups.find(group => group.id === 'time').includedGroups).toEqual(['base','time']);
  expect(data.index.groups.find(group => group.id === 'time').ownedNodeTypes).toEqual(['clock','stopwatch','timer']);
  expect(data.index.nodeOwners.tooltip).toBe('base');expect(data.index.nodeOwners.popover).toBe('base');
  for (const schema of [...Object.values(data.schemas), data.node, data.timeNode]) { assertClosedReferences(schema); expect(schema.$id).toContain(data.index.fullSchema.sha256); }
  expect(data.timeNode.$ref).toBe('#/$defs/Node');expect(data.timeNode.properties).toBeUndefined();
  await expect(page.locator('#schema-time-example .iui-time[data-kind=stopwatch]').first()).toHaveAttribute('data-status','ready');
  await expect(page.locator('#schema-time-example .iui-time[data-kind=timer]').first()).toHaveAttribute('data-status','ready');
  expect(data.node.$ref).toBe('#/$defs/Node'); expect(data.node.properties).toBeUndefined();
  await expect(page.locator('#schema-example .iui-finance-price').first()).toHaveText('112 USD');
  await expect(page.locator('#schema-example .iui-heatmap-tile')).toHaveCount(6);
  expect(await page.locator('#schema-example style').count()).toBe(0);
  await page.waitForLoadState('networkidle'); await Promise.all(pending);
  for (const url of [lock.js, lock.css, lock.schemaIndex, ...['finance', 'forms', 'converters', 'time'].map(id => new URL(data.index.groups.find(group => group.id === id).documentSchema.path, lock.schemaIndex).href)]) expect(assets[url]?.status).toBe(200);
  for (const [url, record] of Object.entries(assets)) {
    const name = new URL(url).pathname.split('/cdn/')[1]; if (!name || !lock.integrity[name]) continue;
    expect(record.sha256).toBe(lock.integrity[name].sha256); expect(record.status).toBe(200);
    expect(record.headers['access-control-allow-origin']).toBe('*');
    expect(transport.some(r => r.url === url && r.status === 200 && !r.disk && !r.worker)).toBe(true);
  }
  expect(errors).toEqual([]); expect(requests.filter(url => url.startsWith('http')).every(url => allowed.has(url))).toBe(true);
  await page.screenshot({ path: 'test-results/schema-discovery-cdn.png', fullPage: true });
  await writeFile('test-results/schema-discovery-cdn.json', JSON.stringify({ commit: lock.commit, transport, requests, assets, errors, selectedGroups: Object.keys(data.schemas) }, null, 2));
});
