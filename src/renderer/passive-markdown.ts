import type{RendererContext}from'./context.js';import{parseMarkdown}from'./markdown-parser.js';import type{Inline}from'./markdown-parser.js';
/** Reuses the bounded parser but deliberately creates no links, images or executable markup. */
export function renderPassiveMarkdown(c:RendererContext,text:string):HTMLElement{
 const root=c.element('div','iui-markdown iui-passive-markdown'),plan=parseMarkdown(text);if(plan.fallback)root.dataset.markdownFallback='budget';
 const append=(parent:HTMLElement,parts:Inline[])=>{for(const part of parts)parent.append(c.element(part.kind==='text'||part.kind==='link'?'span':part.kind,'',part.text));};
 for(const block of plan.blocks){if(block.kind==='code'){const pre=c.element('pre','iui-code');pre.append(c.element('code','',block.text));root.append(pre);}else if(block.kind==='list'){const list=c.element(block.ordered?'ol':'ul');for(const item of block.items){const li=c.element('li');if(item.value!==undefined)li.value=item.value;append(li,item.content);list.append(li);}root.append(list);}else{const element=c.element(block.kind==='heading'?`h${block.level}`as'h1':block.kind==='quote'?'blockquote':'p');append(element,block.content);root.append(element);}}return root;
}
