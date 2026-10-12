import {object,short,string,array,ref,choice,integer,suppliedKey,flightAt} from '../primitives.mjs';
/** Existing finite readers: original declarations moved intact. */
export function install({defs,node}){
// Original supplied related-question reader, explicitly distinct from answer generation.
defs.RelatedQuestionSource=object({label:short,url:string(2048,1)},['label','url']);
defs.RelatedQuestion=object({id:suppliedKey,question:string(500,1),answer:{anyOf:[string(10000),{type:'null'}]},sources:array(ref('RelatedQuestionSource'),0,5)},['id','question','answer']);
node('sidebar-people-also-ask',{label:short,description:string(2000),items:array(ref('RelatedQuestion'),0,40),expanded:array(suppliedKey,0,40)},['label','items']);
// Original supplied plain-text mail and finite file navigation; no provider/filesystem access.
defs.ReaderSource=object({label:short,url:string(2048,1)},['label','url']);
defs.EmailPreviewPerson=object({name:short,address:string(320,1)},['address']);
const readerMetadata={sizeBytes:integer(0,1e12),mediaType:short,description:string(2000)};
defs.EmailPreviewAttachment=object({id:suppliedKey,name:short,...readerMetadata,url:string(2048,1)},['id','name']);
node('email-preview',{subject:string(500,1),from:ref('EmailPreviewPerson'),to:array(ref('EmailPreviewPerson'),0,40),cc:array(ref('EmailPreviewPerson'),0,40),sentAt:flightAt,body:string(20000),quotedText:string(20000),attachments:array(ref('EmailPreviewAttachment'),0,20),source:ref('ReaderSource')},['subject','from','to','body']);
const fileEntryCommon={id:suppliedKey,name:short,parentId:{anyOf:[suppliedKey,{type:'null'}]},description:string(2000)};
defs.FileNavFolder=object({...fileEntryCommon,kind:{const:'folder'}},['id','name','kind']);
defs.FileNavFile=object({...fileEntryCommon,...readerMetadata,kind:{const:'file'},category:choice('document','image','audio','video','archive','other'),modifiedAt:flightAt,url:string(2048,1)},['id','name','kind']);
defs.FileNavEntry={oneOf:[ref('FileNavFolder'),ref('FileNavFile')]};
node('file-nav-list',{label:short,description:string(2000),entries:array(ref('FileNavEntry'),0,120),initialFolderId:suppliedKey,source:ref('ReaderSource')},['label','entries']);
}
