import type {AskUserDetailsNode,AskUserFilesNode} from '../schema/document.js';
import type {Issue} from './index.js';
export type AskUserNode=AskUserDetailsNode|AskUserFilesNode;
export interface LocalFileMetadata {readonly name:string;readonly size:number;readonly type:string;readonly lastModified:number}
export function inspectAskUser(node:AskUserNode,path:string,add:(issue:Issue)=>void):void {
 const issue=(at:string,message:string)=>add({code:'ASK_USER_DATA',path:path+at,message});
 for(const[key,value]of Object.entries(node))if(typeof value==='string'&&key!=='invitation'&&!value.trim())issue('/'+key,'Supply nonblank text.');
 if(node.type==='ask-user-details'){
  const ids=new Set<string>();node.questions?.forEach((q,i)=>{const at='/questions/'+i;if(ids.has(q.id))issue(at+'/id','Question IDs must be unique.');ids.add(q.id);if(!q.label.trim())issue(at+'/label','Supply a nonblank question label.');if((q.initialValue?.length??0)>(q.maxLength??4000))issue(at+'/initialValue','Initial value exceeds the field limit.');if(q.kind==='select'){if(!q.options?.length)issue(at+'/options','Select questions need finite options.');const seen=new Set<string>();q.options?.forEach((option,j)=>{if(!option.value.trim()||!option.label.trim())issue(at+'/options/'+j,'Supply nonblank option values and labels.');if(seen.has(option.value))issue(at+'/options/'+j+'/value','Option values must be unique.');seen.add(option.value);});if(q.initialValue&&!seen.has(q.initialValue))issue(at+'/initialValue','Initial selection must name a supplied option.');}else if(q.options!==undefined)issue(at+'/options','Options belong only to select questions.');});
 }else if(node.multiple!==true&&node.maxFiles!==undefined&&node.maxFiles!==1)issue('/maxFiles','Single-file mode permits one file.');
}
export function validLocalFile(file:LocalFileMetadata,kind:'file'|'photo'|'video'|'media',maxBytes:number):boolean {
 return typeof file.name==='string'&&file.name.trim().length>0&&file.name.length<=255&&!/[\u0000-\u001f\u007f]/.test(file.name)&&Number.isSafeInteger(file.size)&&file.size>=0&&file.size<=maxBytes&&typeof file.type==='string'&&file.type.length<=200&&Number.isSafeInteger(file.lastModified)&&file.lastModified>=0&&(kind==='file'||kind==='photo'&&file.type.startsWith('image/')||kind==='video'&&file.type.startsWith('video/')||kind==='media'&&/^(image|video)\//.test(file.type));
}
