import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sha256 = value => createHash('sha256').update(value).digest('hex');
/** Escape all HTML-sensitive characters before embedding JSON in a raw-text element. */
export const embeddedJSON = value => JSON.stringify(value).replace(/[<>&\u2028\u2029]/gu, char => ({ '<': '\\u003c', '>': '\\u003e', '&': '\\u0026', '\u2028': '\\u2028', '\u2029': '\\u2029' }[char]));
export const inlineScript = value => value.replace(/<\/script/giu, '<\\/script');
const inlineStyle = value => value.replace(/<\/style/giu, '<\\/style');
const htmlText = value => value.replace(/[&<>"']/gu, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
function replaceOnce(source, hook, value) {
  if (!source.includes(hook) || source.indexOf(hook) !== source.lastIndexOf(hook)) throw Error(`Icon exporter expected one hook: ${hook}`);
  return source.replace(hook, () => value);
}

/** Build a truly local-openable catalog, independent from schema-node counts. */
export async function exportIconShowcaseHTML(outputPath = resolve(root, 'output/showcase/icons.html')) {
  const [source, css, rawCatalog, iconLicense, projectLicense, codeFontCSS, codeFontLicense] = await Promise.all([
    'showcase/icons.html', 'showcase/icons.css', 'src/icons/catalog.json', 'src/icons/LICENSE', 'LICENSE', 'src/renderer/code-font.css', 'src/renderer/fonts/source-code-pro/LICENSE.md',
  ].map(path => readFile(resolve(root, path), 'utf8')));
  const catalog = JSON.parse(rawCatalog);
  if (catalog.iconCount !== catalog.icons.length || new Set(catalog.icons.map(icon => icon.name)).size !== catalog.iconCount) throw Error('Icon catalog count or canonical-name uniqueness mismatch.');
  const result = await build({ entryPoints: [resolve(root, 'showcase/icons.js')], absWorkingDir: root, bundle: true, platform: 'browser', target: 'es2022', format: 'iife', minify: true, write: false, legalComments: 'none' });
  const app = result.outputFiles[0].text;
  // Full original license text is embedded visibly below, even when esbuild deduplicates comments.
  const manifest = { format: 'inform-ui-icon-showcase/1', iconCount: catalog.iconCount, categoryCount: catalog.categories.length, aliasCount: catalog.aliases.length, repository: catalog.repository, commit: catalog.commit, license: catalog.license, catalogSha256: sha256(rawCatalog), runtimeSha256: sha256(app), iconLicenseSha256: sha256(iconLicense), offline: true };
  const policy = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'";
  let html = replaceOnce(source, '<meta charset="utf-8">', `<meta charset="utf-8">\n  <meta http-equiv="Content-Security-Policy" content="${policy}">`);
  html = replaceOnce(html, '<link rel="stylesheet" href="./icons.css">', `<style>${inlineStyle(codeFontCSS + '\n' + css)}</style>`);
  html = replaceOnce(html, '<!-- ICON_LICENSES -->', htmlText(`OpenAI Apps SDK UI icons\nPinned source: ${catalog.repository}/tree/${catalog.commit}\nLicense: MIT\n\n${iconLicense}\n\nInform UI showcase\n\n${projectLicense}\n\nSource Code Pro\n\n${codeFontLicense}`));
  html = replaceOnce(html, '<!-- ICON_DATA -->', `<script id="iui-icon-catalog" type="application/json">${embeddedJSON(catalog)}</script>\n  <script id="iui-icon-manifest" type="application/json">${embeddedJSON(manifest)}</script>`);
  html = replaceOnce(html, '<script type="module" src="./icons.js"></script>', `<script id="iui-icon-app">${inlineScript(app)}</script>`);
  await mkdir(dirname(resolve(outputPath)), { recursive: true });
  await writeFile(outputPath, html);
  return { outputPath, bytes: Buffer.byteLength(html), sha256: sha256(html), ...manifest };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await exportIconShowcaseHTML(process.argv[2]);
  console.log(`Exported ${result.outputPath}: ${result.iconCount} icons, ${result.categoryCount} categories, ${result.bytes} bytes, SHA-256 ${result.sha256}.`);
}
