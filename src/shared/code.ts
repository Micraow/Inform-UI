import {createIcon} from '../icons/create-icon.js';
import CodeIcon from '../icons/definitions/Code.js';
import CopyIcon from '../icons/definitions/Copy.js';
import WrapIcon from '../icons/definitions/ArrowCurvedLeft.js';
import CheckIcon from '../icons/definitions/Check.js';
import {highlightCode} from './code-highlight.js';
import type {CodeLabels} from '../renderer/code-labels.js';
export interface CodeOptions {value:string;language?:string;inline?:boolean;copy?:boolean;highlight?:boolean;showLanguage?:boolean}
export interface CodeContext {
 doc:Document;
 element<K extends keyof HTMLElementTagNameMap>(tag:K,cls?:string,value?:unknown):HTMLElementTagNameMap[K];
 on(target:EventTarget,name:string,listener:EventListener):unknown;
 cleanup(fn:()=>void):unknown;
}
/** Caller owns public validation and applies authored id/data-iui to returned root. */
export function renderCode(c:CodeContext,n:CodeOptions,labels:{code:string;codeUI:CodeLabels}):HTMLElement {
 if(n.inline&&(n.copy===true||n.highlight===true||n.showLanguage===true))throw new TypeError('Inline code cannot enable copy, highlight or showLanguage.');
 const copy=!n.inline&&n.copy!==false,highlight=!n.inline&&n.highlight!==false,showLanguage=!n.inline&&n.showLanguage!==false;
 const value=n.value;
 if(n.inline||(!copy&&!highlight&&!showLanguage)) {
  const out=n.inline?c.element('code','iui-inline-code',value):c.element('pre','iui-code');
  if(!n.inline)out.append(c.element('code','',value));
  if(n.language)out.setAttribute('aria-label',`${n.language} ${labels.code}`);
  return out;
 }
 const out=c.element('div','iui-code-block');
 const pre=c.element('pre','iui-code'),code=c.element('code');
 // Preserve .iui-code on the actual scroll surface, not the dispatch root.
 pre.tabIndex=0;
 if(n.language)pre.setAttribute('aria-label',`${n.language} ${labels.code}`);
 else pre.setAttribute('aria-label',labels.code);
 if(highlight)for(const token of highlightCode(value,n.language)) {
  if(token.kind==='text')code.append(c.doc.createTextNode(token.text));
  else code.append(c.element('span',`iui-code-token-${token.kind}`,token.text));
 } else code.textContent=value;
 pre.append(code);
 const header=c.element('div','iui-code-header'),actions=c.element('div','iui-code-actions');
 if(showLanguage){const title=c.element('span','iui-code-title');title.append(createIcon(c.doc,CodeIcon,{size:18}),c.element('span','iui-code-language',n.language??labels.codeUI.plainText));header.append(title);}
 let disposed=false;
 c.cleanup(()=>{disposed=true;});
 const wrap=c.element('button','iui-code-wrap');wrap.type='button';wrap.setAttribute('aria-label',labels.codeUI.wrap);wrap.title=labels.codeUI.wrap;wrap.setAttribute('aria-pressed','false');wrap.append(createIcon(c.doc,WrapIcon,{size:18}));
 c.on(wrap,'click',()=>{if(disposed||!out.isConnected)return;const wrapped=wrap.getAttribute('aria-pressed')!=='true';wrap.setAttribute('aria-pressed',String(wrapped));wrap.title=wrapped?labels.codeUI.unwrap:labels.codeUI.wrap;out.dataset.wrap=String(wrapped);});
 header.append(actions);out.append(header,pre);

 if(copy) {
  const button=c.element('button','iui-code-copy');button.type='button';button.setAttribute('aria-disabled','false');button.setAttribute('aria-label',labels.codeUI.copy);button.title=labels.codeUI.copy;button.append(createIcon(c.doc,CopyIcon,{size:18}),c.element('span','iui-code-sr-only',labels.codeUI.copy));
  const status=c.element('span','iui-code-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');
  actions.append(button);out.append(status);
  let busy=false,generation=0;
  c.cleanup(()=>{disposed=true;generation++;});
  c.on(button,'click',event=>{
   // Native pointer/keyboard activation only. HTMLElement.click()/dispatchEvent cannot copy.
   if(!event.isTrusted||disposed||busy||!out.isConnected)return;
   busy=true;const current=++generation;
   button.setAttribute('aria-disabled','true');button.title=labels.codeUI.copy;button.querySelector('svg')?.replaceWith(createIcon(c.doc,CopyIcon,{size:18}));status.textContent=labels.codeUI.copying;
   const settle=(success:boolean)=>{
    if(disposed||generation!==current||!out.isConnected)return;
    busy=false;button.setAttribute('aria-disabled','false');status.textContent=success?labels.codeUI.copied:labels.codeUI.failed;button.title=success?labels.codeUI.copied:labels.codeUI.copy;button.querySelector('svg')?.replaceWith(createIcon(c.doc,success?CheckIcon:CopyIcon,{size:18}));
   };
   try {
    const win=button.ownerDocument.defaultView;
    if(win?.isSecureContext!==true){settle(false);return;}
    // Access only inside the trusted explicit activation; getters may throw.
    const clipboard=win.navigator.clipboard;
    if(typeof clipboard?.writeText!=='function'){settle(false);return;}
    Promise.resolve(clipboard.writeText(value)).then(()=>settle(true),()=>settle(false));
   } catch { settle(false); }
  });
 }
 actions.prepend(wrap);
 return out;
}
