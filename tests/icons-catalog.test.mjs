import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
import {build} from 'esbuild';
import {JSDOM,ResourceLoader} from 'jsdom';
import {parseIconSource,generateIconCatalog,gitBlob,sha256} from '../scripts/build-icon-catalog.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const base=new URL('../src/icons/',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('manifest.json',base),'utf8'));
const catalog=JSON.parse(await readFile(new URL('catalog.json',base),'utf8'));
const compiled=await build({stdin:{contents:"export * from './src/icons/all.ts';export {createIcon} from './src/icons/index.ts';",resolveDir:root},bundle:true,write:false,format:'esm',platform:'node',target:'es2022',legalComments:'eof'});
const {icons,iconNames,iconAliases,getIcon,isIconName,createIcon}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const attributes=element=>Object.fromEntries([...element.attributes].map(({name,value})=>[name,value]));
const jsxAttributes={fillRule:'fill-rule',clipRule:'clip-rule',strokeWidth:'stroke-width',strokeLinecap:'stroke-linecap',strokeLinejoin:'stroke-linejoin',clipPath:'clip-path',className:'class'};
const originalXML=source=>source.match(/<svg[\s\S]*?<\/svg>/)[0].replace(/\s*\{\.\.\.props\}/,'').replace(/\b(fillRule|clipRule|strokeWidth|strokeLinecap|strokeLinejoin|clipPath|className)=/g,(_,key)=>jsxAttributes[key]+'=').replace(/=\{([\d.]+)\}/g,'="$1"');

test('exactly 755 pinned sources, independent modules, MIT and generated catalog stay in sync',async()=>{
  assert.equal(manifest.commit,'0f00143c7a639906f1621fe58e1b6be7b5bea46d');
  assert.equal(manifest.iconCount,755);assert.equal(catalog.iconCount,755);assert.equal(iconNames.length,755);
  assert.equal(catalog.categories.reduce((n,c)=>n+c.count,0),755);
  const license=await readFile(new URL('LICENSE',base),'utf8');
  assert.equal(gitBlob(license),'b8ac8dc0f960bbe0b0cc90cd06d58b672151773f');
  assert.equal(sha256(license),manifest.license.sha256);assert.match(license,/^Copyright 2025 OpenAI\n/);
  assert.ok(compiled.outputFiles[0].text.includes(license.trimEnd()));
  assert.deepEqual((await readdir(new URL('upstream/',base))).sort(),manifest.icons.map(i=>i.name+'.tsx.txt').sort());
  assert.deepEqual((await readdir(new URL('definitions/',base))).sort(),manifest.icons.map(i=>i.name+'.ts').sort());
  assert.deepEqual(catalog.icons.map(i=>i.name),iconNames);
  for(const icon of manifest.icons){
    const source=await readFile(new URL('upstream/'+icon.name+'.tsx.txt',base),'utf8');
    assert.equal(gitBlob(source),icon.gitBlobSha,icon.name);assert.equal(sha256(source),icon.sha256,icon.name);assert.equal(Buffer.byteLength(source),icon.bytes,icon.name);
    assert.deepEqual(JSON.parse(JSON.stringify(parseIconSource(source,icon.name))),icons[icon.name],icon.name);
    const entry=catalog.icons.find(entry=>entry.name===icon.name);
    assert.equal(entry.source.gitBlobSha,icon.gitBlobSha);assert.equal(entry.source.sha256,icon.sha256);assert.equal(entry.importSubpath,'@micraow/inform-ui/icons/'+icon.name);
    assert.ok(catalog.categories.some(c=>c.id===entry.category));assert.ok(entry.keywords.length);
  }
  const result=await generateIconCatalog({check:true});assert.equal(result.iconCount,755);assert.equal(result.aliasCount,catalog.aliases.length);
});

