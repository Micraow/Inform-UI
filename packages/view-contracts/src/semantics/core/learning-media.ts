import type {Node, LearningImageChoiceCardNode, LearningImageLabelCardNode, LearningAudioLabelCardNode} from '../schema/document.js';
import type {Issue} from './index.js';
export type LearningMediaNode = LearningImageChoiceCardNode | LearningImageLabelCardNode | LearningAudioLabelCardNode;
export const isLearningMedia = (node:Node):node is LearningMediaNode => ['learning-image-choice-card','learning-image-label-card','learning-audio-label-card'].includes(node.type);
/** A URL hostname is not automatically a safe CSP host-source token. */
export function audioHTTPSource(src:string):string|null {
 try {
  const url=new URL(src);
  if(!['http:','https:'].includes(url.protocol)||url.username||url.password)return null;
  const host=url.hostname;
  if(host.length>253||!host.split('.').every(label=>label.length<=63&&/^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$(?![\s\S])/.test(label)))return null;
  // CSP3 host matching only defines a matching IPv4 source for this loopback literal.
  if(/^\d+\.\d+\.\d+\.\d+$/.test(host)&&host!=='127.0.0.1')return null;
  return url.origin;
 } catch {return null;}
}
/** Bounded, supplied practice media. No decoder, media retrieval or grading service. */
export function inspectLearningMedia(node:LearningMediaNode,path:string,add:(issue:Issue)=>void,safeURL:(url:string,kind?:'link'|'image')=>boolean):void {
 const issue=(code:string,at:string,message:string)=>add({code,path:path+at,message});
 const image=(src:string,at:string)=>{if(!safeURL(src,'image'))issue('UNSAFE_URL',at,'Images require allowed HTTP(S) or base64 PNG, JPEG, GIF or WebP.');};
 if(node.type==='learning-image-choice-card') {
  const ids=new Set<string>();
  node.options.forEach((option,index)=>{if(ids.has(option.id))issue('DUPLICATE_ID',`/options/${index}/id`,'Option IDs must be unique.');ids.add(option.id);image(option.image.src,`/options/${index}/image/src`);});
  if(!ids.has(node.answerId))issue('LEARNING_ANSWER_REFERENCE','/answerId','The supplied answer must name an option.');
 } else {
  const answers=new Set<string>();
  node.answers.forEach((answer,index)=>{const normalized=answer.trim();if(!normalized)issue('LEARNING_ANSWER_EMPTY',`/answers/${index}`,'Answers must contain non-whitespace text.');if(answers.has(normalized))issue('DUPLICATE_ANSWER',`/answers/${index}`,'Answers must be distinct after trimming.');answers.add(normalized);});
  if(node.type==='learning-image-label-card')image(node.image.src,'/image/src');
  else {
   const src=node.audio.src;
   const inline=/^data:audio\/(?:wav|mpeg|ogg|mp4|webm);base64,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$(?![\s\S])/i.test(src)&&src.split(',')[1].length>0;
   if(!inline&&(!/^https?:\/\//i.test(src)||!safeURL(src)||audioHTTPSource(src)===null))issue('UNSAFE_URL','/audio/src','Audio requires allowed HTTP(S) with a bounded DNS host or 127.0.0.1, or nonempty base64 WAV, MPEG, OGG, MP4 or WebM. Wildcard, delimiter, other IP-literal and trailing-dot hosts are not supported.');
  }
 }
}
