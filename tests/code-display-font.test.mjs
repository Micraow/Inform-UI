import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {cp, mkdtemp, readFile, rm, symlink, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {CODE_FONT_COMMIT, CODE_FONT_FILES, CODE_FONT_LICENSE, codeFontAssets} from '../scripts/code-font-assets.mjs';

const sourceDirectory = new URL('../src/renderer/fonts/source-code-pro/', import.meta.url);
const generatedStyle = new URL('../src/renderer/code-font.css', import.meta.url);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const rulesOnly = css => css.replace(/\/\*[\s\S]*?\*\//g, '');
async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'inform-code-font-'));
  t.after(() => rm(directory, {recursive: true, force: true}));
  await cp(sourceDirectory, directory, {recursive: true});
  return pathToFileURL(directory + '/');
}

test('code font source: pinned upright WOFF2 files retain the original bytes', async () => {
  const assets = await codeFontAssets();
  assert.equal(CODE_FONT_COMMIT, '803b7e23ec97ae58b6232ea76519a76d428ba268');
  assert.deepEqual(CODE_FONT_FILES.map(font => font.weight), [400, 600]);
  assert.equal(assets.files.size, 2);
  for (const font of CODE_FONT_FILES) {
    const bytes = assets.files.get(font.file);
    assert.equal(bytes.length, font.bytes);
    assert.equal(sha256(bytes), font.sha256);
    assert.equal(bytes.toString('ascii', 0, 4), 'wOF2');
  }
});

test('code font source: generated CSS is deterministic, embeds full OFL, and has no external font sources', async () => {
  const first = await codeFontAssets(), second = await codeFontAssets();
  assert.equal(first.inline, second.inline);
  assert.equal(await readFile(generatedStyle, 'utf8'), first.inline);
  assert.ok(first.inline.includes(first.license));
  assert.match(first.license, /SIL OPEN FONT LICENSE Version 1\.1/);
  const rules = rulesOnly(first.inline);
  assert.equal((rules.match(/@font-face/g) || []).length, 2);
  assert.doesNotMatch(rules, /@import|https?:|local\(|italic|oblique/i);
  const faces = [...rules.matchAll(/@font-face\{([^}]+)\}/g)];
  for (const [index, face] of faces.entries()) {
    const font = CODE_FONT_FILES[index];
    assert.match(face[1], /font-family:"Source Code Pro";font-style:normal;/);
    assert.ok(face[1].includes(`font-weight:${font.weight};`));
    assert.match(face[1], /font-display:swap;/);
    const match = /src:url\(data:font\/woff2;base64,([A-Za-z0-9+/=]+)\) format\("woff2"\)/.exec(face[1]);
    assert.ok(match);
    assert.deepEqual(Buffer.from(match[1], 'base64'), first.files.get(font.file));
  }
});

test('code font source: provenance and published third-party notices preserve the exact complete license', async () => {
  const assets = await codeFontAssets();
  const provenance = await readFile(new URL('README.md', sourceDirectory), 'utf8');
  const notices = await readFile('THIRD_PARTY_NOTICES.md', 'utf8');
  assert.ok(notices.includes(assets.license));
  assert.ok(provenance.includes(CODE_FONT_COMMIT));
  for (const record of [...CODE_FONT_FILES, CODE_FONT_LICENSE]) {
    assert.ok(provenance.includes(record.file));
    assert.ok(provenance.includes(String(record.bytes)));
    assert.ok(provenance.includes(record.sha256));
  }
});

test('code font source: a modified or truncated font fails closed', async t => {
  const directory = await fixture(t), file = new URL(CODE_FONT_FILES[0].file, directory);
  const bytes = await readFile(file);
  bytes[bytes.length - 1] ^= 1;
  await writeFile(file, bytes);
  await assert.rejects(codeFontAssets(directory), /hash differs/);
  await writeFile(file, bytes.subarray(0, bytes.length - 1));
  await assert.rejects(codeFontAssets(directory), /byte count differs/);
});

test('code font source: a changed license or missing font cannot be embedded', async t => {
  const directory = await fixture(t), licenseFile = new URL(CODE_FONT_LICENSE.file, directory);
  const license = await readFile(licenseFile);
  const changed = Buffer.from(license);
  changed[0] ^= 1;
  await writeFile(licenseFile, changed);
  await assert.rejects(codeFontAssets(directory), /hash differs.*LICENSE/);
  await writeFile(licenseFile, license);
  await rm(new URL(CODE_FONT_FILES[1].file, directory));
  await assert.rejects(codeFontAssets(directory), /ENOENT/);
});

test('code font source: symlinks cannot replace pinned local font assets', async t => {
  const directory = await fixture(t), file = new URL(CODE_FONT_FILES[0].file, directory);
  await rm(file);
  await symlink(new URL(CODE_FONT_FILES[0].file, sourceDirectory), file);
  await assert.rejects(codeFontAssets(directory), /ordinary files/);
});

test('code font source: renderer and both build scripts include verified code font CSS', async () => {
  const renderer = await readFile('src/renderer/index.ts', 'utf8');
  assert.match(renderer, /import codeFontStyles from '\.\/code-font\.css'/);
  assert.match(renderer, /const styles: string = stylesheet \+ '\\n' \+ codeFontStyles/);
  for (const file of ['scripts/build.mjs', 'scripts/build-cdn.mjs']) {
    const source = await readFile(file, 'utf8');
    assert.match(source, /await generateCodeFontStyle\(\)/);
    assert.ok(source.indexOf('await generateCodeFontStyle()') < source.indexOf('await build('));
    assert.ok(source.includes("readFile('src/renderer/code-font.css','utf8')"));
  }
});

test('code font artifacts: runtime, package CSS and CDN CSS embed exact font faces and license', async () => {
  const {inline} = await codeFontAssets();
  const {styles} = await import('../dist/browser.js');
  const targets = new Map([
    ['runtime.styles', styles],
    ['dist/style.css', await readFile('dist/style.css', 'utf8')],
    ['cdn/iui.css', await readFile('cdn/iui.css', 'utf8')],
  ]);
  for (const [name, css] of targets) assert.ok(css.includes(inline), `${name} must include the verified self-contained code font CSS`);
});

test('code font artifacts: compiled offline HTML embeds the upright fonts under a data-only font policy', async () => {
  const {inline} = await codeFontAssets();
  const {compileHtml} = await import('../dist/index.js');
  const fixture = JSON.parse(await readFile('examples/code.json', 'utf8'));
  const html = await compileHtml(fixture);
  assert.ok(html.includes(inline));
  assert.match(html, /font-src data:;/);
  for (const record of CODE_FONT_FILES) assert.ok(html.includes((await readFile(new URL(record.file, sourceDirectory))).toString('base64')));
});
