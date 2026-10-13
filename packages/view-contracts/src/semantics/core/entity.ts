import type {EntityCardNode,EntityOverviewNode} from '../schema/document.js';
import type {Issue} from './index.js';
export type EntityNode=EntityCardNode|EntityOverviewNode;
export type EntityOverviewItem=NonNullable<EntityOverviewNode['item']>;
export function inspectEntity(node:EntityNode,path:string,add:(issue:Issue)=>void,safe:(url:string,kind?:'link'|'image')=>boolean):void {
 const issue=(at:string,message:string)=>add({code:'ENTITY_DATA',path:path+at,message});
 const text=(value:unknown,at:string)=>{if(typeof value==='string'&&!value.trim())issue(at,'Supply nonblank text.');};
 for(const [key,value]of Object.entries(node))if(typeof value==='string'&&key!=='subtitle')text(value,'/'+key);
 const image=(value:{src:string;alt?:string},at:string)=>{if(!safe(value.src,'image'))issue(at+'/src','Supply an allowed raster image or HTTP(S) image URL.');};
 if(node.type==='entity-card'){
  if(node.image)image(node.image,'/image');
  if(node.actionLabel&&!node.actionId)issue('/actionLabel','An action label requires an action ID.');
 }else{
  const items=node.item?[node.item]:node.items??[],seen=new Set<string>();
  items.forEach((item,index)=>{const at=node.item?'/item':'/items/'+index;if(seen.has(item.id))issue(at+'/id','Entity IDs must be unique.');seen.add(item.id);for(const[key,value]of Object.entries(item))text(value,at+'/'+key);item.images.forEach((value,i)=>image(value,at+'/images/'+i));item.metadata.forEach((value,i)=>{text(value.label,at+'/metadata/'+i+'/label');text(value.value,at+'/metadata/'+i+'/value');});if(item.actionLabel&&!item.actionId)issue(at+'/actionLabel','An action label requires an action ID.');});
 }
}
