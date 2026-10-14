import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createDefaultProfile,createRuntime} from '../dist/v2/node.mjs';
import {createDesignExamples} from '../showcase-next/design-examples.mjs';
import {samples as curatedSamples} from '../showcase-next/examples.mjs';
const profile=createDefaultProfile();
const answer=await readFile('showcase-next/answer.openui','utf8');
const samples={};
const video='data:video/mp4;base64,'+(await readFile('showcase/assets/video/motion-study.mp4')).toString('base64');
const captions='data:text/vtt;base64,'+(await readFile('showcase/assets/video/motion-study.vtt')).toString('base64');
const videoExpression='Video('+JSON.stringify(video)+',"An original motion study",'+JSON.stringify(curatedSamples.Image.match(/data:image\/png;base64,[A-Za-z0-9+/=]+/)[0])+',[{src:'+JSON.stringify(captions)+',label:"English descriptions",language:"en"}])';
const catalog=JSON.parse(await readFile('src/icons/catalog.json','utf8'));
for(const component of Object.values(profile.components)){
 let source=curatedSamples[component.name]??component.examples?.[0]?.source;
 if(component.name==='Video')source='root=Stack(['+videoExpression+',Text("Original, silent example media. Captions describe the animation.","muted")])';
 if(component.name==='YoutubeView')source='root=Stack([Text("Use native Video for playback. This separate service reference has no third-party playback authority.","muted"),'+component.examples[0].source.replace(/^root\s*=\s*Stack\(\[/,'').replace(/\]\)\s*$/,'')+','+videoExpression+'])';
 if(!source)throw Error('Missing meaningful runnable example: '+component.name);
 if(!/^root\s*=\s*Stack\s*\(/m.test(source)){
  const match=/^root\s*=\s*/m.exec(source);
  if(!match)throw Error('Example has no root: '+component.name);
  source=source.slice(0,match.index)+'root=Stack(['+source.slice(match.index+match[0].length).trim().replace(/;$/,'')+'])';
 }
 samples[component.name]=source;
}
const designExamples=createDesignExamples(curatedSamples.Image.match(/data:image\/png;base64,[A-Za-z0-9+/=]+/)[0]);
for(const example of designExamples)samples[example.id]=example.source;
designExamples.push({id:"LayeredWork",title:"Build with basic parts",layer:"composition",description:"Equal partitions, aligned labels and a summary made only from general foundation components.",source:await readFile("examples/v2/layered-work.openui","utf8")});
samples.LayeredWork=designExamples.at(-1).source;
for(const [id,title,file,description]of [
 ['ArrayOverview','Read an array','array-overview','A static array with a supplied minimum highlighted.'],
 ['ArraySteps','Step through local state','array-steps','Previous and Next update a bounded local index, highlights and explanations.'],
 ['VerticalSteps','A vertical explanation','vertical-steps','Three ordinary text sections connected by text arrows.'],
 ['DocumentComparison','Compare document approaches','document-comparison','Original schematic document blocks and two responsive comparison cards.']
]){const source=await readFile('examples/v2/'+file+'.openui','utf8');designExamples.push({id,title,layer:'composition',description,source});samples[id]=source;}
const colorTokens=JSON.parse(await readFile('docs/color-tokens.json','utf8'));
for(const [name,source]of Object.entries({Answer:answer,...samples})){const runtime=createRuntime(profile);const result=runtime.commit(source);runtime.dispose();if(!result.ok)throw Error(name+': '+JSON.stringify(result.issues));}
const manifest=profile.manifest();
const selectionCatalog={components:manifest.components.map(({name,moduleId})=>({name,moduleId})),dataShapes:manifest.dataShapes.map(({name,moduleId})=>({name,moduleId}))};
const data={designExamples,colorTokens,selectionCatalog,version:'2.0.0-alpha.1',phase:'Architecture preview',sourceCount:Object.keys(profile.components).length,iconCount:catalog.iconCount,icons:catalog.icons.map(({name,category,aliases,keywords})=>({name,category,aliases,keywords})),answer,samples,components:Object.values(profile.components).map(c=>({name:c.name,layer:c.layer,description:c.description,docs:c.docs,params:c.orderedProps})),prompt:profile.prompt({bindings:true,builtinFunctions:true}),schema:profile.schema};
const escape=value=>JSON.stringify(value).replace(/[<>&\u2028\u2029]/g,c=>({'<':'\\u003c','>':'\\u003e','&':'\\u0026','\u2028':'\\u2028','\u2029':'\\u2029'}[c]));
const runtime=await readFile('dist/v2/inform-ui.global.js','utf8');
let html=await readFile('showcase-next/index.html','utf8');
const css=await readFile('showcase-next/style.css','utf8');const font=await readFile('src/renderer/code-font.css','utf8');
const app=await build({entryPoints:['showcase-next/app.js'],bundle:true,write:false,format:'iife',platform:'browser',target:'es2022',minify:true});const js=app.outputFiles[0].text;const licenses=await readFile('dist/v2/THIRD_PARTY_NOTICES.txt','utf8')+'\n'+await readFile('src/renderer/fonts/source-code-pro/LICENSE.md','utf8');
html=html.replace('<!-- STYLE -->',()=>`<style>${font}\n${css}</style>`).replace('<!-- DATA -->',()=>`<script id="showcase-data" type="application/json">${escape(data)}</script><script id="showcase-license" type="application/json">${escape(licenses)}</script>`).replace('<!-- SCRIPT -->',()=>`<script>${runtime.replace(/<\/script/gi,'<\\/script')}</script><script>${js.replace(/<\/script/gi,'<\\/script')}</script>`);
await mkdir('output/next',{recursive:true});await writeFile('output/next/Inform-UI-Next-All-Components.html',html);console.log(JSON.stringify({bytes:Buffer.byteLength(html),sha256:createHash('sha256').update(html).digest('hex'),components:data.sourceCount,icons:755}));
