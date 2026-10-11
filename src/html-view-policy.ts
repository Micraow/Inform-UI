import {parse,type DefaultTreeAdapterMap} from 'parse5';
import {createHash} from 'node:crypto';
import {htmlViewDocument} from './core/html-view.js';
const digest=(value:string)=>`'sha256-${createHash('sha256').update(value).digest('base64')}'`;
/** Parse HTML, not a regex: comments/raw text/entities/newlines follow browser tokenization. */
export function htmlViewScriptHashes(html:string):{scripts:string[];handlers:string[]} {
 const scripts=new Set<string>(),handlers=new Set<string>();
 const visit=(node:DefaultTreeAdapterMap['node'])=>{
  if('tagName'in node){
   if(node.tagName==='script'&&!node.attrs.some(attr=>attr.name==='src'))scripts.add(digest(node.childNodes.filter(item=>item.nodeName==='#text').map(item=>(item as DefaultTreeAdapterMap['textNode']).value).join('')));
   for(const attr of node.attrs)if(/^on[a-z]+$/.test(attr.name))handlers.add(digest(attr.value));
   if(node.tagName==='template')visit((node as DefaultTreeAdapterMap['template']).content);
  }
  if('childNodes'in node)node.childNodes.forEach(visit);
 };
 visit(parse(htmlViewDocument(html)));return {scripts:[...scripts].sort(),handlers:[...handlers].sort()};
}
