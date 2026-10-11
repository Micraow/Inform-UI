import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {compileArtifact} from '../dist/index.js';
const doc = JSON.parse(await readFile(new URL('../examples/learning-media.json',import.meta.url),'utf8'));
const directives = html => new Map(html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1].replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/&amp;/g,'&').split(';').map(row=>{const [name,...sources]=row.trim().split(/\s+/);return[name,sources]}));
for (const assets of ['inline','shared']) test(`${assets} HTML grants only inline audio required by supplied LearningMedia`,async()=>{
 const {html}=await compileArtifact(doc,{assets}),csp=directives(html);
 assert.deepEqual(csp.get('media-src'),['data:'],'default-src none otherwise blocks the supplied audio');
 assert.deepEqual(csp.get('connect-src'),["'none'"]);
});
test('external audio policy authorizes only the supplied origin and does not globally allow HTTPS media',async()=>{
 const input=structuredClone(doc);input.body=[input.body[2]];input.body[0].audio.src='https://media.example.org:8443/tone.wav';
 const csp=directives((await compileArtifact(input)).html);
 assert.deepEqual(csp.get('media-src'),['https://media.example.org:8443']);
 assert.deepEqual(csp.get('connect-src'),["'none'"]);
});
test('documents without audio retain their restrictive default with no extra media authority',async()=>{
 const csp=directives((await compileArtifact({version:'iui/1',body:[{type:'text',value:'No audio'}]})).html);
 assert.deepEqual(csp.get('default-src'),["'none'"]);assert.equal(csp.has('media-src'),false);
});
test('audio inside ordinary Box layouts contributes a deduplicated bounded policy',async()=>{
 const inline=structuredClone(doc.body[2]),external=structuredClone(inline);external.id='external-audio';external.audio.src='https://media.example.org/tone.wav';
 const duplicate={...structuredClone(external),id:'duplicate-origin'};
 const input={version:'iui/1',body:[{type:'box',children:[inline,{type:'box',children:[external,duplicate]}]}]};
 const csp=directives((await compileArtifact(input)).html);
 assert.deepEqual(new Set(csp.get('media-src')),new Set(['data:','https://media.example.org']));assert.equal(csp.get('media-src').length,2);
 assert.deepEqual(csp.get('connect-src'),["'none'"]);
});
test('nested audio collects exact sorted unique origins and case-insensitive inline schemes',async()=>{const a=structuredClone(doc.body[2]);delete a.id;a.audio.src=a.audio.src.replace(/^data:/,'DATA:');const b=structuredClone(doc.body[2]);delete b.id;b.audio.src='https://media.example.org/tone.wav';const input={version:'iui/1',body:[{type:'box',children:[b,a,structuredClone(b)]}]};const policy=directives((await compileArtifact(input)).html);assert.deepEqual(policy.get('media-src'),['data:','https://media.example.org']);assert.deepEqual(policy.get('connect-src'),["'none'"]);});
test('supplied image origins do not grant audio permission',async()=>{const input=structuredClone(doc);input.body=[input.body[1]];input.body[0].image.src='https://images.example.org/square.png';assert.equal(directives((await compileArtifact(input)).html).has('media-src'),false);});
