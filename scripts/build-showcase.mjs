import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import { exportShowcaseHTML } from './export-showcase-html.mjs';
import { createShowcaseCatalog } from './showcase-catalog.mjs';
const output = 'output/showcase';
const catalog = await createShowcaseCatalog();
await mkdir(`${output}/runtime`, { recursive: true });
for (const file of ['index.html', 'showcase.css', 'showcase.js', 'gallery.html', 'gallery.css', 'gallery.js', 'gallery-data.js']) await copyFile(`showcase/${file}`, `${output}/${file}`);
await build({ entryPoints: ['dist/browser.js'], outfile: `${output}/runtime/iui.min.js`, bundle: true, platform: 'browser', target: 'es2022', format: 'esm', minify: true, legalComments: 'eof' });
await copyFile('LICENSE', `${output}/runtime/LICENSE.txt`);
await copyFile('THIRD_PARTY_NOTICES.md', `${output}/runtime/THIRD_PARTY_NOTICES.md`);
const runtimeBytes = await readFile(`${output}/runtime/iui.min.js`);
catalog.runtimeSha256 = createHash('sha256').update(runtimeBytes).digest('hex');
await writeFile(`${output}/catalog.json`, JSON.stringify(catalog, null, 2) + '\n');
console.log(`Built ${output}: ${catalog.renderableCount} live examples, ${catalog.rejectedCount} explicit rejection, ${catalog.inventoryCount} canonical nodes, ${catalog.moduleCount} modules.`);

await exportShowcaseHTML(`${output}/standalone.html`);