test('all 755 native SVG trees preserve original geometry, hierarchy and attributes',async()=>{
  const dom=new JSDOM('<!doctype html><html><body></body></html>');const doc=dom.window.document,parser=new dom.window.DOMParser();let non24=0,clips=0;
  for(const icon of manifest.icons){
    const source=await readFile(new URL('upstream/'+icon.name+'.tsx.txt',base),'utf8');
    const original=parser.parseFromString(originalXML(source),'image/svg+xml').documentElement;
    assert.notEqual(original.localName,'parsererror',icon.name);
    const actual=createIcon(doc,getIcon(icon.name));
    assert.equal(actual.ownerDocument,doc);assert.equal(actual.namespaceURI,'http://www.w3.org/2000/svg');
    const expectedRoot=attributes(original),actualRoot=attributes(actual);
    if(expectedRoot.class){assert.ok(actual.classList.contains('lucide'));assert.ok(actual.classList.contains('lucide-dot'));}
    delete expectedRoot.class;delete actualRoot.class;
    for(const key of ['aria-hidden','focusable','data-iui-icon'])delete actualRoot[key];
    assert.deepEqual(actualRoot,expectedRoot,icon.name+' root');
    if(original.getAttribute('viewBox')!=='0 0 24 24')non24++;
    const ids=new Map([...actual.querySelectorAll('[id]')].map(node=>[node.id.replace(/^iui-icon-\d+-/,''),node.id]));
    clips+=ids.size;
    function compare(actual,expected){
      assert.equal(actual.localName,expected.localName,icon.name);assert.equal(actual.namespaceURI,'http://www.w3.org/2000/svg');
      const attrs=attributes(expected);if(attrs.id)attrs.id=ids.get(attrs.id);if(attrs['clip-path'])attrs['clip-path']='url(#'+ids.get(attrs['clip-path'].slice(5,-1))+')';
      assert.deepEqual(attributes(actual),attrs,icon.name+' '+expected.localName);
      assert.equal(actual.children.length,expected.children.length,icon.name);[...expected.children].forEach((node,i)=>compare(actual.children[i],node));
    }
    assert.equal(actual.children.length,original.children.length,icon.name);[...original.children].forEach((node,i)=>compare(actual.children[i],node));
    assert.equal(actual.getAttribute('aria-hidden'),'true');assert.equal(actual.getAttribute('focusable'),'false');assert.equal(actual.getAttribute('width'),'1em');
    assert.equal(actual.hasAttribute('tabindex'),false);assert.equal(actual.querySelector('script,style,foreignObject,use,image,animate'),null);
  }
  assert.equal(non24,25);assert.equal(clips,5);dom.window.close();
});

test('local clip references are resolved and isolated across repeated detached and attached icons',()=>{
  const dom=new JSDOM('<!doctype html><body></body>');const doc=dom.window.document;
  for(const name of ['DownloadGifWatermark','Linear','OpenaiLogoBold','OpenaiLogoRegular','Zendesk']){
    const instances=Array.from({length:3},()=>createIcon(doc,getIcon(name)));
    const ids=instances.flatMap(icon=>[...icon.querySelectorAll('[id]')].map(node=>node.id));assert.equal(new Set(ids).size,ids.length);
    for(const icon of instances){for(const node of icon.querySelectorAll('[clip-path]')){const id=node.getAttribute('clip-path').slice(5,-1);assert.ok(icon.querySelector('[id="'+id+'"]'));}doc.body.append(icon);}
  }
  const all=[...doc.querySelectorAll('[id]')].map(e=>e.id);assert.equal(new Set(all).size,all.length);dom.window.close();
});

test('71 documented semantic aliases resolve exactly and all unknown names reject without network',()=>{
  let networkCalls=0;class NoNetwork extends ResourceLoader{fetch(){networkCalls++;throw Error('Network forbidden');}}
  const dom=new JSDOM('<!doctype html><body></body>',{resources:new NoNetwork()});const doc=dom.window.document;
  assert.equal(Object.keys(iconAliases).length,71);
  for(const {alias,name,purpose} of catalog.aliases){assert.ok(purpose.trim());assert.equal(getIcon(alias),getIcon(name));assert.equal(isIconName(alias),false);assert.equal(isIconName(name),true);doc.body.append(createIcon(doc,getIcon(alias)));}
  for(const name of ['', 'UnknownIcon','constructor','__proto__','toString','https://example.invalid/i.svg','//example.invalid/i.svg','data:image/svg+xml,<svg onload="evil()"/>','javascript:alert(1)','../../icons/Check','check<script>',null,undefined,{},1])assert.throws(()=>getIcon(name),/Unknown icon name/);
  assert.equal(networkCalls,0);dom.window.close();
});

