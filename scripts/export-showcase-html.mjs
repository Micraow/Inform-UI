import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {createShowcaseCatalog} from './showcase-catalog.mjs';
import {exportIconShowcaseHTML} from './build-icon-showcase.mjs';

/** JSON embedded in an HTML raw-text element must never contain literal markup. */
export const embeddedJSON = value => JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, char => ({'<': '\\u003c', '>': '\\u003e', '&': '\\u0026', '\u2028': '\\u2028', '\u2029': '\\u2029'}[char]));
const htmlText = value => value.replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));
const inlineScript = value => value.replace(/<\/script/gi, '<\\/script');
const inlineStyle = value => value.replace(/<\/style/gi, '<\\/style');
const sha256 = value => createHash('sha256').update(value).digest('hex');

function replaceOnce(source, from, to, label) {
  if (!source.includes(from) || source.indexOf(from) !== source.lastIndexOf(from)) throw Error(`Standalone exporter expected one ${label} hook. Update the exporter for the current showcase source.`);
  return source.replace(from, () => to);
}

const standaloneCSS = `
.standalone-gallery-trigger{border:0;background:none;padding:0;font:inherit;color:inherit}
.standalone-note{max-width:1600px;margin:0 auto;padding:0 clamp(24px,5vw,88px) 18px;font-size:11px;color:var(--muted)}
.standalone-notices{max-width:1600px;margin:0 auto;padding:0 clamp(24px,5vw,88px) 28px}
.standalone-notices pre{white-space:pre-wrap;overflow-wrap:anywhere;font:11px/1.6 Consolas,"Source Code Pro",monospace;color:var(--muted)}
#standalone-gallery,#standalone-icons{width:calc(100vw - 32px);max-width:1800px;height:calc(100dvh - 32px);max-height:none;padding:0;border:1px solid var(--line);border-radius:12px;background:var(--surface);color:var(--ink);overflow:hidden}
#standalone-gallery::backdrop,#standalone-icons::backdrop{background:rgb(0 0 0 / .55)}
.standalone-dialog-header{height:54px;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:0 20px;border-bottom:1px solid var(--line)}
.standalone-dialog-header h2{font-size:14px;font-weight:600;margin:0}
.standalone-dialog-header button{font-size:12px;border:1px solid var(--line);border-radius:6px;padding:7px 12px;background:var(--surface);color:var(--ink)}
#standalone-gallery-frame,#standalone-icons-frame{display:block;width:100%;height:calc(100% - 54px);border:0;background:#f7f7f8}
@media(max-width:600px){#standalone-gallery,#standalone-icons{width:100vw;height:100dvh;margin:0;border:0;border-radius:0}.standalone-dialog-header{padding:0 14px}}
`;

const bridge = `(() => {
  const trigger=document.getElementById('open-standalone-gallery'),dialog=document.getElementById('standalone-gallery'),frame=document.getElementById('standalone-gallery-frame'),close=document.getElementById('close-standalone-gallery');
  let returnFocus;
  trigger.addEventListener('click',()=>{
    if(dialog.open)return;
    returnFocus=document.activeElement;
    frame.srcdoc=JSON.parse(document.getElementById('iui-standalone-gallery-document').textContent);
    dialog.showModal();close.focus();
  });
  close.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{
    // Unloading the frame fires its pagehide cleanup and disposes gallery mounts.
    frame.removeAttribute('srcdoc');
    if(returnFocus?.isConnected)returnFocus.focus();
  });
})();`;

function runtimePlugin(parent = false) {
  return {
    name: 'embedded-showcase-runtime',
    setup(builder) {
      builder.onResolve({filter: /^\.\/runtime\/iui\.min\.js$/}, () => ({path: 'runtime', namespace: 'embedded-runtime'}));
      builder.onLoad({filter: /.*/, namespace: 'embedded-runtime'}, () => ({contents: parent
        // The validator intentionally rejects objects with foreign prototypes.
        // These trusted embedded JSON samples cross into the runtime's realm;
        // their render container still belongs to the iframe's ownerDocument.
        ? `const runtime=window.parent.InformUIStandalone; const localJSON=value=>window.parent.JSON.parse(JSON.stringify(value)); export const mount=(container,value)=>runtime.mount(container,localJSON(value)); export const validateDocument=value=>runtime.validateDocument(localJSON(value));`
        : 'const {mount,validateDocument}=globalThis.InformUIStandalone; export {mount,validateDocument};', loader: 'js'}));
    },
  };
}

