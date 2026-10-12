import {object,short,string,array,ref,integer} from '../primitives.mjs';
/** Existing authored declarations; no change to supplied-data or local interaction semantics. */
export function install({defs,node}){
// Original supplied code-line and document-page citation readers.
node('code-cite',{label:short,fileName:short,language:short,startLine:integer(1,10000000),lines:array(string(2000),1,120),citedStart:integer(1,10000000),citedEnd:integer(1,10000000),source:ref('TravelEventSource')},['label','fileName','startLine','lines']);
defs.CitedFilePage=object({number:integer(1,10000000),label:short,text:string(6000,1),source:ref('TravelEventSource')},['number','text']);
node('file-cite',{label:short,fileName:short,mediaType:short,totalPages:integer(1,10000000),pages:array(ref('CitedFilePage'),1,30),initialPage:integer(1,10000000),source:ref('TravelEventSource')},['label','fileName','pages']);
}
