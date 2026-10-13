import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { JSDOM, VirtualConsole } from 'jsdom';
import { transform } from 'esbuild';
import { exportIconShowcaseHTML, embeddedJSON, inlineScript } from '../scripts/build-icon-showcase.mjs';

const catalog = JSON.parse(await readFile('src/icons/catalog.json', 'utf8'));
const directory = await mkdtemp(join(tmpdir(), 'inform-icon-showcase-'));
const output = join(directory, 'icons.html');
const result = await exportIconShowcaseHTML(output);
const html = await readFile(output, 'utf8');
test.after(() => rm(directory, { recursive: true, force: true }));
function openShowcase() {
  const downloads = [], clipboard = [], errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => errors.push(error.message));
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', url: 'https://local.example/icons.html', virtualConsole,
    beforeParse(window) {
      window.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
      window.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); this.dispatchEvent(new window.Event('close')); };
      window.URL.createObjectURL = blob => { downloads.push(blob); return `blob:icon-download-${downloads.length}`; };
      window.URL.revokeObjectURL = () => {};
      window.HTMLAnchorElement.prototype.click = function () { downloads.at(-1).filename = this.download; };
      Object.defineProperty(window.navigator, 'clipboard', { configurable: true, value: { writeText: async text => { clipboard.push(text); } } });
    },
  });
  const { window } = dom, document = window.document;
  const query = value => { const input = document.getElementById('icon-search'); input.value = value; input.dispatchEvent(new window.Event('input', { bubbles: true })); };
  const category = value => { const input = document.getElementById('icon-category'); input.value = value; input.dispatchEvent(new window.Event('change', { bubbles: true })); };
  const card = name => document.querySelector(`.icon-card[data-icon="${name}"]`);
  return { dom, window, document, downloads, clipboard, errors, query, category, card };
}
const readBlob = (window, blob) => new Promise((resolve, reject) => { const reader = new window.FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsText(blob); });
const checkClips = document => {
  const ids = [...document.querySelectorAll('[id]')].map(node => node.id);
  assert.equal(new Set(ids).size, ids.length, 'every generated local clip ID is unique');
  for (const node of document.querySelectorAll('[clip-path]')) {
    const ref = /^url\(#([^)]+)\)$/.exec(node.getAttribute('clip-path'));
    assert.ok(ref);
    const target = document.getElementById(ref[1]);
    assert.equal(target?.tagName, 'clipPath');
    assert.equal(target.closest('svg'), node.closest('svg'), 'clip references stay inside their owning SVG');
  }
};

test('standalone build is deterministic, self-contained, licensed, escaped and independent from schema nodes', async () => {
  assert.equal(result.iconCount, 755); assert.equal(result.categoryCount, 16); assert.equal(result.aliasCount, 71);
  assert.equal(result.bytes, Buffer.byteLength(html));
  assert.equal(result.sha256, createHash('sha256').update(html).digest('hex'));
  assert.equal((await exportIconShowcaseHTML(join(directory, 'again.html'))).sha256, result.sha256);
  const document = new JSDOM(html).window.document;
  assert.equal(document.querySelectorAll('script[src],link[rel=stylesheet],iframe,object,img,audio,video').length, 0);
  assert.ok(document.querySelector('meta[http-equiv="Content-Security-Policy"]').content.includes("connect-src 'none'"));
  assert.deepEqual(JSON.parse(document.getElementById('iui-icon-catalog').textContent), catalog);
  assert.equal(JSON.parse(document.getElementById('iui-icon-manifest').textContent).offline, true);
  assert.ok(document.getElementById('license-text').textContent.includes(await readFile('src/icons/LICENSE', 'utf8')));
  assert.ok(document.getElementById('license-text').textContent.includes(await readFile('LICENSE', 'utf8')));
  assert.match(document.body.textContent, /independent of the 219 schema nodes/);
  assert.match(document.body.textContent, /Migration of existing component icons is not yet complete/);
  const unsafe = '</script><script>bad()</script>&\u2028';
  assert.equal(embeddedJSON(unsafe).includes('<'), false);
  assert.equal(JSON.parse(embeddedJSON(unsafe)), unsafe);
  assert.equal(/<\/script/i.test(inlineScript('"</ScRiPt>"')), false);
  const css = await readFile('showcase/icons.css', 'utf8');
  assert.deepEqual((await transform(css, { loader: 'css' })).warnings, []);
  assert.equal(/\b(?:fill|stroke)\s*:/i.test(css), false, 'CSS must not replace official artwork colors');
});

test('all 755 canonical icons render with original viewBoxes, decorative semantics, colors and unique local clips', () => {
  const app = openShowcase();
  try {
    assert.equal(app.document.documentElement.dataset.ready, 'true');
    assert.equal(app.document.querySelectorAll('#icon-grid .icon-card').length, 755);
    assert.equal(app.document.querySelectorAll('#icon-grid svg').length, 755);
    assert.equal(catalog.categories.reduce((sum, category) => sum + category.count, 0), 755);
    for (const icon of catalog.icons) {
      const card = app.card(icon.name), svg = card.querySelector('svg');
      assert.equal(card.querySelector('.icon-name').textContent, icon.name);
      assert.equal(svg.getAttribute('data-iui-icon'), icon.name);
      assert.equal(svg.getAttribute('viewBox'), icon.viewBox, icon.name);
      assert.equal(svg.getAttribute('aria-hidden'), 'true');
      assert.equal(svg.getAttribute('focusable'), 'false');
      assert.equal(svg.hasAttribute('role'), false);
      assert.ok(svg.childElementCount > 0, icon.name);
    }
    assert.equal(catalog.icons.filter(icon => icon.viewBox !== '0 0 24 24').length, 25);
    assert.equal(app.document.querySelectorAll('#icon-grid clipPath').length, 5);
    assert.ok(app.card('Jira').querySelector('svg [fill^="#"]'));
    checkClips(app.document);
    assert.deepEqual(app.errors, []);
  } finally { app.window.close(); }
});

test('every canonical name, alias, keyword and category is discoverable without fallback', () => {
  const app = openShowcase();
  try {
    for (const icon of catalog.icons) {
      app.query(icon.name);
      assert.equal(app.card(icon.name).parentElement.hidden, false, icon.name);
    }
    for (const alias of catalog.aliases) {
      app.query(alias.alias.toUpperCase());
      assert.equal(app.card(alias.name).parentElement.hidden, false, alias.alias);
    }
    app.query('curved right'); assert.equal(app.card('ArrowCurvedRight').parentElement.hidden, false);
    app.query('ARROWS and navigation'); assert.equal(app.card('ArrowRight').parentElement.hidden, false);
    app.query('');
    for (const category of catalog.categories) {
      app.category(category.id);
      const visible = [...app.document.querySelectorAll('#icon-grid > li')].filter(node => !node.hidden);
      assert.equal(visible.length, category.count, category.id);
      assert.ok(visible.every(node => catalog.icons.find(icon => icon.name === node.firstChild.dataset.icon).category === category.id));
    }
    app.category('all'); app.query('unknown-no-such-icon-123456');
    assert.equal(app.document.getElementById('icon-grid').dataset.resultCount, '0');
    assert.equal(app.document.getElementById('empty-state').hidden, false);
    assert.equal(app.document.querySelectorAll('#icon-grid svg').length, 755, 'filtering does not substitute artwork');
    app.document.getElementById('reset-empty').click();
    assert.equal(app.document.getElementById('icon-grid').dataset.resultCount, '755');
    assert.equal(app.document.activeElement.id, 'icon-search');
  } finally { app.window.close(); }
});

test('selection uses real artwork and pinned source; copy, theme, sizing and accessible close work', async () => {
  const app = openShowcase();
  try {
    for (const name of ['Check', 'AtSign', 'Linear', 'Zendesk', 'DownloadGifWatermark', 'OpenaiLogoBold', 'OpenaiLogoRegular', 'Jira']) {
      app.card(name).click();
      const icon = catalog.icons.find(icon => icon.name === name), svg = app.document.querySelector('#icon-preview svg');
      assert.equal(app.document.getElementById('icon-dialog').open, true);
      assert.equal(svg.getAttribute('viewBox'), icon.viewBox);
      assert.equal(svg.getAttribute('role'), 'img');
      assert.equal(svg.getAttribute('aria-label'), name);
      assert.equal(svg.hasAttribute('aria-hidden'), false);
      assert.equal(app.document.getElementById('icon-source').href, icon.source.url);
      assert.equal(app.document.getElementById('icon-source').rel, 'noopener noreferrer');
      assert.equal(app.document.activeElement.id, 'close-icon');
      checkClips(app.document);
      app.document.getElementById('close-icon').click();
      assert.equal(app.document.activeElement, app.card(name));
    }
    app.card('Check').click(); app.document.getElementById('copy-import').click();
    await new Promise(resolve => setTimeout(resolve, 0));
    const example = app.document.getElementById('import-example').textContent;
    assert.equal(app.clipboard.at(-1), example);
    assert.ok(example.includes("import { Check } from '@micraow/inform-ui/icons/Check';"));
    assert.ok(example.includes('container.append(createIcon(document, Check, {'));
    assert.match(app.document.getElementById('dialog-status').textContent, /copied/);
    const size = app.document.getElementById('preview-size'); size.value = '96'; size.dispatchEvent(new app.window.Event('change'));
    assert.equal(app.document.querySelector('#icon-preview svg').getAttribute('width'), '96');
    app.document.getElementById('close-icon').click(); app.document.getElementById('theme-toggle').click();
    assert.equal(app.document.documentElement.dataset.theme, 'dark');
    assert.equal(app.document.getElementById('theme-toggle').getAttribute('aria-label'), 'Use light theme');
    assert.ok(app.card('Jira').querySelector('svg [fill^="#"]'));
    app.document.getElementById('theme-toggle').click(); assert.equal(app.document.documentElement.dataset.theme, 'light');
  } finally { app.window.close(); }
});

test('catalog and selected-icon JSON downloads contain exact data and full shape definitions', async () => {
  const app = openShowcase();
  try {
    app.document.getElementById('download-catalog').click();
    assert.equal(app.downloads[0].filename, 'inform-ui-icons.catalog.json');
    assert.deepEqual(JSON.parse(await readBlob(app.window, app.downloads[0])), catalog);
    app.card('Linear').click(); app.document.getElementById('download-icon').click();
    assert.equal(app.downloads[1].filename, 'Linear.icon.json');
    const downloaded = JSON.parse(await readBlob(app.window, app.downloads[1]));
    assert.equal(downloaded.commit, catalog.commit);
    assert.deepEqual(downloaded.icon, catalog.icons.find(icon => icon.name === 'Linear'));
    assert.equal(downloaded.definition.name, 'Linear');
    assert.ok(downloaded.definition.shapes.some(shape => shape[0] === 'defs'));
  } finally { app.window.close(); }
});

test('keyboard filtering recovers and clipboard-denied local files give an honest manual-copy path', async () => {
  const app = openShowcase();
  try {
    app.document.dispatchEvent(new app.window.KeyboardEvent('keydown', { key: '/', bubbles: true }));
    assert.equal(app.document.activeElement.id, 'icon-search');
    app.query('does-not-exist');
    app.document.dispatchEvent(new app.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert.equal(app.document.getElementById('icon-grid').dataset.resultCount, '755');
    app.card('Check').focus();
    app.card('Check').dispatchEvent(new app.window.KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    assert.equal(app.document.activeElement, app.card(catalog.icons.at(-1).name));
    app.card('Check').click();
    app.window.navigator.clipboard.writeText = async () => { throw Error('Denied'); };
    app.document.execCommand = () => false;
    app.document.getElementById('copy-import').click();
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.match(app.document.getElementById('dialog-status').textContent, /Automatic copy is unavailable/);
    assert.equal(app.window.getSelection().toString(), app.document.getElementById('import-example').textContent);
    assert.equal(app.document.activeElement.className, 'import-code');
    assert.equal(app.document.querySelectorAll('textarea').length, 0);
  } finally { app.window.close(); }
});
