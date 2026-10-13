import {iconAliases} from './build-aliases.mjs';
import fs from 'node:fs';import {execFileSync} from 'node:child_process';import path from 'node:path';import {gzipSync} from 'node:zlib';import {build} from 'esbuild';import * as sass from 'sass';
const common={bundle:true,loader:{'.css':'text'},alias:iconAliases,target:'es2022',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},legalComments:'linked',minify:true,metafile:true};
fs.rmSync('dist',{recursive:true,force:true});fs.mkdirSync('dist',{recursive:true});
const node=await build({...common,entryPoints:['src/eager.ts'],outfile:'dist/index.mjs',platform:'node',format:'esm',packages:'external'});
const eager=await build({...common,entryPoints:['src/eager.ts'],outfile:'dist/inform-charts.js',platform:'browser',format:'iife',globalName:'InformCharts'});
const split=await build({...common,entryPoints:{'inform-charts':'src/index.ts'},outdir:'dist/esm',platform:'browser',format:'esm',splitting:true,chunkNames:'chunks/[name]-[hash]'});
const css=sass.compile('src/chart-styles.scss',{style:'compressed',logger:sass.Logger.silent});fs.writeFileSync('dist/inform-charts.css',css.css);
fs.writeFileSync('generated/build-metafile.json',JSON.stringify(eager.metafile,null,2));
execFileSync(process.execPath,['scripts/notices.mjs'],{stdio:'inherit'});
const licenseRecords=JSON.parse(fs.readFileSync('generated/dependency-licenses.json'));
const grouped=new Map();for(const record of licenseRecords){const text=fs.readFileSync(record.file,'utf8');const prior=grouped.get(text)??[];prior.push(record.name+' '+record.version);grouped.set(text,prior);}
const notice='OpenUI cf615ae1401d78eee1a4dcc1ef0e2e6d61f373d7\n'+fs.readFileSync('vendor/openui/LICENSE','utf8')+'\n\nOfficial OpenAI icons\n'+fs.readFileSync('licenses/OpenAI-official-icons.txt','utf8')+'\n\n'+[...grouped].map(([text,names])=>names.join(', ')+'\n'+text).join('\n\n');
fs.writeFileSync('dist/THIRD_PARTY_NOTICES.txt',notice);
const eagerFile=fs.readFileSync('dist/inform-charts.js','utf8');fs.writeFileSync('dist/inform-charts.js','/*!\n'+notice.replaceAll('*/','* /')+'\n*/\n'+eagerFile);
const report={upstream:'cf615ae1401d78eee1a4dcc1ef0e2e6d61f373d7',familyCount:14,registeredNames:16,eager:{bytes:fs.statSync('dist/inform-charts.js').size,gzip:gzipSync(fs.readFileSync('dist/inform-charts.js')).length},css:{bytes:Buffer.byteLength(css.css),gzip:gzipSync(css.css).length},split:Object.entries(split.metafile.outputs).map(([file,info])=>({file,bytes:info.bytes,gzip:gzipSync(fs.readFileSync(file)).length,imports:info.imports.map(i=>({path:i.path,kind:i.kind}))})),externalImports:eager.metafile.outputs['dist/inform-charts.js'].imports};
fs.writeFileSync('generated/bundle-report.json',JSON.stringify(report,null,2));fs.writeFileSync('generated/build-metafile.json',JSON.stringify(eager.metafile,null,2));fs.writeFileSync('generated/style-closure.json',JSON.stringify(css.loadedUrls.map(u=>path.relative(process.cwd(),u.pathname)),null,2));console.log(JSON.stringify({eager:report.eager,css:report.css,splitFiles:report.split.length,externalImports:report.externalImports}));
