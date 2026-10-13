import type { RendererContext } from './context.js';
import type { CodeNode } from '../schema/document.js';
import type { CodeLabels } from './code-labels.js';
import { scanCode } from './code-lexer.js';

/** Caller owns public validation and applies authored id/data-iui to returned root. */
export function renderCode(c:RendererContext,n:CodeNode,labels:{code:string;codeUI:CodeLabels}):HTMLElement {
 const enhanced=n.copy===true||n.highlight===true;
 if(n.inline&&enhanced)throw new TypeError('Inline code cannot enable copy or highlight.');
 const value=n.value;
 if(n.inline||(!n.copy&&!n.highlight)) {
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
 if(n.highlight)for(const token of scanCode(value,n.language).tokens) {
  if(token.kind==='text')code.append(c.doc.createTextNode(token.text));
  else code.append(c.element('span',`iui-code-token-${token.kind}`,token.text));
 } else code.textContent=value;
 pre.append(code);
 const header=c.element('div','iui-code-header');
 if(n.language)header.append(c.element('span','iui-code-language',n.language));
 if(n.copy) {
  const button=c.element('button','iui-code-copy',labels.codeUI.copy);button.type='button';button.setAttribute('aria-disabled','false');
  const status=c.element('span','iui-code-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');
  header.append(button);out.append(header,pre,status);
  let disposed=false,busy=false,generation=0;
  c.cleanup(()=>{disposed=true;generation++;});
  c.on(button,'click',event=>{
   // Native pointer/keyboard activation only. HTMLElement.click()/dispatchEvent cannot copy.
   if(!event.isTrusted||disposed||busy||!out.isConnected)return;
   busy=true;const current=++generation;
   button.setAttribute('aria-disabled','true');status.textContent=labels.codeUI.copying;
   const settle=(success:boolean)=>{
    if(disposed||generation!==current||!out.isConnected)return;
    busy=false;button.setAttribute('aria-disabled','false');status.textContent=success?labels.codeUI.copied:labels.codeUI.failed;
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
 } else {
  if(header.childNodes.length)out.append(header);
  out.append(pre);
 }
 return out;
}
