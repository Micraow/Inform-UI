import {object,short,string,array,ref,bool,integer,key} from '../primitives.mjs';
/** Existing authored declarations; no change to supplied-data or local interaction semantics. */
export function install({defs,node}){
// Original bounded reader for supplied discussion content; no provider integration.
const threadScore = { anyOf: [integer(-1000000000, 1000000000), { type:'null' }] };
defs.ThreadComment = object({ id:key, author:short, body:string(4000,1), score:threadScore, replies:array(ref('ThreadComment'),0,20) }, ['id','author','body']);
node('reddit-thread-card', { title:string(300,1), author:short, body:string(6000), source:object({label:short,url:string(2048,1)},['label']), comments:array(ref('ThreadComment'),0,50), community:short, score:threadScore, expanded:bool }, ['title','author','body','source','comments']);
}
