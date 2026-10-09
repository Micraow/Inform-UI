import type {ChecklistNode} from '../schema/document.js';
import type {Issue,Scalar} from './index.js';
export function inspectChecklist(n:ChecklistNode,path:string,state:Readonly<Record<string,Scalar>>,add:(issue:Issue)=>void):void{
 const ids=new Set<string>(),bindings=new Set<string>();
 n.items.forEach((item,i)=>{const at=`${path}/items/${i}`;if(ids.has(item.id))add({code:'CHECKLIST_ID',path:at+'/id',message:'Checklist item IDs must be unique.'});ids.add(item.id);
 if(bindings.has(item.bind))add({code:'CHECKLIST_BIND',path:at+'/bind',message:'Each checklist item needs a different binding.'});bindings.add(item.bind);
 if(!Object.hasOwn(state,item.bind))add({code:'UNKNOWN_BIND',path:at+'/bind',message:'Checklist binding must name declared state.'});else if(typeof state[item.bind]!=='boolean')add({code:'INPUT_TYPE',path:at+'/bind',message:'Checklist binding must be boolean.'});});
}
