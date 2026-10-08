#!/usr/bin/env node
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {validateDocument,compileArtifact} from '../dist/index.js';
const args=process.argv.slice(2),command=args.shift();
const usage='Usage: iui validate <file.json> [--json]\n       iui build <file.json> --out <file.html> [--assets inline|shared] [--lang en|zh-CN]\n       iui inspect <file.json>\n       iui doctor';
function option(name,fallback){const i=args.indexOf(name);if(i<0)return fallback;const value=args[i+1];if(!value||value.startsWith('--'))throw new Error(`${name} requires a value`);args.splice(i,2);return value;}
try{
  if(!command||command==='--help'||command==='help'){console.log(usage);process.exit(0);}
  if(command==='doctor'){if(args.length)throw new Error('Unexpected arguments');console.log(JSON.stringify({node:process.version,schema:'iui/1',backend:'portable',npmPublished:false,pythonRequired:false},null,2));process.exit(0);}
  const jsonIndex=args.indexOf('--json'),json=jsonIndex>=0;if(json)args.splice(jsonIndex,1);
  const out=option('--out'),assets=option('--assets','inline'),lang=option('--lang','en');
  const file=args.shift();if(!file||args.length)throw new Error(usage);
  if(!['validate','build','inspect'].includes(command))throw new Error(usage);
  if((await stat(file)).size>2_000_000)throw new Error('Input exceeds 2 MB limit');
  if(out&&resolve(out)===resolve(file))throw new Error('Output must not overwrite the input JSON');
  const raw=await readFile(file,'utf8');if(Buffer.byteLength(raw)>2_000_000)throw new Error('Input exceeds 2 MB limit');
  let input;try{input=JSON.parse(raw);}catch{throw new Error('Input is not valid JSON');}
  const result=validateDocument(input);
  if(!result.ok){console[json?'log':'error'](json?JSON.stringify(result,null,2):result.issues.map(i=>`${i.code} ${i.path}: ${i.message}`).join('\n'));process.exitCode=1;}
  else if(command==='validate'){console.log(json?JSON.stringify({ok:true,version:result.document.version}):`${file}: valid iui/1 document`);}
  else if(command==='inspect'){const types={};const walk=n=>{if(n&&typeof n==='object'){if(typeof n.type==='string')types[n.type]=(types[n.type]??0)+1;for(const v of Object.values(n))if(typeof v==='object')Array.isArray(v)?v.forEach(walk):walk(v);}};walk(result.document);console.log(JSON.stringify({version:result.document.version,backend:'portable',nodes:types,state:Object.keys(result.document.state??{}),computed:Object.keys(result.document.computed??{})},null,2));}
  else {if(!out)throw new Error('--out is required');const artifact=await compileArtifact(result.document,{assets,lang});await mkdir(dirname(resolve(out)),{recursive:true});for(const [name,content]of Object.entries(artifact.assets)){const target=resolve(dirname(out),name);await mkdir(dirname(target),{recursive:true});await writeFile(target,content);}await writeFile(out,artifact.html);console.log(`Built ${out} (${assets}, ${Buffer.byteLength(artifact.html)} bytes)`);}
}catch(error){console.error(error instanceof Error?error.message:String(error));process.exitCode=2;}
