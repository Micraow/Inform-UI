import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {JSDOM} from 'jsdom';
import Ajv from 'ajv/dist/2020.js';
import {mount, validateDocument, compileHtml} from '../dist/index.js';
import {buildSelection} from '../scripts/schema-source/registry.mjs';

const summary = (extra = {}) => ({type: 'rating-summary', ratingLabel: '4.8', ...extra});
const provider = {label: 'Example reviews', url: 'https://example.com/reviews'};
const spec = (node = summary()) => ({version: 'iui/1', body: [node]});
function setup(input = spec()) {
  const dom = new JSDOM('<!doctype html><html lang="en"><main></main></html>', {pretendToBeVisual: true});
  const host = dom.window.document.querySelector('main'), controller = mount(host, input);
  return {dom, host, controller, root: host.querySelector('.iui-rating-summary')};
}
function invalid(input, code = 'SCHEMA') {
  const result = validateDocument(input);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some(issue => issue.code === code), JSON.stringify(result.issues));
  return result;
}

test('rating-summary public schema and isolated module preserve one original supplied display contract', async () => {
  const full = JSON.parse(await readFile(new URL('../src/schema/iui.schema.json', import.meta.url)));
  const {schema, manifest} = buildSelection(['content/rating-summary']);
  assert.deepEqual(manifest.components, ['rating-summary']);
  assert.deepEqual(schema.$defs.RatingSummaryNode, full.$defs.RatingSummaryNode);
  assert.equal(schema.$defs.RatingNode, undefined);
  const validate = new Ajv({strict: true, allErrors: true}).compile(schema);
  const example = JSON.parse(await readFile(new URL('../examples/rating-summary.json', import.meta.url)));
  assert.equal(validate(example), true, JSON.stringify(validate.errors));
  assert.equal(validateDocument(example).ok, true);
  assert.equal(validate(spec({type: 'rating', label: 'Input', bind: 'score'})), false);
});

test('rating-summary bounds literal fields by Unicode code points and closes nested objects', async () => {
  const {schema} = buildSelection(['content/rating-summary']);
  const validate = new Ajv({strict: true, allErrors: true}).compile(schema);
  const longURL = 'https://example.com/' + 'x'.repeat(2048 - 'https://example.com/'.length);
  for (const extra of [{}, {ratingLabel: '😀'.repeat(200)}, {reviewCountLabel: '😀'.repeat(200)}, {provider}, {provider: {label: '😀'.repeat(200), url: longURL}}]) {
    assert.equal(validate(spec(summary(extra))), true, JSON.stringify(validate.errors));
    assert.equal(validateDocument(spec(summary(extra))).ok, true);
  }
  for (const extra of [
    {ratingLabel: ''}, {ratingLabel: '😀'.repeat(201)}, {ratingLabel: 4.8}, {ratingLabel: {$: 'rating'}},
    {reviewCountLabel: ''}, {reviewCountLabel: null}, {reviewCountLabel: '😀'.repeat(201)}, {reviewCountLabel: 0},
    {provider: {}}, {provider: {label: 'Source'}}, {provider: {url: provider.url}},
    {provider: {label: '', url: provider.url}}, {provider: {...provider, label: 'x'.repeat(201)}},
    {provider: {...provider, url: ''}}, {provider: {...provider, url: longURL + 'x'}},
    {provider: {...provider, logo: 'https://example.com/logo.png'}},
    {bind: 'score'}, {max: 5}, {readOnly: true}, {value: 4.8}, {rating: 4.8}, {reviewCount: 12},
    {disabled: true}, {children: []}, {onClick: 'run()'}, {logoSrc: 'https://example.com/logo.png'},
  ]) {
    const input = spec(summary(extra));
    assert.equal(validate(input), false, JSON.stringify(extra));
    invalid(input);
  }
  invalid(spec({type: 'rating-summary'}));
});

