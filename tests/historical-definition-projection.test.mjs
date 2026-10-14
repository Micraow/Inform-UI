import {createHash} from 'node:crypto';
import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {projectHistoricalDefinition} from './helpers/historical-node-projection.mjs';
const full=JSON.parse(await readFile(new URL('../src/schema/iui.schema.json',import.meta.url),'utf8')),legacy=JSON.parse(await readFile(new URL('./helpers/legacy-link154-definition.json',import.meta.url),'utf8'));
test('reviewed link extension projects to exact unchanged legacy primitive',()=>assert.deepEqual(projectHistoricalDefinition('LinkNode',full.$defs.LinkNode),legacy));
test('projection cannot conceal changes to old or newly approved link fields',()=>{for(const change of [d=>d.properties.href.maxLength=5,d=>d.properties.title.maxLength=1,d=>d.properties.unreviewed={type:'string'},d=>d.anyOf.pop()]){const d=structuredClone(full.$defs.LinkNode);change(d);assert.throws(()=>projectHistoricalDefinition('LinkNode',d));}});
test('projection leaves every unrelated definition unchanged',()=>{for(const[name,definition]of Object.entries(full.$defs))if(!['LinkNode','WeatherNode','CodeNode'].includes(name))assert.equal(projectHistoricalDefinition(name,definition),definition);});

test('reviewed Weather optional extension preserves the exact historical schema hash',()=>{const projected=projectHistoricalDefinition('WeatherNode',full.$defs.WeatherNode);assert.equal(createHash('sha256').update(JSON.stringify(projected)).digest('hex'),'1f250f183023609b0c8535355c6f7a6cce07620cb8b097d60e14aa15cd9b63f9');});
test('Weather projection cannot hide altered legacy or newly approved optional fields',()=>{for(const change of[d=>d.required.pop(),d=>d.properties.presentation.enum.push('map'),d=>d.properties.unreviewed={type:'string'},d=>d.properties.current.properties.temperatureLabels.required.pop(),d=>d.properties.labels.additionalProperties=true]){const d=structuredClone(full.$defs.WeatherNode);change(d);assert.throws(()=>projectHistoricalDefinition('WeatherNode',d));}});


test('reviewed Code showLanguage extension preserves the exact historical schema hash',()=>{
 const original=structuredClone(full.$defs.CodeNode),projected=projectHistoricalDefinition('CodeNode',original);
 assert.equal(createHash('sha256').update(JSON.stringify(projected)).digest('hex'),'498e580c6efbd182a38f66876e153676b1f4edd9554b2de87ee73cbf863132b3');
 assert.deepEqual(original,full.$defs.CodeNode,'projection must not mutate the current definition');
});
test('Code projection cannot hide altered old or newly approved fields',()=>{
 for(const change of [d=>d.required.pop(),d=>d.properties.value.maxLength=1,d=>d.properties.copy.type='string',d=>d.properties.showLanguage.type='string',d=>d.oneOf[0].properties.showLanguage.const=true,d=>delete d.oneOf[1].properties.highlight,d=>d.properties.unreviewed={type:'string'}]){
  const definition=structuredClone(full.$defs.CodeNode);change(definition);assert.throws(()=>projectHistoricalDefinition('CodeNode',definition));
 }
});
