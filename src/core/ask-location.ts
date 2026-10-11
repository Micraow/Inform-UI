import type {Issue} from './index.js';
export interface AskUserLocationNode {type:'ask-user-location';id?:string;label:string;status?:'resolved'|'pending'|'failed';fallback?:string;title?:string;description?:string;learnMoreUrl?:string;learnMoreLabel?:string;notNowLabel?:string;turnOnLabel?:string;dismissed?:boolean;disabled?:boolean;resetLabel?:string;requestedLabel?:string;cancelledLabel?:string}
export interface AskLocationDetail {readonly id:string|null;readonly intent:'request-location-permission'|'learn-more'|'dismiss';readonly url?:string}
export function inspectAskLocation(node:AskUserLocationNode,path:string,add:(issue:Issue)=>void,safe:(url:string,kind?:'link'|'image')=>boolean):void {
 for(const [key,value]of Object.entries(node))if(typeof value==='string'&&!value.trim())add({code:'ASK_LOCATION_DATA',path:path+'/'+key,message:'Supply nonblank text.'});
 if(node.learnMoreUrl!==undefined&&!safe(node.learnMoreUrl,'link'))add({code:'ASK_LOCATION_URL',path:path+'/learnMoreUrl',message:'Supply a safe informational destination.'});
}
