import {object,short,string,array,ref,choice,bool,suppliedKey} from '../primitives.mjs';
/** Existing authored declarations; no change to supplied-data or local interaction semantics. */
export function install({defs,node}){
// Original supplied vocabulary and explicit local clipboard workflow.
defs.WordExample=object({text:string(1000,1),translation:string(1000)},['text']);
node('word-card',{wordId:suppliedKey,term:string(200,1),definition:string(5000,1),pronunciation:short,partOfSpeech:short,translation:string(2000),examples:array(ref('WordExample'),0,8),initiallyRevealed:bool,disabled:bool,source:ref('TravelEventSource')},['wordId','term','definition']);
defs.CopyWord=object({id:suppliedKey,text:string(200,1),note:string(1000)},['id','text']);
node('copy-words',{label:short,description:string(2000),words:array(ref('CopyWord'),0,80),initialSelectedIds:array(suppliedKey,0,80),separator:choice('lines','comma','space'),disabled:bool},['label','words']);
}
