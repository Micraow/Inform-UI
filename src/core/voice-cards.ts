import type {Issue} from './index.js';
/** Capabilities and phases are supplied data, never a browser permission probe. */
export interface VoiceCardBase {
 id?:string; label:string; status?:'resolved'|'pending'|'failed'; fallback?:string;
 disabled?:boolean; available?:boolean; unavailableLabel?:string; requestedLabel?:string; cancelledLabel?:string;
}
export interface LearningVoiceModeLauncherCard extends VoiceCardBase {
 type:'learning-voice-mode-launcher-card'; title?:string; description?:string; startLabel?:string; voiceSession?:{id:string};
}
export interface OfferVoiceConversation extends VoiceCardBase {
 type:'offer-voice-conversation'; presentation?:'button'|'card'; buttonLabel?:string; description?:string; iconSrc?:string;
}
export type SpeakPhase='idle'|'starting'|'listening'|'success'|'failure'|'error';
export interface SpeakExercise {
 id:string; text:string; sourceText?:string; language?:string; mode?:'repeat'|'recall'; phase?:SpeakPhase;
 available?:boolean; playbackAvailable?:boolean; playbackPhase?:'idle'|'playing'|'error';
 labels?:Partial<Record<'title'|'directions'|'start'|'stop'|'retry'|'starting'|'listening'|'success'|'failure'|'error'|'play'|'stopPlayback'|'playbackError'|'hiddenWord',string>>;
 segments?:{text:string;matched?:boolean}[];
}
export interface LearningSpeakCard extends VoiceCardBase {
 type:'learning-speak-card'; exercises?:SpeakExercise[]; progressLabels?:string[]; previousLabel?:string; nextLabel?:string; doneLabel?:string;
}
export type VoiceCardNode=LearningVoiceModeLauncherCard|OfferVoiceConversation|LearningSpeakCard;
export interface VoiceIntentDetail {readonly id:string|null;readonly source:'learning-voice-mode-launcher-card'|'offer-voice-conversation';readonly intent:'start';readonly voiceSessionId?:string}
export interface SpeakIntentDetail {readonly id:string|null;readonly exerciseId:string;readonly intent:'start'|'stop'|'play'|'stop-playback'|'finish';readonly text:string;readonly language?:string;readonly exerciseIds?:readonly string[]}
export function inspectVoiceCards(node:VoiceCardNode,path:string,add:(issue:Issue)=>void,safe:(url:string,kind?:'link'|'image')=>boolean):void {
 const issue=(at:string,message:string)=>add({code:'VOICE_CARD_DATA',path:path+at,message});
 for(const[key,value]of Object.entries(node))if(typeof value==='string'&&!value.trim())issue('/'+key,'Supply nonblank text.');
 if(node.type==='offer-voice-conversation'){
  if(node.iconSrc!==undefined&&!safe(node.iconSrc,'image'))issue('/iconSrc','Supply a safe image source.');
 }else if(node.type==='learning-voice-mode-launcher-card'){
  if(node.voiceSession&&!node.voiceSession.id.trim())issue('/voiceSession/id','Supply a nonblank session identifier.');
 }else{
  const ids=new Set<string>();
  node.exercises?.forEach((exercise,index)=>{
   const at='/exercises/'+index;
   if(ids.has(exercise.id))issue(at+'/id','Exercise IDs must be unique.');ids.add(exercise.id);
   for(const[key,value]of Object.entries(exercise))if(typeof value==='string'&&!value.trim())issue(at+'/'+key,'Supply nonblank exercise text.');
   if(exercise.mode==='recall'&&!exercise.sourceText?.trim())issue(at+'/sourceText','Recall needs a supplied source phrase.');
   for(const[key,value]of Object.entries(exercise.labels??{}))if(!value.trim())issue(at+'/labels/'+key,'Supply nonblank labels.');
   if(exercise.segments&&exercise.segments.map(part=>part.text).join('')!==exercise.text)issue(at+'/segments','Supplied segments must reconstruct the target phrase exactly.');
  });
  if(node.progressLabels&&(node.progressLabels.length!==node.exercises?.length||node.progressLabels.some(label=>!label.trim())))issue('/progressLabels','Supply one nonblank progress label per exercise.');
 }
}
