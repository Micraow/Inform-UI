import type{LinkNode,LinkCardNode,RecommendationLinkCardNode}from'../schema/document.js';import type{Issue}from'./index.js';import{inspectPressable}from'./pressable.js';
export type SuppliedLink=LinkNode|LinkCardNode|RecommendationLinkCardNode;
export function inspectSuppliedLink(node:SuppliedLink,path:string,add:(issue:Issue)=>void,safe:(url:string,kind?:'link'|'image')=>boolean):void{
 const issue=(code:string,at:string,message:string)=>add({code,path:path+at,message});
 if((node.status??'resolved')==='resolved'&&!node.url)issue('LINK_URL','/url','Resolved links need an explicit safe destination.');
 if(node.url!==undefined&&!safe(node.url,'link'))issue('LINK_URL','/url','Supply an allowed link URL.');
 for(const key of['title','source','snippet','fallback','copyLabel','loadImageLabel']as const)if(node[key]!==undefined&&!node[key]!.trim())issue('LINK_TEXT','/'+key,'Supplied text must be nonblank.');
 for(const key of['faviconSrc','imageSrc']as const)if(node[key]!==undefined&&!safe(node[key]!,'image'))issue('LINK_IMAGE','/'+key,'Supply a safe image source; remote images require explicit local activation.');
 if(node.type==='link'&&node.children?.length)inspectPressable({type:'pressable',label:node.title??node.url??'Link',actionId:'link',children:node.children as [import('../schema/document.js').Node,...import('../schema/document.js').Node[]]},path,i=>add({...i,code:i.code.replace('PRESSABLE_','LINK_')}));
}
