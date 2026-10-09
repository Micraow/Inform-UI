import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateDocument,compileHtml} from '../dist/index.js';
for(const name of ['loading-numeric-progress','loading-placeholder-shapes','supplied-source-reading'])test(`original loading/source consumer ${name} validates and compiles deterministically`,async()=>{
 const input=JSON.parse(await readFile(new URL(`./consumer/examples/${name}.json`,import.meta.url),'utf8')),before=structuredClone(input),result=validateDocument(input);
 assert.equal(result.ok,true,JSON.stringify(result.issues));assert.equal(await compileHtml(input,{lang:'zh-CN'}),await compileHtml(input,{lang:'zh-CN'}));assert.deepEqual(input,before);
});
