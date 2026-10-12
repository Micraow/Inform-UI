import {object,number,short,string,array,ref,choice,integer,bool,key,color,weight,align,children} from '../primitives.mjs';
/** Existing maintained contract; source registration only. */
export function install({defs,node,registerDefinedNode}){
node('scheduled-task-suggestion',{label:short,action:choice('new-turn','task-opt-in-accept'),creationGuidelines:string(12000,1),originSurface:choice('chat','work'),submitted:bool,disabled:bool,status:choice('pending','resolved','failed'),fallback:string(2000,1)},['label']);
}
