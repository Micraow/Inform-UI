import {build} from 'esbuild';
import {mkdir,readFile,writeFile,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
await mkdir('cdn',{recursive:true});
const options={entryPoints:['src/browser.ts'],bundle:true,platform:'browser',target:'es2022',minify:true,sourcemap:'external',sourcesContent:false,loader:{'.css':'text'},legalComments:'eof',metafile:true,logLevel:'info'};
for(const [name,format] of [['iui.min.js','esm'],['iui.global.min.js','iife']]){
  const result=await build({...options,format,outfile:`cdn/${name}`,...(format==='iife'?{globalName:'IUI'}:{})});
  for(const [file,metadata]of Object.entries(result.metafile.outputs))if(file.endsWith('.js')&&metadata.imports.length)throw new Error(`CDN bundle has unresolved dependencies: ${file}`);
}
await copyFile('src/renderer/style.css','cdn/iui.css');
await copyFile('src/schema/iui.schema.json','cdn/iui.schema.json');
await copyFile('LICENSE','cdn/LICENSE.txt');
await copyFile('THIRD_PARTY_NOTICES.md','cdn/THIRD_PARTY_NOTICES.md');
const manifest={schema:'iui/1',libraryVersion:JSON.parse(await readFile('package.json','utf8')).version,fonts:'No font assets required; MathML uses the browser/system math font.',files:{}};
for(const name of ['iui.min.js','iui.min.js.map','iui.global.min.js','iui.global.min.js.map','iui.css','iui.schema.json','LICENSE.txt','THIRD_PARTY_NOTICES.md']){
  const bytes=await readFile(`cdn/${name}`);manifest.files[name]={bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),integrity:'sha384-'+createHash('sha384').update(bytes).digest('base64')};
}
await writeFile('cdn/integrity.json',JSON.stringify(manifest,null,2)+'\n');
