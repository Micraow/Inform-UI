import {object,number,short,string,array,ref,choice,integer,bool,key,color,weight,align,children} from '../primitives.mjs';
/** Existing maintained contract; source registration only. */
export function install({defs,node,registerDefinedNode}){
defs.FollowUpCardIntent = {oneOf:[object({kind:{const:'url'},url:string(2048,1)},['kind','url']),object({kind:{const:'query'},query:string(4000,1)},['kind','query']),object({kind:{const:'prefill'},surface:{const:'work'},query:string(4000,1)},['kind','surface','query'])]};
defs.FollowUpCardItem=object({id:key,label:short,description:string(1000,1),emoji:string(32,1),iconData:string(100000,1),disabled:bool,intent:ref('FollowUpCardIntent')},['id','label','intent']);
node('follow-up-card-group',{label:short,items:array(ref('FollowUpCardItem'),0,40),status:choice('ready','loading','error'),message:string(2000,1)},['label','items']);
}
