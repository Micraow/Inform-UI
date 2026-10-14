import core from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import json from 'highlight.js/lib/languages/json';
import python from 'highlight.js/lib/languages/python';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml';
import sql from 'highlight.js/lib/languages/sql';
import yaml from 'highlight.js/lib/languages/yaml';
import markdown from 'highlight.js/lib/languages/markdown';
import c from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';
import java from 'highlight.js/lib/languages/java';
import rust from 'highlight.js/lib/languages/rust';
import go from 'highlight.js/lib/languages/go';
import csharp from 'highlight.js/lib/languages/csharp';
import kotlin from 'highlight.js/lib/languages/kotlin';
import swift from 'highlight.js/lib/languages/swift';
import ruby from 'highlight.js/lib/languages/ruby';
import php from 'highlight.js/lib/languages/php';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import powershell from 'highlight.js/lib/languages/powershell';
import shell from 'highlight.js/lib/languages/shell';
import ini from 'highlight.js/lib/languages/ini';
import diff from 'highlight.js/lib/languages/diff';
import graphql from 'highlight.js/lib/languages/graphql';
/** A private instance: no auto-detection, plugins, network, or global DOM scanning. */
const highlighter=core.newInstance();
for(const [name,grammar] of Object.entries({bash,javascript,typescript,json,python,css,xml,sql,yaml,markdown,c,cpp,java,rust,go,csharp,kotlin,swift,ruby,php,dockerfile,powershell,shell,ini,diff,graphql}))highlighter.registerLanguage(name,grammar);
highlighter.safeMode();
export interface CodeToken {kind:string;text:string}
const raw=(value:string):CodeToken[]=>value?[{kind:'text',text:value}]:[];
const entities:Record<string,string>={'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#x27;':"'",'&#39;':"'"};
/** Only library-generated span markup is decoded. DOM is built using text nodes,
 * never innerHTML, so CRLF, NUL, lone surrogates and source HTML stay literal.
 * Input is bounded, but grammar regexes are not claimed to be linear-time.
 */
export function highlightCode(value:string,language?:string):CodeToken[]{
 if(!language||value.length>24000||!highlighter.getLanguage(language.toLowerCase()))return raw(value);
 try{
  const markup=highlighter.highlight(value,{language:language.toLowerCase(),ignoreIllegals:true}).value;
  const stack:string[]=[],tokens:CodeToken[]=[];
  for(const part of markup.split(/(<[^>]*>)/g)){
   if(!part)continue;
   if(part==='</span>'){if(!stack.length)return raw(value);stack.pop();continue;}
   if(part[0]==='<'){
    const match=/^<span class="([A-Za-z0-9_ -]+)">$/.exec(part);
    if(!match)return raw(value);stack.push(match[1].split(' ').map(s=>s.startsWith('hljs-')?s.slice(5):s).join('-'));continue;
   }
   const text=part.replace(/&(amp|lt|gt|quot|#x27|#39);/g,e=>entities[e]);
   const kind=stack.at(-1)??'text',last=tokens.at(-1);
   if(last?.kind===kind)last.text+=text;else tokens.push({kind,text});
  }
  if(stack.length||tokens.map(t=>t.text).join('')!==value)return raw(value);
  return tokens;
 }catch{return raw(value);}
}
