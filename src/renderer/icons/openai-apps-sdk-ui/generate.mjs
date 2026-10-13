import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
const base=new URL('./',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('manifest.json',base),'utf8'));
const blob=content=>createHash('sha1').update('blob '+Buffer.byteLength(content)+'\0').update(content).digest('hex');
const license=await readFile(new URL('LICENSE',base),'utf8');
if(blob(license)!==manifest.license.gitBlobSha)throw new Error('Official icon license blob differs');
for(const source of manifest.supportingSources??[]){const content=await readFile(new URL('upstream/'+source.file,base),'utf8');if(blob(content)!==source.gitBlobSha)throw new Error('Official supporting source blob differs: '+source.file);}
const attrs=text=>Object.fromEntries([...text.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([,key,value])=>[({fillRule:'fill-rule',clipRule:'clip-rule',strokeWidth:'stroke-width',strokeLinecap:'stroke-linecap',strokeLinejoin:'stroke-linejoin'}[key]??key),value]));
const geometry={};
for(const icon of manifest.icons){
 const source=await readFile(new URL('upstream/'+icon.name+'.tsx.txt',base),'utf8');
 if(blob(source)!==icon.gitBlobSha)throw new Error('Official icon source blob differs: '+icon.name);
 const match=source.match(/<svg\s+([^>]+)>([\s\S]*?)<\/svg>/);
 if(!match)throw new Error('No SVG: '+icon.name);
 const root=attrs(match[1]); delete root.width;delete root.height;
 if(root.viewBox!=='0 0 24 24'||root.fill!=='currentColor')throw new Error('Unexpected root: '+icon.name);
 const shapes=[...match[2].matchAll(/<(path|circle|rect|line|polyline|polygon|ellipse)\s+([^>]*?)\/>/g)].map(([,tag,attributes])=>[tag,attrs(attributes)]);
 const remainder=match[2].replace(/<(path|circle|rect|line|polyline|polygon|ellipse)\s+[^>]*?\/>/g,'').trim();
 if(remainder||!shapes.length)throw new Error('Unsupported nested or dynamic SVG: '+icon.name);
 for(const [,attributes] of shapes)for(const [key,value]of Object.entries(attributes))if(/^(?:on|href|xlink:|style|id)/i.test(key)||/url\(/i.test(value))throw new Error('Unsafe SVG attribute: '+icon.name);
 geometry[icon.name]={attrs:root,shapes};
}
const result='/*!\nOpenAI Apps SDK UI icons, commit '+manifest.commit+'.\n'+license+'*/\n\n/** Generated from the pinned upstream files by generate.mjs. Do not edit geometry. */\nexport const officialIconGeometry = '+JSON.stringify(geometry,null,2)+' as const;\n';
if(process.argv.includes('--check')){if(await readFile(new URL('geometry.ts',base),'utf8')!==result)throw new Error('Official icon geometry is stale');}
else await writeFile(new URL('geometry.ts',base),result);
