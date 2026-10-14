#!/usr/bin/env node
import {readFile,writeFile,mkdir,stat,copyFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createProfile,createRuntime,version} from '../dist/public/index.js';

const usage=`Usage: iui check <answer.openui> [--json] [--select modules] [--views views]
       iui inspect <answer.openui> [--select modules] [--views views]
       iui build <answer.openui> --out <answer.html> [--title title] [--lang language]
                 [--theme light|dark] [--runtime-url url] [--select modules] [--views views]
       iui catalog [--select modules] [--views views]
       iui prompt [--select modules] [--views views]`;
const args=process.argv.slice(2),command=args.shift();
const escapeHTML=value=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const scriptJSON=value=>JSON.stringify(value).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
function parse(){
 const flags={},positional=[];
 const allowed=new Set(['--select','--views',...(command==='check'?['--json']:[]),...(command==='build'?['--out','--title','--lang','--theme','--runtime-url']:[])]);
 for(let i=0;i<args.length;i++){
  const arg=args[i];if(!arg.startsWith('-')){positional.push(arg);continue;}
  if(!allowed.has(arg)||Object.hasOwn(flags,arg))throw Error('Unknown or repeated option: '+arg);
  if(arg==='--json'){flags[arg]=true;continue;}
  const value=args[++i];if(!value||value.startsWith('--'))throw Error(arg+' requires a value');flags[arg]=value;
 }
 return{flags,positional};
}
function list(value){if(value===undefined)return;const values=value.split(',').map(x=>x.trim());if(values.some(x=>!x))throw Error('Module and view lists must contain nonempty names');return values;}
function runtimeURL(value){
 if(value===undefined)return './inform-ui.global.js';
 if(/^https:\/\//i.test(value)){const url=new URL(value);if(url.username||url.password)throw Error('Runtime URL cannot contain credentials');return value;}
 if(/^(?:\.\.?\/|\/[^/])/.test(value)&&!/[\\\u0000-\u0020]/.test(value))return value;
 throw Error('Runtime URL must use HTTPS or an explicit relative path');
}
let runtime;
try{
 if(!command||command==='--help'||command==='help'){console.log(usage);process.exit(0);}
 if(command==='--version'){if(args.length)throw Error('Unexpected arguments');console.log(version);process.exit(0);}
 if(!['check','inspect','build','catalog','prompt'].includes(command))throw Error(usage);
 const {flags,positional}=parse();
 const selection={...(flags['--select']?{select:list(flags['--select'])}:{}),...(flags['--views']?{viewNames:list(flags['--views'])}:{})};
 const profile=createProfile(selection);
 if(command==='catalog'||command==='prompt'){
  if(positional.length)throw Error('Unexpected arguments');
  console.log(command==='catalog'?JSON.stringify(profile.manifest(),null,2):profile.prompt());
 }else{
  if(positional.length!==1)throw Error('Exactly one DSL source file is required');
  const file=positional[0],out=flags['--out'];
  if(out&&resolve(out)===resolve(file))throw Error('Output must not overwrite the input DSL');
  if((await stat(file)).size>200_000)throw Error('Input exceeds 200 KB limit');
  const source=await readFile(file,'utf8');if(Buffer.byteLength(source)>200_000)throw Error('Input exceeds 200 KB limit');
  runtime=createRuntime(profile);const result=runtime.commit(source);
  if(!result.ok){console[flags['--json']?'log':'error'](flags['--json']?JSON.stringify(result,null,2):result.issues.map(i=>`${i.code} ${i.path}: ${i.message}`).join('\n'));process.exitCode=1;}
  else if(command==='check')console.log(flags['--json']?JSON.stringify({ok:true,language:'openui',version}):`${file}: valid DSL`);
  else if(command==='inspect')console.log(JSON.stringify({language:'openui',version,tree:result.snapshot.tree,state:result.snapshot.state},null,2));
  else{
   if(!out)throw Error('--out is required');
   const theme=flags['--theme']??'light';if(!['light','dark'].includes(theme))throw Error('Theme must be light or dark');
   const lang=flags['--lang']??'en';if(!/^[a-zA-Z]{2,8}(?:-[a-zA-Z0-9]{1,8})*$/.test(lang))throw Error('Invalid language tag');
   const url=runtimeURL(flags['--runtime-url']),title=flags['--title']??'Inform UI';
   const html=`<!doctype html>\n<html lang="${escapeHTML(lang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHTML(title)}</title></head><body><main id="answer"></main><script id="inform-source" type="application/json">${scriptJSON({...selection,source,theme})}</script><script src="${escapeHTML(url)}"></script><script>InformUI.mount(document.getElementById('answer'),JSON.parse(document.getElementById('inform-source').textContent));</script></body></html>\n`;
   await mkdir(dirname(resolve(out)),{recursive:true});
   if(!flags['--runtime-url']){
    const assets=resolve(dirname(fileURLToPath(import.meta.url)),'../dist/v2');
    for(const name of ['inform-ui.global.js','THIRD_PARTY_NOTICES.txt']){
     const target=resolve(dirname(out),name);if(target===resolve(file)||target===resolve(out))throw Error('Output asset must not overwrite source or HTML');
     await copyFile(resolve(assets,name),target);
    }
   }
   await writeFile(out,html);console.log(`Built ${out} (${Buffer.byteLength(html)} bytes)`);
  }
 }
}catch(error){console.error(error instanceof Error?error.message:String(error));process.exitCode=2;}
finally{runtime?.dispose();}
