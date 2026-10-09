import {readFile,mkdir,writeFile,readdir} from 'node:fs/promises';import {compileArtifact} from '../dist/index.js';
await mkdir('output',{recursive:true});
for(const file of (await readdir('examples')).filter(f=>f.endsWith('.json'))){const input=JSON.parse(await readFile(`examples/${file}`,'utf8'));const {html}=await compileArtifact(input,{lang:'zh-CN'});await writeFile(`output/${file.replace('.json','.html')}`,html);}
const shared=await compileArtifact(JSON.parse(await readFile('examples/rtt.json','utf8')),{assets:'shared',lang:'zh-CN'});await writeFile('output/shared.html',shared.html);for(const[p,v]of Object.entries(shared.assets)){await mkdir(`output/${p.slice(0,p.lastIndexOf('/'))}`,{recursive:true});await writeFile(`output/${p}`,v);}
await writeFile('output/mount.html','<!doctype html><html><body><div id="host"></div><script type="module">import * as iui from "/dist/browser.js";window.iui=iui;</script></body></html>');
