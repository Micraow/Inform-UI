import type {FollowUpCardGroupNode} from '../schema/document.js';
import type {Issue} from './index.js';
/** Caller-supplied intents only. Nothing is resolved or executed by this component. */
export function inspectFollowUpCardGroup(node:FollowUpCardGroupNode,path:string,add:(issue:Issue)=>void,safeURL:(url:string,kind?:'link'|'image')=>boolean):void {
  const ids=new Set<string>();
  node.items.forEach((item,index)=>{
    const at=`${path}/items/${index}`;
    if(ids.has(item.id))add({code:'DUPLICATE_ID',path:`${at}/id`,message:'Follow-up card IDs must be unique.'});
    ids.add(item.id);
    if(item.intent.kind==='url'&&(!/^https?:\/\//i.test(item.intent.url)||!safeURL(item.intent.url)))add({code:'UNSAFE_URL',path:`${at}/intent/url`,message:'Follow-up destinations require allowed absolute HTTP(S) URLs.'});
    if(item.iconData!==undefined&&(!/^data:/i.test(item.iconData)||!safeURL(item.iconData,'image')))add({code:'UNSAFE_URL',path:`${at}/iconData`,message:'Follow-up icons require an inline raster image; remote images and SVG are unsupported.'});
  });
}