test('rating-summary source destinations pass absolute HTTP(S) and the shared safe URL policy', () => {
  for (const url of ['https://example.com/reviews?rating=4#summary', 'http://example.com/reviews', 'HTTPS://example.com/reviews']) {
    assert.equal(validateDocument(spec(summary({provider: {...provider, url}}))).ok, true, url);
  }
  for (const url of ['javascript:alert(1)', 'data:text/html,test', 'file:///tmp/reviews', 'https://user:password@example.com/', 'https://user@example.com/', '//example.com/reviews', '/reviews', '#reviews', 'mailto:review@example.com', 'tel:+1234', ' https://example.com/', 'https://example.com/ ', 'https://example.com/\n', 'https://example.com/\u0000', 'https://example.com\\other', 'https://', 'https:example.com']) {
    const input = spec(summary({provider: {...provider, url}}));
    const result = invalid(input, 'UNSAFE_URL');
    assert.ok(result.issues.some(issue => issue.path === '/body/0/provider/url'));
    assert.throws(() => setup(input));
  }
});

test('rating-summary uses one hidden solid star and passive literal text without invented metrics', () => {
  const x = setup(spec(summary({reviewCountLabel: '(120 reviews)'})));
  assert.equal(x.root.tagName, 'SPAN');
  assert.equal(x.root.textContent, '4.8 (120 reviews)');
  assert.equal(x.root.querySelectorAll('svg').length, 1);
  assert.equal(x.root.querySelector('svg').getAttribute('aria-hidden'), 'true');
  assert.equal(x.root.querySelector('svg').getAttribute('focusable'), 'false');
  assert.equal(x.root.querySelector('svg').getAttribute('fill'), 'currentColor');
  assert.equal(x.root.querySelectorAll('[data-iui-icon=StarFilled]').length, 1);
  assert.equal(x.root.querySelectorAll('.iui-rating-summary-star path').length, 1);
  assert.equal(x.root.getAttribute('role'), null);
  assert.equal(x.root.getAttribute('tabindex'), null);
  assert.equal(x.root.querySelectorAll('a,input,button,output,[role=slider],[role=img],[aria-live]').length, 0);
  assert.equal(x.root.querySelectorAll('img,iframe,script,audio,video,link').length, 0);
  assert.equal(x.root.querySelector('.iui-rating-summary-rating').title, '4.8');
  assert.deepEqual(x.controller.getState(), {});
  x.controller.dispose();
});

test('rating-summary preserves missing, unknown and explicit zero counts distinctly', () => {
  for (const [label, expected] of [[undefined, 'Not rated'], ['Review count unavailable', 'Not rated Review count unavailable'], ['(0 reviews)', 'Not rated (0 reviews)']]) {
    const x = setup(spec(summary({ratingLabel: 'Not rated', ...(label === undefined ? {} : {reviewCountLabel: label})})));
    assert.equal(x.root.textContent, expected);
    assert.equal(x.root.querySelectorAll('.iui-rating-summary-count').length, label === undefined ? 0 : 1);
    x.controller.dispose();
  }
});

test('rating-summary links the complete row with visible provider attribution and native semantics', () => {
  const x = setup(spec(summary({reviewCountLabel: '(120 reviews)', provider})));
  assert.equal(x.root.tagName, 'A');
  assert.equal(x.host.querySelectorAll('a').length, 1);
  assert.equal(x.root.getAttribute('href'), provider.url);
  assert.equal(x.root.rel, 'noreferrer');
  assert.equal(x.root.referrerPolicy, 'no-referrer');
  assert.equal(x.root.getAttribute('target'), null);
  assert.equal(x.root.textContent, '4.8 (120 reviews) Example reviews');
  assert.equal(x.root.getAttribute('aria-label'), null);
  assert.equal(x.root.querySelectorAll('bdi[dir=auto]').length, 3);
  for (const part of x.root.querySelectorAll('bdi')) assert.equal(part.title, part.textContent);
  let target;
  x.root.addEventListener('click', event => {target = event.currentTarget; event.preventDefault();});
  x.root.querySelector('.iui-rating-summary-count').dispatchEvent(new x.dom.window.MouseEvent('click', {bubbles: true, cancelable: true}));
  assert.equal(target, x.root);
  x.root.focus();
  assert.equal(x.dom.window.document.activeElement, x.root);
  assert.deepEqual(x.controller.getState(), {});
  x.controller.dispose();
});

