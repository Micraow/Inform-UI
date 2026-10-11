import type {FollowUpActionBarNode} from '../schema/document.js';
import type {Issue} from './index.js';
/** Original finite action contract; no historical implementation identity is implied. */
export function inspectFollowUpActionBar(node:FollowUpActionBarNode,path:string,add:(issue:Issue)=>void):void {
 const ids=new Set<string>();
 node.actions.forEach((action,index)=>{const at=`${path}/actions/${index}`;if(ids.has(action.id))add({code:'FOLLOW_UP_ACTION_ID',path:at+'/id',message:'Action IDs must be unique within this bar.'});ids.add(action.id);if(!action.label.trim())add({code:'FOLLOW_UP_ACTION_LABEL',path:at+'/label',message:'An action needs a nonblank supplied label.'});});
 if(node.label!==undefined&&!node.label.trim())add({code:'FOLLOW_UP_ACTION_LABEL',path:path+'/label',message:'The supplied group label must not be blank.'});
}
