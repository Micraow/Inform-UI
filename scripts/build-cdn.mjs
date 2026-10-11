import {assertSchemaDirectoryContents} from './schema-subsets.mjs';
import {generateMathStyle,writeExternalMath} from './math-assets.mjs';
await generateMathStyle();
import {build} from 'esbuild';
import {mkdir,readFile,writeFile,copyFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
await mkdir('cdn',{recursive:true});
const options={entryPoints:['src/browser.ts'],bundle:true,preserveSymlinks:true,platform:'browser',target:'es2022',minify:true,sourcemap:'external',sourcesContent:false,loader:{'.css':'text'},legalComments:'eof',metafile:true,logLevel:'info'};
for(const [name,format] of [['iui.min.js','esm'],['iui.global.min.js','iife']]){
  const result=await build({...options,format,outfile:`cdn/${name}`,...(format==='iife'?{globalName:'IUI'}:{})});
  for(const [file,metadata]of Object.entries(result.metafile.outputs))if(file.endsWith('.js')&&metadata.imports.length)throw new Error(`CDN bundle has unresolved dependencies: ${file}`);
}
const math=await writeExternalMath('cdn');
await writeFile('cdn/iui.css',(await readFile('src/renderer/style.css','utf8'))+'\n'+math.external+'\n'+(await readFile('src/renderer/transaction-detail.css','utf8'))+'\n'+(await readFile('src/renderer/recommendation-card.css','utf8'))+'\n'+(await readFile('src/renderer/finance-status.css','utf8'))+'\n'+(await readFile('src/renderer/prompt-checklist.css','utf8'))+'\n'+(await readFile('src/renderer/ledger-records.css','utf8'))+'\n'+(await readFile('src/renderer/player-summaries.css','utf8'))+'\n'+(await readFile('src/renderer/motorsport.css','utf8'))+'\n'+(await readFile('src/renderer/boxscores.css','utf8'))+'\n'+(await readFile('src/renderer/supplied-results.css','utf8'))+'\n'+(await readFile('src/renderer/match-scores.css','utf8'))+'\n'+(await readFile('src/renderer/learning-media.css','utf8'))+'\n'+(await readFile('src/renderer/weather-sidebar.css','utf8'))+'\n'+(await readFile('src/renderer/category-correction.css','utf8'))+'\n'+(await readFile('src/renderer/net-worth.css','utf8'))+'\n'+(await readFile('src/renderer/pressable.css','utf8'))+'\n'+(await readFile('src/renderer/fee-interest.css','utf8'))+'\n'+(await readFile('src/renderer/html-view.css','utf8'))+'\n'+(await readFile('src/renderer/search-image.css','utf8'))+'\n'+(await readFile('src/renderer/youtube.css','utf8'))+'\n'+(await readFile('src/renderer/async-image.css','utf8'))+'\n'+(await readFile('src/renderer/income-tracker.css','utf8'))+'\n'+(await readFile('src/renderer/async-video.css','utf8'))+'\n'+(await readFile('src/renderer/follow-up-action-bar.css','utf8'))+'\n'+(await readFile('src/renderer/conversation-suggestions.css','utf8'))+'\n'+(await readFile('src/renderer/image-grid.css','utf8'))+'\n'+(await readFile('src/renderer/upcoming-activity.css','utf8'))+'\n'+(await readFile('src/renderer/spend-month.css','utf8'))+'\n'+(await readFile('src/renderer/supplied-links.css','utf8'))+'\n');
await copyFile('src/schema/iui.schema.json','cdn/iui.schema.json');
await copyFile('LICENSE','cdn/LICENSE.txt');
await copyFile('THIRD_PARTY_NOTICES.md','cdn/THIRD_PARTY_NOTICES.md');
// Copy the closed discovery bundles into the same fixed CDN snapshot.
const schemaFiles=[];
async function copySchemaDirectory(relative=''){
  const source='src/schema/fragments'+(relative?'/'+relative:''),target='cdn/schema'+(relative?'/'+relative:'');await mkdir(target,{recursive:true});
  for(const entry of (await readdir(source,{withFileTypes:true})).sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0)){
    const name=relative?relative+'/'+entry.name:entry.name;
    if(entry.isDirectory())await copySchemaDirectory(name);
    else if(entry.isFile()&&entry.name.endsWith('.json')){await copyFile(source+'/'+entry.name,target+'/'+entry.name);schemaFiles.push('schema/'+name);}
    else throw Error('Unexpected generated schema file: '+name);
  }
}
await mkdir('cdn/schema/nodes',{recursive:true});
await assertSchemaDirectoryContents('cdn/schema');
await copySchemaDirectory();
await assertSchemaDirectoryContents('cdn/schema',{complete:true});
const manifest={schema:'iui/1',libraryVersion:JSON.parse(await readFile('package.json','utf8')).version,fonts:'KaTeX 0.18.2: official MIT WOFF2 assets, relative to this CSS. HTML visual output and accessible MathML.',files:{}};
for(const name of ['iui.min.js','iui.min.js.map','iui.global.min.js','iui.global.min.js.map','iui.css','iui.schema.json','LICENSE.txt','THIRD_PARTY_NOTICES.md','fonts/LICENSE.txt',...math.fonts.map(name=>'fonts/'+name),...schemaFiles]){
  const bytes=await readFile(`cdn/${name}`);manifest.files[name]={bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),integrity:'sha384-'+createHash('sha384').update(bytes).digest('base64')};
}
await writeFile('cdn/integrity.json',JSON.stringify(manifest,null,2)+'\n');
