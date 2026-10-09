import type {SidebarPeopleAlsoAskNode} from '../schema/document.js';
import type {Issue} from './index.js';
/** Supplied questions and answers only; no discovery, ranking or generation. */
export function inspectRelatedQuestions(n:SidebarPeopleAlsoAskNode,path:string,add:(issue:Issue)=>void,safeURL:(url:string)=>boolean):void {
 const ids=new Set<string>();
 n.items.forEach((item,index)=>{const at=`${path}/items/${index}`;if(ids.has(item.id))add({code:'DUPLICATE_ID',path:`${at}/id`,message:'Question IDs must be unique.'});ids.add(item.id);(item.sources??[]).forEach((source,i)=>{if(!/^https?:\/\//i.test(source.url)||!safeURL(source.url))add({code:'UNSAFE_URL',path:`${at}/sources/${i}/url`,message:'Question sources require allowed absolute HTTP(S) URLs.'});});});
 const opened=new Set<string>();(n.expanded??[]).forEach((id,i)=>{if(!ids.has(id))add({code:'QUESTION_REFERENCE',path:`${path}/expanded/${i}`,message:'Expanded IDs must refer to supplied questions.'});if(opened.has(id))add({code:'DUPLICATE_ID',path:`${path}/expanded/${i}`,message:'Expanded IDs must be unique.'});opened.add(id);});
}
