import type {EmailPreviewNode,FileNavListNode} from '../schema/document.js';
import type {Issue} from './index.js';
import {flightInstant} from './travel-events.js';
/** Only metadata supplied by the document; no mailbox or filesystem resolution. */
export function inspectMailFiles(n:EmailPreviewNode|FileNavListNode,path:string,add:(issue:Issue)=>void,safeURL:(url:string)=>boolean):void {
 const url=(value:string,at:string)=>{if(!/^https?:\/\//i.test(value)||!safeURL(value))add({code:'UNSAFE_URL',path:at,message:'Supplied links require allowed absolute HTTP(S) destinations.'});};
 const time=(value:string,at:string)=>{if(!Number.isFinite(flightInstant(value)))add({code:'READER_TIME',path:at,message:'Use a real Gregorian minute timestamp with an explicit Z or offset, years 1000–9999.'});};
 if(n.source)url(n.source.url,`${path}/source/url`);
 if(n.type==='email-preview'){
  if(n.sentAt!==undefined)time(n.sentAt,`${path}/sentAt`);const ids=new Set<string>();
  (n.attachments??[]).forEach((file,index)=>{const at=`${path}/attachments/${index}`;if(ids.has(file.id))add({code:'DUPLICATE_ID',path:`${at}/id`,message:'Attachment IDs must be unique.'});ids.add(file.id);if(file.url!==undefined)url(file.url,`${at}/url`);});
 }else{
  const entries=new Map(n.entries.map(entry=>[entry.id,entry])),ids=new Set<string>();
  n.entries.forEach((entry,index)=>{const at=`${path}/entries/${index}`;if(ids.has(entry.id))add({code:'DUPLICATE_ID',path:`${at}/id`,message:'Entry IDs must be unique.'});ids.add(entry.id);
   if(entry.parentId!=null&&entries.get(entry.parentId)?.kind!=='folder')add({code:'FILE_PARENT',path:`${at}/parentId`,message:'A parent must refer to a supplied folder.'});
   const seen=new Set([entry.id]);let parent=entry.parentId,depth=0;
   while(parent!=null){if(seen.has(parent)){add({code:'FILE_CYCLE',path:`${at}/parentId`,message:'Supplied folder ancestry cannot contain a cycle.'});break;}seen.add(parent);if(++depth>4){add({code:'FILE_DEPTH',path:`${at}/parentId`,message:'Entries may have at most four folder ancestors.'});break;}parent=entries.get(parent)?.parentId;}
   if(entry.kind==='file'){if(entry.url!==undefined)url(entry.url,`${at}/url`);if(entry.modifiedAt!==undefined)time(entry.modifiedAt,`${at}/modifiedAt`);}
  });
  if(n.initialFolderId!==undefined&&entries.get(n.initialFolderId)?.kind!=='folder')add({code:'FILE_FOLDER',path:`${path}/initialFolderId`,message:'The initial folder must be a supplied folder ID.'});
 }
}
