import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, readdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';
import {setup} from './primitive-harness.mjs';

const directory = new URL('../src/renderer/icons/openai-apps-sdk-ui/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', directory), 'utf8'));
const bundle = await build({entryPoints: [fileURLToPath(new URL('../src/renderer/official-icons.ts', import.meta.url))], bundle: true, write: false, format: 'esm', platform: 'node', target: 'es2022'});
const {renderOfficialIcon} = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const summaryBundle = await build({entryPoints: [fileURLToPath(new URL('../src/renderer/rating-summary.ts', import.meta.url))], bundle: true, write: false, format: 'esm', platform: 'node', target: 'es2022'});
const {renderRatingSummary} = await import('data:text/javascript;base64,' + Buffer.from(summaryBundle.outputFiles[0].text).toString('base64'));
const blob = text => createHash('sha1').update('blob ' + Buffer.byteLength(text) + '\0').update(text).digest('hex');
const attrs = element => Object.fromEntries([...element.attributes].map(({name, value}) => [name, value]));

test('official icons preserve the pinned license and exact upstream source bytes', async () => {
  assert.equal(manifest.repository, 'https://github.com/openai/apps-sdk-ui');
  assert.equal(manifest.commit, '0f00143c7a639906f1621fe58e1b6be7b5bea46d');
  const license = await readFile(new URL('LICENSE', directory), 'utf8');
  assert.equal(blob(license), 'b8ac8dc0f960bbe0b0cc90cd06d58b672151773f');
  assert.equal(manifest.license.gitBlobSha, blob(license));
  assert.match(license, /^Copyright 2025 OpenAI\n/);
  assert.ok(bundle.outputFiles[0].text.includes(license.trimEnd()));
  assert.deepEqual((await readdir(new URL('upstream/', directory))).sort(), [...manifest.icons.map(icon => icon.name + '.tsx.txt'), ...(manifest.supportingSources ?? []).map(source => source.file)].sort());
  for (const source of manifest.supportingSources ?? []) assert.equal(blob(await readFile(new URL('upstream/' + source.file, directory), 'utf8')), source.gitBlobSha, source.file);
  for (const icon of manifest.icons) {
    const source = await readFile(new URL('upstream/' + icon.name + '.tsx.txt', directory), 'utf8');
    assert.equal(blob(source), icon.gitBlobSha, icon.name);
    assert.equal(icon.path, 'src/components/Icon/svg/' + icon.name + '.tsx');
  }
  execFileSync(process.execPath, [fileURLToPath(new URL('generate.mjs', directory)), '--check']);
});

test('native output preserves every official path, coordinate, viewBox, fill and clip rule', async () => {
  const h = setup();
  for (const icon of manifest.icons) {
    const source = await readFile(new URL('upstream/' + icon.name + '.tsx.txt', directory), 'utf8');
    const xml = source.match(/<svg[\s\S]*?<\/svg>/)[0].replace(/\s*\{\.\.\.props\}/, '').replace(/fillRule=/g, 'fill-rule=').replace(/clipRule=/g, 'clip-rule=').replace(/strokeWidth=/g, 'stroke-width=').replace(/strokeLinecap=/g, 'stroke-linecap=').replace(/strokeLinejoin=/g, 'stroke-linejoin=');
    const original = new JSDOM(xml, {contentType: 'image/svg+xml'});
    const expected = original.window.document.documentElement;
    const actual = renderOfficialIcon(h.context, icon.name);
    assert.equal(actual.ownerDocument, h.doc);
    assert.equal(actual.getAttribute('viewBox'), expected.getAttribute('viewBox'), icon.name);
    assert.equal(actual.getAttribute('fill'), expected.getAttribute('fill'), icon.name);
    assert.equal(actual.getAttribute('stroke'), null, icon.name);
    assert.equal(actual.children.length, expected.children.length, icon.name);
    [...expected.children].forEach((shape, index) => {
      assert.equal(actual.children[index].localName, shape.localName, icon.name);
      assert.deepEqual(attrs(actual.children[index]), attrs(shape), icon.name);
    });
    original.window.close();
  }
  h.dispose();
});

test('official icons are decorative by default and never add focus or remote resources', () => {
  const h = setup();
  for (const {name} of manifest.icons) {
    const icon = renderOfficialIcon(h.context, name);
    assert.equal(icon.getAttribute('width'), '1em');
    assert.equal(icon.getAttribute('height'), '1em');
    assert.equal(icon.getAttribute('aria-hidden'), 'true');
    assert.equal(icon.getAttribute('focusable'), 'false');
    assert.equal(icon.hasAttribute('tabindex'), false);
    assert.equal(icon.hasAttribute('role'), false);
    assert.equal(icon.hasAttribute('aria-label'), false);
    assert.equal(icon.querySelector('use,image,script,foreignObject,style,title,[id],[href]'), null);
    assert.equal(icon.dataset.iuiIcon, name);
  }
  assert.deepEqual([h.metrics.bindings, h.metrics.listeners, h.metrics.cleanups], [0, 0, 0]);
  h.dispose();
});