test('accessibility, owner document, safe text labels, sizes and original classes are explicit',()=>{
  const dom=new JSDOM('<!doctype html><body></body>');const doc=dom.window.document;
  const label='<script>bad()</script> مرحبا 中文';
  for(const size of [12,16,20,24,32,'1em','1.5rem','24px','100%']){
    const icon=createIcon(doc,getIcon('Check'),{size,label,className:'custom-icon'});
    assert.equal(icon.getAttribute('role'),'img');assert.equal(icon.getAttribute('aria-label'),label);assert.equal(icon.hasAttribute('aria-hidden'),false);assert.equal(icon.querySelector('script'),null);assert.equal(icon.getAttribute('width'),String(size));assert.equal(icon.getAttribute('height'),String(size));assert.ok(icon.classList.contains('iui-official-icon'));assert.ok(icon.classList.contains('custom-icon'));
  }
  const dot=createIcon(doc,getIcon('Dot'));assert.ok(dot.classList.contains('lucide'));assert.ok(dot.classList.contains('lucide-dot'));
  for(const options of [{label:''},{label:' '},{label:12},{size:0},{size:-1},{size:NaN},{size:Infinity},{size:'url(https://invalid)'},{size:'calc(100%)'},{size:'2vw'},{onload:'bad()'},{style:'color:red'},{className:12},{className:'a\u0000b'}])assert.throws(()=>createIcon(doc,getIcon('Check'),options),/Unsafe or unsupported icon/);
  dom.window.close();
});

test('runtime rejects active SVG elements, unsafe attributes, external IRIs and unbound local references',()=>{
  const dom=new JSDOM('<!doctype html><body></body>');const doc=dom.window.document;const clean=()=>structuredClone(getIcon('Check'));
  const modifications=[d=>d.shapes.push(['script',{}]),d=>d.shapes.push(['image',{href:'https://invalid'}]),d=>d.shapes.push(['foreignObject',{}]),d=>d.shapes.push(['use',{'xlink:href':'https://invalid'}]),d=>d.attrs.onload='bad()',d=>d.attrs.style='fill:url(https://invalid)',d=>d.attrs.fill='url(https://invalid)',d=>d.attrs.fill='var(--untrusted)',d=>d.attrs.viewBox='0 0 Infinity 24',d=>d.shapes[0][1]['clip-path']='url(https://invalid/#clip)',d=>d.shapes[0][1]['clip-path']='url(#missing)',d=>d.shapes[0][1].href='#anything',d=>d.shapes[0][1].id='not-a-clip',d=>d.shapes[0][1].d='M0 0<script>',d=>d.shapes[0][1].transform='rotate(javascript:alert(1))',d=>d.shapes.push(['g',{},[['defs',{},[]]]]),d=>d.name='https://invalid',d=>Object.defineProperty(d.attrs,'evil',{get(){throw Error('must not evaluate');}})];
  for(const modify of modifications){const definition=clean();modify(definition);assert.throws(()=>createIcon(doc,definition),/Unsafe or unsupported icon/);}
  dom.window.close();
});

test('strict upstream parser rejects expressions, executable wrappers, spreads and unsupported SVG',async()=>{
  const clean=await readFile(new URL('upstream/Check.tsx.txt',base),'utf8');
  const variants=[clean+'\nconsole.log("bad")',clean.replace('width="1em"','width={evil()}'),clean.replace('{...props}','{...other}'),clean.replace('<path','<script'),clean.replace('<path','<image href="https://invalid"'),clean.replace('<path','<path onLoad="bad()"'),clean.replace('<path','<path __proto__="bad"'),clean.replace('<path','<path style="display:none"'),clean.replace('<path','<path {...props}'),clean.replace('</svg>','{evil()}</svg>'),clean.replace('fill="currentColor"','fill="url(https://invalid)"')];
  for(const source of variants)assert.throws(()=>parseIconSource(source,'Check'),/unsupported|Unsafe/);
});

test('single icon bundles do not import all icons or React, while the opt-in registry has all 755',async()=>{
  const options={bundle:true,minify:true,write:false,format:'esm',platform:'browser',target:'es2022',legalComments:'eof',metafile:true};
  const single=await build({...options,stdin:{contents:"export {createIcon} from './src/icons/index.ts';export {default as Check} from './src/icons/definitions/Check.ts';",resolveDir:root}});
  const inputs=Object.keys(single.metafile.inputs);assert.equal(inputs.filter(p=>/icons\/definitions\//.test(p)).length,1);assert.ok(!inputs.some(p=>/icons\/all\.ts|node_modules\/react/.test(p)));
  const bytes=single.outputFiles[0].contents;assert.ok(bytes.length<8500,bytes.length);assert.ok(gzipSync(bytes).length<4000,gzipSync(bytes).length);
  const all=await build({...options,entryPoints:[fileURLToPath(new URL('../src/icons/all.ts',import.meta.url))]});assert.equal(Object.keys(all.metafile.inputs).filter(p=>/icons\/definitions\//.test(p)).length,755);assert.ok(!Object.keys(all.metafile.inputs).some(p=>/node_modules\/react/.test(p)));
});
