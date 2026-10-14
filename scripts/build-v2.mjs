import {build} from 'esbuild';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {iconAliases} from '../packages/chart-extension/scripts/build-aliases.mjs';
import path from 'node:path';
const aliases={...iconAliases,'@inform/component-contract':path.resolve('packages/component-contract/src/index.ts'),'@inform/component-contract/zod':path.resolve('packages/component-contract/src/zod.ts')};
const require=createRequire(new URL('../packages/chart-extension/package.json',import.meta.url));const sass=require('sass');
await mkdir('dist/v2',{recursive:true});
const chartCSS=sass.compile('packages/chart-extension/src/chart-styles.scss',{style:'compressed',logger:sass.Logger.silent}).css;
await writeFile('packages/chart-extension/generated/styles.ts','export const chartCSS='+JSON.stringify(chartCSS)+';\n');
const noticePaths=['src/shared/HIGHLIGHT-JS-LICENSE.txt','LICENSE','packages/component-contract/THIRD_PARTY_NOTICES.md','packages/component-contract/vendor/openui/LICENSE','packages/component-contract/vendor/ZOD-LICENSE','packages/parser-runtime/THIRD_PARTY_NOTICES.md','packages/parser-runtime/vendor/openui/LICENSE','src/icons/LICENSE','src/renderer/fonts/source-code-pro/LICENSE.md','packages/chart-extension/THIRD_PARTY_NOTICES.md','packages/domain-view-renderer/THIRD_PARTY_NOTICES.md','packages/domain-view-renderer/vendor/KATEX-LICENSE','packages/domain-view-renderer/vendor/LOTTIE-WEB-LICENSE',...JSON.parse(await readFile('packages/chart-extension/generated/dependency-licenses.json','utf8')).map(x=>'packages/chart-extension/'+x.file)];
const notices=(await Promise.all([...new Set(noticePaths)].map(path=>readFile(path,'utf8')))).join('\n\n');
const common={bundle:true,alias:aliases,target:'es2022',platform:'browser',loader:{'.css':'text'},jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},legalComments:'eof',minify:true};
for(const [name,entry]of [['inform-ui','src/v2/browser.ts'],['inform-core','src/v2/core.ts']]){
 await build({...common,entryPoints:[entry],format:'iife',globalName:'InformUI',outfile:`dist/v2/${name}.global.js`});
 await build({...common,entryPoints:[entry],format:'esm',outfile:`dist/v2/${name}.js`});
}
await writeFile('dist/v2/THIRD_PARTY_NOTICES.txt',notices);
await build({...common,entryPoints:['src/v2/browser.ts'],platform:'node',format:'esm',outfile:'dist/v2/node.mjs'});
await build({...common,entryPoints:['src/v2/core.ts'],platform:'node',format:'esm',outfile:'dist/v2/core-node.mjs'});
console.log('Built full and foundation-only no-build v2 entries');
