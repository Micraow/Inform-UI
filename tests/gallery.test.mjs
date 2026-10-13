import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pages} from '../showcase/gallery-data.js';
import {validateDocument} from '../dist/index.js';
import {nodeTypes} from '../scripts/showcase-catalog.mjs';
const samples=pages.flatMap(p=>p.columns.flat());
test('gallery has three landscape collections with unique, complete examples',()=>{
 assert.deepEqual(pages.map(p=>p.id),['create','explore','compose']);
 assert.equal(new Set(samples.map(s=>s.id)).size,samples.length);
 assert.equal(samples.length,24);assert.ok(pages.every(p=>p.columns.length===4));
 for(const sample of samples){assert.ok(sample.label);assert.equal(validateDocument(sample.document).ok,true,sample.id);}
 assert.equal(new Set(samples.flatMap(s=>[...nodeTypes(s.document)])).size,32);
});
test('gallery preserves original, local content and uses safe DOM construction',async()=>{
 const source=await readFile(new URL('../showcase/gallery.js',import.meta.url),'utf8');
 assert.doesNotMatch(source,/\.innerHTML\s*=|insertAdjacentHTML|\beval\(/);
 assert.match(source,/validateDocument\(sample.document\)/);
 assert.match(source,/mount\(host,sample.document\)/);
 assert.match(source,/JSON\.stringify\(sample.document,null,2\)/);
 assert.match(source,/controllers\.forEach\(c=>c.dispose\(\)\)/);
 assert.doesNotMatch(JSON.stringify(pages),/https?:\/\/(?!example\.(?:org|com|invalid))/);
});
test('gallery layout does not restyle or scale the component renderer', async () => {
 const css=await readFile(new URL('../showcase/gallery.css',import.meta.url),'utf8');
 assert.doesNotMatch(css,/\.iui-/,'Component appearance belongs to the runtime, not the gallery wrapper');
 assert.doesNotMatch(css,/\bzoom\s*:|transform\s*:\s*scale/,'Render components at their real size');
});
