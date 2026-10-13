import type {Issue} from './index.js';
export type WelcomeAction={id:string;kind:'prompt';query:string;disabled?:boolean}|{id:string;kind:'url';url:string;disabled?:boolean}|{id:string;kind:'capability';capability:string;available?:boolean;disabled?:boolean}|{id:string;kind:'voice';available?:boolean;disabled?:boolean};
export interface WelcomeItem {id:string;actionId:string;label:string;iconSrc?:string;fallbackSymbol?:string;disabled?:boolean}
export interface CapabilityWelcomeNode {type:'whats-new-capability-welcome';id?:string;label:string;status?:'resolved'|'pending'|'failed';fallback?:string;items?:WelcomeItem[];actions?:WelcomeAction[];campaignId?:string;disabled?:boolean;emptyLabel?:string;resetLabel?:string;requestedLabel?:string;cancelledLabel?:string}
export interface CapabilityWelcomeDetail {readonly id:string|null;readonly itemId:string;readonly actionId:string;readonly intent:'submit-prompt'|'open-url'|'open-capability';readonly query?:string;readonly url?:string;readonly capability?:string;readonly campaignId?:string}
export function inspectCapabilityWelcome(node:CapabilityWelcomeNode,path:string,add:(issue:Issue)=>void,safe:(url:string,kind?:'link'|'image')=>boolean):void {
 const issue=(at:string,message:string)=>add({code:'CAPABILITY_WELCOME_DATA',path:path+at,message});
 const text=(record:object,at:string)=>{for(const[key,value]of Object.entries(record))if(typeof value==='string'&&!value.trim())issue(at+'/'+key,'Supply nonblank text.');};text(node,'');
 const itemIds=new Set<string>(),actionIds=new Set<string>();node.items?.forEach((item,index)=>{const at='/items/'+index;text(item,at);if(itemIds.has(item.id))issue(at+'/id','Item IDs must be unique.');itemIds.add(item.id);if(item.iconSrc!==undefined&&!safe(item.iconSrc,'image'))issue(at+'/iconSrc','Supply a safe icon source.');});
 node.actions?.forEach((action,index)=>{const at='/actions/'+index;text(action,at);if(actionIds.has(action.id))issue(at+'/id','Action IDs must be unique.');actionIds.add(action.id);if(action.kind==='url'&&!safe(action.url,'link'))issue(at+'/url','Supply a safe destination URL.');});
}