test('official adapter keeps accessible labels plain and finite sizes/classes caller-owned', () => {
  const h = setup(), label = '<script>bad()</script> مرحبا 中文';
  for (const size of [12, 16, 18, 20, 24, '2em']) {
    const icon = renderOfficialIcon(h.context, 'Check', {size, className: 'custom-icon', label});
    assert.equal(icon.getAttribute('role'), 'img');
    assert.equal(icon.getAttribute('aria-label'), label);
    assert.equal(icon.hasAttribute('aria-hidden'), false);
    assert.equal(icon.getAttribute('width'), String(size));
    assert.equal(icon.getAttribute('height'), String(size));
    assert.ok(icon.classList.contains('custom-icon'));
    assert.ok(icon.classList.contains('iui-official-icon'));
    assert.equal(icon.querySelector('script'), null);
  }
  for (const name of ['constructor', '__proto__', 'toString', 'https://example.invalid/icon.svg']) assert.throws(() => renderOfficialIcon(h.context, name), /Unsupported official icon/);
  h.dispose();
});

test('the ten public primitive names keep their API while using official glyphs', () => {
  const mapping = {info: 'InfoCircle', check: 'Check', warning: 'TriangleExclamationErrorWarning', error: 'XCircle', plus: 'Plus', minus: 'Minus', 'arrow-left': 'ArrowLeft', 'arrow-right': 'ArrowRight', 'external-link': 'ExternalLink', clock: 'Clock'};
  const h = setup();
  for (const [name, official] of Object.entries(mapping)) for (const [size, pixels] of [['sm', 16], ['md', 20], ['lg', 24]]) {
    const actual = h.mount({type: 'icon', name, size, tone: 'muted'});
    assert.equal(actual.dataset.name, name);
    assert.equal(actual.dataset.size, size);
    assert.equal(actual.dataset.tone, 'muted');
    assert.equal(actual.dataset.iuiIcon, official);
    assert.equal(actual.getAttribute('width'), String(pixels));
    assert.equal(actual.getAttribute('height'), String(pixels));
    assert.equal(actual.getAttribute('fill'), 'currentColor');
    assert.equal(actual.getAttribute('stroke'), null);
    assert.equal(actual.innerHTML, renderOfficialIcon(h.context, official).innerHTML);
  }
  h.dispose();
});

test('physical arrows remain physical in RTL and icons use the supplied owner document', () => {
  const a = setup(), b = setup();
  a.host.dir = 'ltr'; b.host.dir = 'rtl';
  for (const name of ['ArrowLeft', 'ArrowRight', 'ExternalLink']) {
    const left = renderOfficialIcon(a.context, name), right = renderOfficialIcon(b.context, name);
    assert.equal(left.ownerDocument, a.doc);
    assert.equal(right.ownerDocument, b.doc);
    assert.equal(left.outerHTML, right.outerHTML);
    assert.equal(right.querySelector('[transform]'), null);
    assert.equal(right.getAttribute('style'), null);
  }
  a.dispose(); b.dispose();
});

test('rating summary uses the official solid star at 14 pixels without changing provider or text', () => {
  const h = setup();
  for (const provider of [undefined, {label: 'Provider', url: 'https://example.com/reviews'}]) {
    const row = renderRatingSummary(h.context, {type: 'rating-summary', ratingLabel: '4.8', reviewCountLabel: '250 reviews', ...(provider ? {provider} : {})});
    const star = row.querySelector('svg');
    assert.equal(row.localName, provider ? 'a' : 'span');
    assert.equal(row.textContent, '4.8 250 reviews' + (provider ? ' Provider' : ''));
    assert.equal(star.dataset.iuiIcon, 'StarFilled');
    assert.equal(star.getAttribute('viewBox'), '0 0 24 24');
    assert.equal(star.getAttribute('width'), '14');
    assert.equal(star.getAttribute('height'), '14');
    assert.equal(star.getAttribute('aria-hidden'), 'true');
    assert.equal(star.getAttribute('focusable'), 'false');
    assert.equal(star.hasAttribute('tabindex'), false);
    assert.equal(star.innerHTML, renderOfficialIcon(h.context, 'StarFilled').innerHTML);
    if (provider) {
      assert.equal(row.href, provider.url);
      assert.equal(row.rel, 'noreferrer');
      assert.equal(row.referrerPolicy, 'no-referrer');
    }
  }
  h.dispose();
});
