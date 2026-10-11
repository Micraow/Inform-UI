import type {FollowUpActionBarNode} from '../schema/document.js';
import type {Issue} from './index.js';
/** Supplied data and local intent only. No application client or conversation service. */
export function inspectFollowUpActionBar(node:FollowUpActionBarNode,path:string,add:(issue:Issue)=>void,safe:(url:string,kind?:'link'|'image')=>boolean):void {
 const ids=new Set<string>();
 node.actions.forEach((action,index)=>{
  const at=`${path}/actions/${index}`;
  if(ids.has(action.id))add({code:'FOLLOW_UP_ACTION_ID',path:at+'/id',message:'Action IDs must be unique within this bar.'});ids.add(action.id);
  if(!action.label.trim())add({code:'FOLLOW_UP_ACTION_LABEL',path:at+'/label',message:'An action needs a nonblank supplied label.'});
  if(action.query!==undefined&&!action.query.trim()||node.presentation!==undefined&&node.presentation!=='flat'&&action.query===undefined)add({code:'FOLLOW_UP_ACTION_QUERY',path:at+'/query',message:'Presented follow-ups need a nonblank supplied query.'});
  if(node.presentation==='footer'&&action.intent!==undefined&&action.intent!=='new-turn')add({code:'FOLLOW_UP_ACTION_INTENT',path:at+'/intent',message:'Footer actions request a new turn; client actions belong to wrapped pills.'});
  if(action.iconSrc!==undefined&&!safe(action.iconSrc,'image'))add({code:'FOLLOW_UP_ACTION_SOURCE',path:at+'/iconSrc',message:'Use a safe supplied image source.'});
 });
 if(node.label!==undefined&&!node.label.trim())add({code:'FOLLOW_UP_ACTION_LABEL',path:path+'/label',message:'The supplied group label must not be blank.'});
}