async function bundleApp(contents, sourcefile, parent = false) {
  const result = await build({stdin: {contents, sourcefile, resolveDir: resolve('showcase'), loader: 'js'}, bundle: true, platform: 'browser', target: 'es2022', format: 'iife', minify: true, write: false, legalComments: 'eof', plugins: [runtimePlugin(parent)]});
  return result.outputFiles[0].text;
}

/** One local-openable file; all catalog JSON and the runtime are embedded once. */
export async function exportShowcaseHTML(outputPath = 'output/showcase-standalone.html') {
  const catalog = await createShowcaseCatalog();
  const iconResult = await exportIconShowcaseHTML('output/showcase/icons.html');
  let iconsDocument = await readFile(iconResult.outputPath, 'utf8');
  iconsDocument = iconsDocument.replace('href="./index.html"', 'href="#components" id="return-to-components"').replace('href="./gallery.html"', 'href="#gallery" id="return-to-gallery"');
  iconsDocument = iconsDocument.replace('</body>', '<script>document.getElementById("return-to-components").addEventListener("click",e=>{e.preventDefault();window.parent.document.getElementById("standalone-icons").close();});document.getElementById("return-to-gallery").addEventListener("click",e=>{e.preventDefault();window.parent.document.getElementById("standalone-icons").close();window.parent.document.getElementById("open-standalone-gallery").click();});</script></body>');
  const [studioHTML, studioCSS, studioSource, galleryHTML, galleryCSS, gallerySource, license, notices, codeFontCSS] = await Promise.all([
    'showcase/index.html', 'showcase/showcase.css', 'showcase/showcase.js', 'showcase/gallery.html',
    'showcase/gallery.css', 'showcase/gallery.js', 'LICENSE', 'THIRD_PARTY_NOTICES.md', 'src/renderer/code-font.css',
  ].map(path => readFile(path, 'utf8')));
  const runtime = (await build({entryPoints: ['dist/browser.js'], bundle: true, platform: 'browser', target: 'es2022', format: 'iife', globalName: 'InformUIStandalone', minify: true, write: false, legalComments: 'eof'})).outputFiles[0].text;
  const fetchHook = "  const response = await fetch('./catalog.json');\n  if (!response.ok) throw Error(`Catalog request failed: ${response.status}`);\n  catalog = await response.json();";
  const localStudioSource = replaceOnce(studioSource, fetchHook, "  catalog = JSON.parse(document.getElementById('iui-standalone-catalog').textContent);", 'catalog fetch');
  const studioApp = await bundleApp(localStudioSource, 'showcase.js');
  const galleryApp = await bundleApp(gallerySource, 'gallery.js', true);

  let gallery = replaceOnce(galleryHTML, '<link rel="stylesheet" href="./gallery.css">', `<style>${inlineStyle(galleryCSS)}</style>`, 'gallery stylesheet');
  gallery = replaceOnce(gallery, '<script type="module" src="./gallery.js"></script>', '', 'gallery module');
  gallery = replaceOnce(gallery, 'href="./gallery.html"', 'href="#create"', 'gallery home link');
  gallery = replaceOnce(gallery, 'href="./index.html"', 'href="#studio" id="return-to-standalone-studio"', 'studio return link');
  gallery = replaceOnce(gallery, '</body>', `<script>${inlineScript(galleryApp)}</script><script>document.getElementById('return-to-standalone-studio').addEventListener('click',event=>{event.preventDefault();window.parent.document.getElementById('standalone-gallery').close();});</script></body>`, 'gallery body');

  const manifest = {format: 'inform-ui-standalone-showcase/1', previewRevision: '2026-10-13-v3', iconCount: iconResult.iconCount, schemaSha256: catalog.schemaSha256, runtimeSha256: sha256(runtime), inventoryCount: catalog.inventoryCount, renderableCount: catalog.renderableCount, rejectedCount: catalog.rejectedCount, moduleCount: catalog.moduleCount, offline: true};
  // This demo does not load external sample media, service APIs, fonts or scripts.
  // User-activated repository/document links remain ordinary outbound anchors.
  const policy = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; media-src data: blob:; connect-src 'none'; frame-src 'self' data: blob:; object-src 'none'; base-uri 'none'; form-action 'none'";
  let html = replaceOnce(studioHTML, '<meta charset="utf-8">', `<meta charset="utf-8">\n  <meta http-equiv="Content-Security-Policy" content="${policy}">`, 'document charset');
  html = replaceOnce(html, '<link rel="stylesheet" href="./showcase.css">', `<style>${inlineStyle(codeFontCSS + '\n' + studioCSS + '\n' + standaloneCSS)}</style>`, 'studio stylesheet');
  html = replaceOnce(html, '<script type="module" src="./showcase.js"></script>', '', 'studio module');
  html = replaceOnce(html, '<a href="./gallery.html">Gallery</a>', '<button id="open-standalone-gallery" class="standalone-gallery-trigger" type="button" aria-haspopup="dialog">Gallery</button>', 'gallery trigger');
  html = replaceOnce(html, '<a href="./icons.html">755 icons</a>', '<button id="open-standalone-icons" class="standalone-gallery-trigger" type="button" aria-haspopup="dialog">755 icons</button>', 'icon trigger');
  const additions = `
  <p class="standalone-note">Preview v3 · 13 October 2026: ${catalog.inventoryCount} schema nodes, ${catalog.renderableCount} local previews and ${catalog.rejectedCount} explicit compatibility boundary. Every entry includes its JSON. A local video demo and the complete searchable 755-icon catalog are also included. Full source-by-source visual review is still in progress.</p>
  <details class="standalone-notices"><summary>Bundled licenses and attribution</summary><pre>${htmlText(license + '\n\n' + notices)}</pre></details>
  <dialog id="standalone-gallery" aria-labelledby="standalone-gallery-title"><div class="standalone-dialog-header"><h2 id="standalone-gallery-title">Inform UI · Gallery</h2><button id="close-standalone-gallery" type="button">Close gallery</button></div><iframe id="standalone-gallery-frame" title="Three-page Inform UI gallery"></iframe></dialog>
  <dialog id="standalone-icons" aria-labelledby="standalone-icons-title"><div class="standalone-dialog-header"><h2 id="standalone-icons-title">Inform UI · 755 icons</h2><button id="close-standalone-icons" type="button">Close icons</button></div><iframe id="standalone-icons-frame" title="Search all 755 official icons"></iframe></dialog>
  <script id="iui-standalone-icons-document" type="application/json">${embeddedJSON(iconsDocument)}</script>
  <script id="iui-standalone-catalog" type="application/json">${embeddedJSON(catalog)}</script>
  <script id="iui-standalone-manifest" type="application/json">${embeddedJSON(manifest)}</script>
  <script id="iui-standalone-gallery-document" type="application/json">${embeddedJSON(gallery)}</script>
  <script id="iui-standalone-runtime">${inlineScript(runtime)}</script>
  <script id="iui-standalone-app">${inlineScript(studioApp)}</script>
  <script id="iui-standalone-bridge">${inlineScript(bridge + bridge.replaceAll('gallery', 'icons'))}</script>
`;
  html = replaceOnce(html, '</body>', additions + '</body>', 'studio body');
  await mkdir(dirname(resolve(outputPath)), {recursive: true});
  await writeFile(outputPath, html);
  return {outputPath, bytes: Buffer.byteLength(html), sha256: sha256(html), ...manifest};
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await exportShowcaseHTML(process.argv[2] ?? 'output/showcase-standalone.html');
  console.log(`Exported ${result.outputPath}: ${result.inventoryCount} nodes, ${result.renderableCount} previews, ${result.rejectedCount} explicit boundary, ${result.bytes} bytes, SHA-256 ${result.sha256}.`);
}
