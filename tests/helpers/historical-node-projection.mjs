import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
// Explicit reviewed registrations after the frozen130 source, not a dynamic allowlist.
const added=new Set(JSON.parse(readFileSync(new URL('./post130-node-refs.json',import.meta.url),'utf8')));
export const projectHistorical130=refs=>refs.filter(ref=>!added.has(ref.$ref));

// Approved link156 additions are checked in full before projecting the primitive
// contract. Existing fields and all unrelated definitions are still hashed exactly.
const approvedLink=JSON.parse(readFileSync(new URL('./approved-link156-definition.json',import.meta.url),'utf8'));
const approvedWeather=JSON.parse(readFileSync(new URL('./approved-weather178-definition.json',import.meta.url),'utf8'));
const linkAdditions=['url','title','status','fallback','disabled','source','snippet','faviconSrc','imageSrc','mobile','hostLink','copyLabel','loadImageLabel','children'];
const approvedCode=JSON.parse(readFileSync(new URL('./approved-code-foundation-definition.json',import.meta.url),'utf8'));
// Only the reviewed showLanguage addition is removed; every previous Code field
// and every unrelated definition still compares against its immutable baseline.
export function projectCodeFoundationDefinition(name,definition){
 if(name!=='CodeNode')return definition;
 assert.deepEqual(definition,approvedCode,'Code foundation extension must equal its reviewed definition before historical projection');
 const old=structuredClone(definition);delete old.properties.showLanguage;
 for(const branch of old.oneOf)delete branch.properties.showLanguage;
 return old;
}
export function projectHistoricalDefinition(name, definition){
 definition=projectCodeFoundationDefinition(name,definition);
 if(name==='WeatherNode'){
  assert.deepEqual(definition,approvedWeather,'Weather178 optional extension must equal its reviewed definition before historical projection');
  const copy=structuredClone(definition),p=copy.properties;
  for(const key of ['presentation','initialMetric','initialUnit','useCurrent','showDatePicker','disabled','regionLabel','tableDateLabel','resetLabel','requestedLabel','cancelledLabel','labels','share','locationAction','followUps','chartWindow'])delete p[key];
  for(const key of ['description','temperatureLabels'])delete p.current.properties[key];
  for(const key of ['label','description','highLabels','lowLabels','followUps'])delete p.daily.items.properties[key];
  for(const key of ['label','description','condition','temperatureLabels'])delete p.hourly.items.properties[key];return copy;
 }
 if(name!=='LinkNode')return definition;
 assert.deepEqual(definition,approvedLink,'Link156 extension must equal its explicitly reviewed definition before historical projection');
 const old=structuredClone(definition);for(const name of linkAdditions)delete old.properties[name];old.required=['type','value','href'];delete old.anyOf;return old;
}
