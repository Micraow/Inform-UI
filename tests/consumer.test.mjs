import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateDocument,compileHtml} from '../dist/index.js';
for(const name of ['foundation-explainer','local-time','local-overlays','local-number-draft','timed-local-practice','local-status-primitives','primitives-with-form-and-time']) {
  test(`original Skill consumer ${name} validates and compiles deterministically`,async()=>{
    const input=JSON.parse(await readFile(`tests/consumer/examples/${name}.json`,'utf8'));
    const result=validateDocument(input);assert.equal(result.ok,true,JSON.stringify(result.issues));
    const first=await compileHtml(input,{lang:'zh-CN'}),second=await compileHtml(input,{lang:'zh-CN'});
    assert.equal(first,second);assert.match(first,/<!doctype html>/i);
  });
}
