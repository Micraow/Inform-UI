import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {transform} from 'esbuild';
import {JSDOM, ResourceLoader} from 'jsdom';
import {mount} from '../dist/v2/node.mjs';

const paths=['../src/renderer/markdown-parser.ts','../packages/domain-view-renderer/src/internal/renderer/markdown-parser.ts'];
const sources=await Promise.all(paths.map(path=>readFile(new URL(path,import.meta.url),'utf8')));
const parsers=await Promise.all(sources.map(async(source,index)=>{
  const {code}=await transform(source,{loader:'ts',format:'esm',target:'es2022'});
  return (await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}#${index}`)).parseMarkdown;
}));
const emphasis=[];
for(const [mark,kind] of [['*','em'],['**','strong']]) {
  for(const [before,inside,after] of [
    ['这是','重点','内容'],['前','重点',''],['','重点','后'],
    ['（','重点','）。'],['中','English 123','文'],
    ['𠀀','重点','𠮷'],['𠀀','重点',''],['','重点','𠮷'],
    ['中𠀀','𠮷','𠀀中'],['a中','重点','文a'],['😀','重点','😀']
  ]) emphasis.push({value:before+mark+inside+mark+after,tokens:[
    ...(before?[{kind:'text',text:before}]:[]),{kind,text:inside},...(after?[{kind:'text',text:after}]:[])
  ]});
}
const literal=[
  'word*inside*word','word**inside**word','1*2*3','1**2**3',
  'word_inside_word','word__inside__word','中***重点***文','中**重*点*内容**文',
  '中*重**点**内容*文','中**重_点_内容**文','中* 重 点 *文','中**未闭合',
  '***nested***','**a *b* c**','*a**b**c*','[broken *label*'
];
for(const mark of ['*','**']) for(const word of ['a','é','Ж','α','ع','ש','あ','한','1','١','１','𐐀','𝒜','𝟙']) {
  literal.push(word+mark+'重点'+mark,mark+'重点'+mark+word,word+mark+'重点'+mark+'中','中'+mark+'重点'+mark+word);
}
for(const mark of ['_','__']) for(const [before,after] of [['中','文'],['中',''],['','文'],['𠀀','𠮷'],['𠀀',''],['','𠮷']]) literal.push(before+mark+'重点'+mark+after);
const unsafeHrefs=['javascript:alert(1)','data:text/html,test','https://u:p@example.test','https://example.test/\\x','https://example.test/\tbad','mailto:x@y?body=foo','//example.test','/relative','ftp://example.test'];
const unsafe=unsafeHrefs.map(href=>`[link](${href})`).concat([
  '<img src="https://example.test/x" onerror="pwned=1">\n<script>pwned=1</script>',
  '![图](https://example.test/image.png)','<b>中**重点**文</b>'
]);
const dsl=value=>'root=Stack([MarkdownView('+JSON.stringify({value})+')])';
function harness() {
  const requests=[]; class NoFetch extends ResourceLoader { fetch(url) { requests.push(url); return null; } }
  const dom=new JSDOM('<main></main>',{url:'https://example.test/',resources:new NoFetch()}),errors=[];
  const app=mount(dom.window.document.querySelector('main'),{source:dsl(''),select:['base/layout','views/content'],viewNames:['MarkdownView'],onError:issues=>errors.push(...issues)});
  assert.equal(app.element.dataset.phase,'ready',JSON.stringify(errors));
  return {dom,requests,set(value) {
    const result=app.commit(dsl(value));assert.equal(result.ok,true,JSON.stringify(result));
    assert.deepEqual(errors,[]);const root=app.element.querySelector('.iui-markdown');assert.ok(root);return root;
  },close(){app.dispose();dom.window.close();}};
}

test('both finite parsers stay identical, including Han and supplementary Unicode boundaries',()=>{
  assert.equal(sources[0],sources[1]);
  for(const value of [...emphasis.map(x=>x.value),...literal,...unsafe,'中\\*字\\*文','中`*字*`文','*x* '.repeat(3000)]) assert.deepEqual(parsers[0](value),parsers[1](value),value);
  for(const {value,tokens} of emphasis) for(const parse of parsers) assert.deepEqual(parse(value),{blocks:[{kind:'paragraph',content:tokens}],fallback:false},value);
  for(const value of literal) for(const parse of parsers) {
    const {blocks,fallback}=parse(value);assert.equal(fallback,false,value);
    assert.ok(blocks.every(block=>block.content.every(token=>token.kind==='text')),value);
    assert.equal(blocks.flatMap(block=>block.content.map(token=>token.text)).join(''),value,value);
  }
});

test('DSL MarkdownView renders single/double asterisks beside Han without spaces',()=>{
  const h=harness();try {
    for(const {value,tokens} of emphasis) {
      const root=h.set(value),paragraph=root.querySelector('p');assert.ok(paragraph,value);
      assert.deepEqual([...paragraph.childNodes].map(node=>({kind:node.nodeType===3?'text':node.localName,text:node.textContent})),tokens,value);
    }
    assert.deepEqual(h.requests,[]);
  } finally {h.close();}
});

test('DSL MarkdownView retains other word, underscore, nesting, escape and code rules',()=>{
  const h=harness();try {
    for(const value of literal) {const root=h.set(value);assert.equal(root.textContent,value,value);assert.equal(root.querySelector('em,strong'),null,value);}
    let root=h.set('中\\*字\\*文');assert.equal(root.textContent,'中*字*文');assert.equal(root.querySelector('em,strong'),null);
    root=h.set('中`*字*`文');assert.equal(root.querySelector('code').textContent,'*字*');assert.equal(root.querySelector('em,strong'),null);
    root=h.set('_em_ __strong__');assert.equal(root.querySelector('em').textContent,'em');assert.equal(root.querySelector('strong').textContent,'strong');
    assert.deepEqual(h.requests,[]);
  } finally {h.close();}
});

test('DSL MarkdownView keeps HTML/images literal and preserves URL safeguards',()=>{
  const h=harness();try {
    for(const value of unsafe) {
      const root=h.set(value);assert.equal(root.querySelector('a,img,script,iframe,video,audio,em,strong'),null,value);
      assert.equal(root.textContent,value.replace(/\n/g,''),value);
    }
    const root=h.set('中**重点**文 [site](https://example.test/read) [jump](#target)');
    assert.equal(root.querySelector('strong').textContent,'重点');
    const [external,anchor]=root.querySelectorAll('a');assert.equal(external.href,'https://example.test/read');
    assert.equal(external.target,'_blank');assert.equal(external.rel,'noopener noreferrer');assert.equal(external.referrerPolicy,'no-referrer');
    assert.match(anchor.getAttribute('href'),/^#.+target$/);assert.equal(anchor.hasAttribute('target'),false);
    assert.deepEqual(h.requests,[]);assert.equal(h.dom.window.pwned,undefined);
  } finally {h.close();}
});
