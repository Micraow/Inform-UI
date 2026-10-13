import test, {after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {JSDOM, VirtualConsole} from 'jsdom';
import {embeddedJSON, exportShowcaseHTML} from '../scripts/export-showcase-html.mjs';

const directory = await mkdtemp(join(tmpdir(), 'inform-ui-standalone-'));
const outputPath = join(directory, 'showcase.html');
const result = await exportShowcaseHTML(outputPath);
const html = await readFile(outputPath, 'utf8');
const errors = [], fetches = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on('jsdomError', error => errors.push(error.message));
const dom = new JSDOM(html, {
  url: 'file:///tmp/inform-ui-showcase.html#rating-summary', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole,
  beforeParse(window) {
    // Keep JSON in the same realm as the browser runtime's intentionally strict validator.
    window.structuredClone = value => window.JSON.parse(window.JSON.stringify(value));
    window.TextEncoder = TextEncoder; window.TextDecoder = TextDecoder;
    window.matchMedia = () => ({matches: false, addEventListener() {}, removeEventListener() {}});
    window.fetch = async url => {fetches.push(url); throw Error('Unexpected offline request');};
    // JSDOM has no dialog top layer; native dialog/Escape behavior is browser-tested.
    window.HTMLDialogElement.prototype.showModal = function () {this.open = true;};
    window.HTMLDialogElement.prototype.close = function () {this.open = false; this.dispatchEvent(new window.Event('close'));};
  },
});
const doc = dom.window.document;
const catalog = JSON.parse(doc.getElementById('iui-standalone-catalog').textContent);
const gallery = JSON.parse(doc.getElementById('iui-standalone-gallery-document').textContent);
after(async () => {dom.window.close(); await rm(directory, {recursive: true, force: true});});

test('standalone exporter includes the complete current inventory, exact example JSON and compatibility boundary', async () => {
  const schema = JSON.parse(await readFile('src/schema/iui.schema.json', 'utf8'));
  const types = schema.$defs.Node.oneOf.map(ref => schema.$defs[ref.$ref.slice('#/$defs/'.length)].properties.type.const).sort();
  assert.deepEqual(catalog.entries.map(entry => entry.type).sort(), types);
  assert.equal(result.inventoryCount, types.length);
  assert.equal(result.renderableCount, types.length - 1);
  assert.equal(result.rejectedCount, 1);
  assert.equal(catalog.entries.filter(entry => entry.status === 'rejected')[0].type, 'native');
  assert.equal(doc.querySelectorAll('.component-link').length, types.length);
  assert.equal(doc.documentElement.dataset.ready, 'true');
  assert.equal(doc.getElementById('preview').dataset.status, 'mounted');
  assert.ok(doc.querySelector('.iui-rating-summary'));
  assert.deepEqual(JSON.parse(doc.getElementById('json-code').textContent), {...catalog.entries.find(entry => entry.type === 'rating-summary').document, theme: 'light'});
  assert.equal(result.bytes, Buffer.byteLength(html));
  assert.equal(result.sha256, createHash('sha256').update(html).digest('hex'));
});

test('standalone artifact embeds one runtime and no external script, stylesheet, catalog or font dependency', () => {
  assert.equal(doc.querySelectorAll('#iui-standalone-runtime').length, 1);
  assert.equal(doc.querySelectorAll('script[src],link[rel=stylesheet]').length, 0);
  assert.equal(doc.querySelectorAll('script[type=module]').length, 0);
  assert.doesNotMatch(doc.getElementById('iui-standalone-app').textContent, /catalog\.json|runtime\/iui\.min\.js/);
  const frame = doc.getElementById('standalone-gallery-frame');
  assert.equal(frame.getAttribute('src'), null);
  assert.equal(frame.getAttribute('srcdoc'), null);
  const policy = doc.querySelector('meta[http-equiv=Content-Security-Policy]').content;
  for (const directive of ["connect-src 'none'", "script-src 'unsafe-inline'", 'font-src data:', "default-src 'none'", "object-src 'none'", "form-action 'none'"]) assert.ok(policy.includes(directive));
  assert.deepEqual(fetches, []);
  assert.deepEqual(errors, []);
  const galleryDOM = new JSDOM(gallery);
  assert.equal(galleryDOM.window.document.querySelectorAll('script[src],link[rel=stylesheet],script[type=module]').length, 0);
  assert.match(gallery, /parent\.InformUIStandalone/);
  assert.doesNotMatch(gallery, /var InformUIStandalone\s*=/);
  galleryDOM.window.close();
});

test('standalone catalog and data embedding cannot break out of a script raw-text element', () => {
  const payload = {label: '</ScRiPt><img src=x onerror=alert(1)> & <script>bad()</script>', separators: '\u2028\u2029'};
  const encoded = embeddedJSON(payload);
  assert.doesNotMatch(encoded, /[<>&\u2028\u2029]/);
  assert.deepEqual(JSON.parse(encoded), payload);
  const parsed = new JSDOM(`<script id="data" type="application/json">${encoded}</script><p>Safe sibling</p>`);
  assert.equal(parsed.window.document.querySelectorAll('script').length, 1);
  assert.equal(parsed.window.document.querySelectorAll('img').length, 0);
  assert.deepEqual(JSON.parse(parsed.window.document.getElementById('data').textContent), payload);
  parsed.window.close();
});

test('standalone representative views preserve local interactions, exact JSON and rejected native status', () => {
  for (const type of ['rating', 'slider', 'native', 'rating-summary']) {
    // JSDOM restricts file: history.replaceState more than a real file-open browser.
    dom.reconfigure({url: 'file:///tmp/inform-ui-showcase.html#' + type});
    dom.window.dispatchEvent(new dom.window.HashChangeEvent('hashchange'));
    assert.equal(doc.getElementById('component-title').textContent, type);
    assert.equal(doc.getElementById('preview').dataset.status, type === 'native' ? 'rejected' : 'mounted');
    assert.deepEqual(JSON.parse(doc.getElementById('json-code').textContent), {...catalog.entries.find(entry => entry.type === type).document, theme: 'light'});
    if (type === 'rating') {
      const choice = doc.querySelector('.iui-rating input[value="3"]');
      choice.click();
      assert.equal(choice.checked, true);
      assert.match(doc.querySelector('.iui-rating-output').value, /3/);
    }
  }
  assert.deepEqual(fetches, []);
  assert.deepEqual(errors, []);
});

test('standalone Gallery is lazy, reopens cleanly and returns focus on close', () => {
  const trigger = doc.getElementById('open-standalone-gallery'), dialog = doc.getElementById('standalone-gallery'), frame = doc.getElementById('standalone-gallery-frame');
  for (let i = 0; i < 2; i++) {
    trigger.focus(); trigger.click();
    assert.equal(dialog.open, true);
    assert.equal(frame.srcdoc, gallery);
    assert.equal(doc.activeElement, doc.getElementById('close-standalone-gallery'));
    doc.getElementById('close-standalone-gallery').click();
    assert.equal(dialog.open, false);
    assert.equal(frame.getAttribute('srcdoc'), null);
    assert.equal(doc.activeElement, trigger);
  }
});

test('standalone Gallery shares the parent runtime but mounts every tile in its own ownerDocument', () => {
  const frame = doc.getElementById('standalone-gallery-frame'), child = frame.contentWindow;
  child.structuredClone = value => child.JSON.parse(child.JSON.stringify(value));
  child.TextEncoder = TextEncoder; child.TextDecoder = TextDecoder;
  child.Element.prototype.scrollTo = function () {};
  // JSDOM does not load srcdoc; writing that exact trusted document exercises its scripts.
  child.document.open(); child.document.write(gallery); child.document.close();
  assert.equal(child.document.documentElement.dataset.ready, 'true');
  assert.equal(child.document.querySelectorAll('.page').length, 3);
  const tiles = [...child.document.querySelectorAll('.tile')];
  assert.ok(tiles.length > 0);
  assert.ok(tiles.every(tile => tile.dataset.status === 'mounted'));
  assert.equal(child.document.getElementById('error').textContent, '');
  for (const root of child.document.querySelectorAll('.iui-root')) assert.equal(root.ownerDocument, child.document);
  assert.equal(child.InformUIStandalone, undefined);
  const control = child.document.querySelector('input[type=range]');
  assert.ok(control);
  control.value = String(Math.min(Number(control.max), Number(control.value) + Number(control.step || 1)));
  control.dispatchEvent(new child.Event('input', {bubbles: true}));
  assert.equal(child.document.documentElement.dataset.ready, 'true');
  assert.deepEqual(errors, []);
  child.dispatchEvent(new child.Event('pagehide'));
});

test('standalone licenses stay readable and rebuilding the same sources is deterministic', async () => {
  const notices = doc.querySelector('.standalone-notices').textContent;
  assert.match(notices, /MIT License/);
  assert.match(notices, /KaTeX/);
  assert.match(notices, /Ajv/);
  const repeat = await exportShowcaseHTML(join(directory, 'repeat.html'));
  assert.equal(repeat.sha256, result.sha256);
  assert.equal(await readFile(join(directory, 'repeat.html'), 'utf8'), html);
});


test('standalone icon catalog is complete and opens without a sibling-file request', () => {
  const trigger = doc.getElementById('open-standalone-icons'), dialog = doc.getElementById('standalone-icons'), frame = doc.getElementById('standalone-icons-frame');
  const source = JSON.parse(doc.getElementById('iui-standalone-icons-document').textContent);
  const embedded = new JSDOM(source);
  const icons = JSON.parse(embedded.window.document.getElementById('iui-icon-catalog').textContent);
  assert.equal(icons.iconCount, 755);assert.equal(icons.icons.length, 755);
  assert.equal(result.iconCount, 755);
  assert.equal(doc.querySelector('a[href="./icons.html"]'), null);
  trigger.focus();trigger.click();assert.equal(dialog.open, true);assert.equal(frame.srcdoc, source);
  doc.getElementById('close-standalone-icons').click();
  assert.equal(dialog.open, false);assert.equal(frame.getAttribute('srcdoc'), null);assert.equal(doc.activeElement, trigger);
  embedded.window.close();
});
