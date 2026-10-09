import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {validateDocument,compileHtml} from '../dist/index.js';
import {vocab,documentOf} from './vocab-harness.mjs';
const require=createRequire(import.meta.url),structural=require('../src/schema/validator.cjs');
const fixture=JSON.parse(await readFile(new URL('../examples/vocab-card.json',import.meta.url),'utf8'));

test('vocab: public document, structural learning subset and deterministic compiler',async()=>{
  assert.equal(validateDocument(fixture).ok,true);assert.equal(structural(fixture),true);
  const schema=JSON.parse(await readFile(new URL('../src/schema/fragments/learning.schema.json',import.meta.url),'utf8'));
  assert.ok(schema.$defs.VocabCardNode);assert.ok(schema.$defs.VocabSense);
  assert.equal(schema.$defs.VocabCardNode.additionalProperties,false);
  const a=await compileHtml(fixture);assert.equal(a,await compileHtml(fixture));assert.match(a,/vocab-card/);
});

test('vocab: required, unknown, type, enum-like aliases and bounded fields reject strictly',async()=>{
  const cases=JSON.parse(await readFile(new URL('./fixtures/vocab-invalid.json',import.meta.url),'utf8'));
  for(const {name,document} of cases)assert.equal(validateDocument(document).ok,false,name);
  for(const field of ['term','languageLabel','pronunciation','partOfSpeech']){
    const max=field==='pronunciation'?500:200;
    for(const value of ['',null,1,{},[],false,'x'.repeat(max+1)]){
      assert.equal(validateDocument(documentOf(vocab({[field]:value}))).ok,false,`${field}: ${JSON.stringify(value).slice(0,50)}`);
    }
    assert.equal(validateDocument(documentOf(vocab({[field]:'x'.repeat(max)}))).ok,true,field);
  }
  for(const field of ['meaning','translation']){
    const max=field==='meaning'?2000:1000;
    assert.equal(validateDocument(documentOf(vocab({senses:[{id:'sense',meaning:'Meaning',[field]:'x'.repeat(max)}]}))).ok,true,field);
    for(const value of [null,1,{},[],false,'x'.repeat(max+1),...(field==='meaning'?['']:[])]){
      assert.equal(validateDocument(documentOf(vocab({senses:[{id:'sense',meaning:'Meaning',[field]:value}]}))).ok,false,`${field} invalid`);
    }
  }
});

test('vocab: Unicode code-point limits retain exact literal strings',()=>{
  for(const count of [199,200]){
    const term='😀'.repeat(count),result=validateDocument(documentOf(vocab({term})));
    assert.equal(result.ok,true);assert.equal(result.document.body[0].term,term);
  }
  assert.equal(validateDocument(documentOf(vocab({term:'😀'.repeat(201)}))).ok,false);
  const literal='e\u0301\r\nالعربية\u2028\u2029<script>globalThis.x=1</script>';
  const result=validateDocument(documentOf(vocab({term:literal,senses:[{id:'s',meaning:literal,translation:literal,examples:[literal]}]})));
  assert.equal(result.ok,true);assert.equal(result.document.body[0].term,literal);
  assert.equal(result.document.body[0].senses[0].examples[0],literal);
});

test('vocab: sense and example counts, required ids and distinct local identity',()=>{
  const sense=i=>({id:`sense_${i}`,meaning:'Meaning'});
  for(const count of [1,10])assert.equal(validateDocument(documentOf(vocab({senses:Array.from({length:count},(_,i)=>sense(i))}))).ok,true);
  for(const count of [0,11])assert.equal(validateDocument(documentOf(vocab({senses:Array.from({length:count},(_,i)=>sense(i))}))).ok,false);
  for(const id of ['', 'x'.repeat(81),'1bad','space key','a/b'])assert.equal(validateDocument(documentOf(vocab({senses:[{id,meaning:'Meaning'}]}))).ok,false,id);
  assert.equal(validateDocument(documentOf(vocab({senses:[{id:'s'+'x'.repeat(79),meaning:'Meaning'}]}))).ok,true);
  const duplicate=validateDocument(documentOf(vocab({senses:[sense(1),sense(1)]})));
  assert.equal(duplicate.ok,false);assert.deepEqual(duplicate.issues[0],{code:'VOCAB_SENSE_ID',path:'/body/0/senses/1/id',message:'Sense ids must be unique within a vocabulary card.'});
  assert.equal(validateDocument({version:'iui/1',body:[vocab(),vocab()]}).ok,true);
  for(const examples of [[],['Example'],Array(5).fill('x'.repeat(2000))])assert.equal(validateDocument(documentOf(vocab({senses:[{...sense(1),examples}]}))).ok,true);
  for(const examples of [Array(6).fill('Example'),[''],[null],['x'.repeat(2001)],'Example'])assert.equal(validateDocument(documentOf(vocab({senses:[{...sense(1),examples}]}))).ok,false);
});

test('vocab: ordinary text, depth and document node budgets still apply',()=>{
  const manySenses=Array.from({length:10},(_,i)=>({id:`s${i}`,meaning:'x'.repeat(2000),examples:Array(5).fill('x'.repeat(2000))}));
  const text=validateDocument({version:'iui/1',body:Array.from({length:20},()=>vocab({senses:manySenses}))});
  assert.equal(text.ok,false);assert.ok(text.issues.some(i=>i.code==='TEXT_LIMIT'));
  let nested=vocab();for(let i=0;i<64;i++)nested={type:'box',children:[nested]};
  const depth=validateDocument({version:'iui/1',body:[nested]});assert.equal(depth.ok,false);assert.ok(depth.issues.some(i=>i.code==='DEPTH_LIMIT'));
  const nodes=validateDocument({version:'iui/1',body:Array.from({length:5},()=>({type:'box',children:Array.from({length:401},()=>({type:'vocab-card',term:'x',senses:[{id:'s',meaning:'y'}]}))}))});
  assert.equal(nodes.ok,false);assert.ok(nodes.issues.some(i=>i.code==='NODE_LIMIT'));
});
