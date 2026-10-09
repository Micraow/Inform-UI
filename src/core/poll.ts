import type {CreateInteractivePollNode} from '../schema/document.js';
import type {Issue} from './index.js';
/** Incomplete initial text is a legal local draft; preparing a poll validates it. */
export function inspectPoll(n:CreateInteractivePollNode,path:string,add:(issue:Issue)=>void):void {
 const ids=new Set<string>();n.options.forEach((option,index)=>{if(ids.has(option.id))add({code:'DUPLICATE_ID',path:`${path}/options/${index}/id`,message:'Initial poll option IDs must be unique.'});ids.add(option.id);});
}