test('rating-summary treats script-looking and markup-looking supplied labels as inert text', () => {
  const ratingLabel = '<script>globalThis.ratingInjected=1</script>';
  const reviewCountLabel = '<img src=x onerror=alert(1)>';
  const name = '<strong>Source</strong>';
  const x = setup(spec(summary({ratingLabel, reviewCountLabel, provider: {...provider, label: name}})));
  assert.equal(x.root.textContent, `${ratingLabel} ${reviewCountLabel} ${name}`);
  assert.equal(x.root.querySelectorAll('script,img,strong').length, 0);
  assert.equal(x.dom.window.ratingInjected, undefined);
  assert.equal(x.root.querySelector('.iui-rating-summary-provider').title, name);
  x.controller.dispose();
});

test('rating-summary does not change the local rating input or subscribe to shared state', () => {
  const input = {version: 'iui/1', state: {score: 0, other: 0}, body: [summary({ratingLabel: '4.8 supplied'}), {type: 'rating', label: 'Your rating', bind: 'score'}]};
  const x = setup(input), root = x.root, star = root.firstChild;
  const radios = [...x.host.querySelectorAll('input[type=radio]')];
  assert.equal(radios.length, 5);
  radios[2].click();
  assert.equal(x.controller.getState().score, 3);
  assert.equal(x.host.querySelector('.iui-rating-output').value, '3 of 5');
  x.root.dispatchEvent(new x.dom.window.MouseEvent('click', {bubbles: true}));
  x.controller.setState({other: 2, score: 4});
  assert.equal(x.host.querySelector('.iui-rating-summary'), root);
  assert.equal(root.firstChild, star);
  assert.equal(root.textContent, '4.8 supplied');
  assert.equal(radios[3].checked, true);
  x.controller.dispose();
});

test('rating-summary supports ownerDocuments, atomic updates and ordinary replacement/disposal', () => {
  const x = setup(spec(summary({provider}))), y = setup(), before = x.host.innerHTML;
  assert.equal(x.root.ownerDocument, x.dom.window.document);
  assert.notEqual(x.root.ownerDocument, y.root.ownerDocument);
  x.root.focus();
  assert.throws(() => x.controller.update(spec(summary({provider: {...provider, url: 'javascript:alert(1)'}}))));
  assert.equal(x.host.innerHTML, before);
  assert.equal(x.dom.window.document.activeElement, x.root);
  const old = x.root;
  x.controller.update(spec(summary({ratingLabel: 'Updated supplied label'})));
  assert.equal(old.isConnected, false);
  assert.equal(x.host.querySelector('.iui-rating-summary').textContent, 'Updated supplied label');
  x.controller.dispose();
  assert.equal(x.host.childElementCount, 0);
  assert.throws(() => x.controller.setState({}), /disposed/);
  assert.equal(y.root.textContent, '4.8');
  y.controller.dispose();
});

test('rating-summary offline compilation is deterministic and contains no fetched branding or service code', async () => {
  const input = spec(summary({reviewCountLabel: '(120 reviews)', provider})), original = structuredClone(input);
  const html = await compileHtml(input);
  assert.equal(await compileHtml(input), html);
  assert.deepEqual(input, original);
  const dom = new JSDOM(html, {runScripts: 'dangerously'});
  const root = dom.window.document.querySelector('.iui-rating-summary');
  assert.equal(root.textContent, '4.8 (120 reviews) Example reviews');
  assert.equal(root.getAttribute('href'), provider.url);
  assert.equal(dom.window.document.querySelectorAll('script[src],img,iframe,audio,video').length, 0);
  assert.doesNotMatch(root.textContent, /verified|live|online lookup/i);
  dom.window.close();
  await assert.rejects(() => compileHtml(spec(summary({provider: {...provider, url: 'data:text/html,test'}}))));
});

test('rating-summary is available through the public discriminated Node type with no alternate protocol', () => {
  execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '--noEmit', '--strict', '--module', 'NodeNext', '--target', 'ES2022', '--skipLibCheck', 'tests/rating-summary-types-consumer.mts'], {stdio: 'pipe'});
});
