import {object,number,short,string,array,ref,choice,integer,bool,key,color,weight,align,children} from '../primitives.mjs';
/** Existing maintained contract; source registration only. */
export function install({defs,node,registerDefinedNode}){
defs.ConversationSuggestion=object({id:key,label:short,prompt:string(2000,1),intent:choice('new-turn','start-voice'),iconSrc:string(16000,1),disabled:bool},['id','label','prompt']);
node('conversation-suggestions',{label:short,suggestions:array(ref('ConversationSuggestion'),0,12),disabled:bool,status:choice('pending','resolved','failed'),fallback:string(2000)},['suggestions']);
defs.FollowUpAction=object({id:key,label:short,query:{type:'string',maxLength:2000},intent:{enum:['new-turn','start-voice','open-image-composer']},iconSrc:{type:'string',maxLength:16000},disabled:bool},['id','label']);
node('follow-up-action-bar',{label:short,actions:array(ref('FollowUpAction'),0,12),disabled:bool,presentation:{enum:['flat','footer','wrapped_pills']},status:{enum:['pending','resolved','failed']},fallback:{type:'string',maxLength:2000}},['actions']);
}
