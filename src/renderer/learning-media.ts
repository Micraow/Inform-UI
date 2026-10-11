import {suppliedReaderContext} from './supplied-reader-lifecycle.js';
import type {LearningMediaNode} from '../core/learning-media.js';
import type {LearningPracticeImage} from '../schema/document.js';
import type {RendererContext} from './context.js';
import {readerBlocked,readerNativeReset} from './reader-controls.js';

type Phase='editing'|'missing'|'correct'|'incorrect'|'reference';
/** Three finite practice interactions. Answers never leave this renderer's local closure. */
export function renderLearningMedia(c:RendererContext,n:LearningMediaNode):HTMLElement {
 const root=c.element('fieldset','iui-learning-media');c=suppliedReaderContext(c,root);const e=c.element,t=c.labels().learningMediaUI,id=c.allocateInternalId?.('learning-media')??`${c.prefix}-learning-media`;
 root.disabled=n.disabled??false;root.dir='auto';root.dataset.component=n.type;
 const title=e('legend','iui-learning-media-title',n.label),prompt=e('p','iui-learning-media-prompt',n.prompt);
 title.id=id+'-title';prompt.id=id+'-prompt';root.setAttribute('aria-labelledby',title.id);root.append(title,prompt,e('p','iui-learning-media-note',t.note));
 let alive=true,revision=0,phase:Phase='editing',selected:string|null=null,draft='';
 const owned=(element:HTMLElement)=>alive&&c.lifecycle.current()&&root.contains(element);
 const blocked=(control:HTMLElement)=>readerBlocked(root,control,alive&&c.lifecycle.current());
 const put=(element:HTMLElement,value:string)=>{if(owned(element))element.textContent=value;};
 const action=(name:string,label:string)=>{const b=e('button','',label);b.type='button';b.dataset.practiceAction=name;return b;};
 function image(media:LearningPracticeImage):HTMLElement {
  const figure=e('figure','iui-learning-media-figure'),content=e('div','iui-learning-media-image');figure.append(content);
  const alternative=e('p','iui-learning-media-alternative',media.alt);figure.append(alternative);
  if(media.caption!==undefined)figure.append(e('figcaption','',media.caption));
  let requested=false,loading=false;const load=action('load-image',t.imageLoad);
  const loadImage=()=>{
   if(requested||loading||blocked(load)||!owned(content))return;
   loading=true;try{
   const img=e('img');img.alt=media.alt;img.decoding='async';img.referrerPolicy='no-referrer';
   if(blocked(load)||!owned(content))return;
   requested=true;
   c.on(img,'error',()=>{if(owned(figure)&&owned(content)&&img.parentElement===content){figure.dataset.mediaState='error';put(alternative,media.alt+' '+t.mediaError);}});
   c.on(img,'load',()=>{if(owned(figure)&&owned(content)&&img.parentElement===content)figure.dataset.mediaState='loaded';});
   c.lifecycle.acquire(()=>{img.src=media.src;return img;},owned=>owned.removeAttribute('src'));if(blocked(load)||!owned(content)){img.removeAttribute('src');return;}content.replaceChildren(img);if(owned(figure)&&img.parentElement===content)figure.dataset.mediaState='loading';
   c.cleanup(()=>{if(root.contains(img))img.removeAttribute('src');});
   }finally{loading=false;}
  };
  if(/^data:/i.test(media.src)) {
   const img=e('img');img.alt=media.alt;img.decoding='async';c.lifecycle.acquire(()=>{img.src=media.src;return img;},owned=>owned.removeAttribute('src'));content.append(img);figure.dataset.mediaState='inline';
   c.on(img,'error',()=>{if(owned(figure)&&img.parentElement===content){figure.dataset.mediaState='error';put(alternative,media.alt+' '+t.mediaError);}});
  } else {content.append(e('p','iui-learning-media-note',t.disclosure(new URL(media.src).hostname)),load);c.on(load,'click',loadImage);figure.dataset.mediaState='unrequested';}
  return figure;
 }
 if(n.type==='learning-image-label-card')root.append(image(n.image));
 if(n.type==='learning-audio-label-card') {
  const section=e('section','iui-learning-media-audio'),holder=e('div'),transcript=e('details','iui-learning-media-transcript');
  transcript.append(e('summary','',t.transcript),e('p','',n.audio.transcript));
  const enable=action('load-audio',t.audioLoad),error=e('p','iui-learning-media-note');error.setAttribute('role','status');
  section.append(holder,error,transcript);root.append(section);let requested=false;
  const audio=(allowed=()=>true):HTMLAudioElement|null=>{
   if(!allowed())return null;const player=e('audio');if(!allowed())return null;player.controls=true;player.preload='none';player.setAttribute('aria-label',t.audio);
   c.on(player,'error',()=>{if(owned(player))put(error,t.mediaError);});if(!allowed())return null;c.lifecycle.acquire(()=>{player.src=n.audio.src;return player;},owned=>owned.removeAttribute('src'));if(!allowed()){player.removeAttribute('src');return null;}
   c.cleanup(()=>{if(root.contains(player)){if(!player.paused)player.pause();player.removeAttribute('src');if(player.networkState!==0)player.load();}});return player;
  };
  if(/^data:/i.test(n.audio.src)){holder.append(audio()!);requested=true;}else{
   holder.append(e('p','iui-learning-media-note',t.disclosure(new URL(n.audio.src).hostname)),enable);
   c.on(enable,'click',()=>{if(requested||blocked(enable)||!owned(holder))return;requested=true;const player=audio(()=>!blocked(enable)&&owned(holder));if(!player||!alive||!owned(holder))return;holder.replaceChildren(player);if(!blocked(player))player.focus();});
  }
 }
 const controls:HTMLInputElement[]=[];const options:{id:string;input:HTMLInputElement;row:HTMLElement}[]=[];let answerInput:HTMLInputElement|undefined;
 const response=e('div','iui-learning-media-response');root.append(response);
 if(n.type==='learning-image-choice-card') {
  response.classList.add('iui-learning-media-options');response.setAttribute('role','radiogroup');response.setAttribute('aria-required','true');response.setAttribute('aria-labelledby',prompt.id);
  for(const [index,option]of n.options.entries()) {
   const row=e('div','iui-learning-media-option'),label=e('label'),input=e('input');input.type='radio';input.id=id+'-option-'+index;input.dataset.optionId=option.id;input.setAttribute('aria-describedby',id+'-status');
   // Unnamed controls never enter enclosing FormData. The roving radio keys are owned below.
   label.htmlFor=input.id;label.append(input,e('span','',option.label));row.append(image(option.image),label);response.append(row);controls.push(input);options.push({id:option.id,input,row});
   c.on(input,'change',()=>{if(!alive)return;if(blocked(input)||controls.some(blocked)){paint();return;}if(!input.checked){paint();return;}selected=option.id;revision++;phase='editing';paint(t.editing);});
   c.on(input,'keydown',event=>{
    const key=event as KeyboardEvent;if(key.key==='Enter'&&!key.isComposing&&key.keyCode!==229){key.preventDefault();if(!key.repeat)checkAnswer(input);return;}if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(key.key)||key.altKey||key.ctrlKey||key.metaKey)return;
    key.preventDefault();if(blocked(input)||controls.some(blocked))return;
    const rtl=c.doc.defaultView?.getComputedStyle(root).direction==='rtl',step=key.key==='ArrowUp'||key.key===(rtl?'ArrowRight':'ArrowLeft')?-1:1;
    const next=key.key==='Home'?0:key.key==='End'?options.length-1:(index+step+options.length)%options.length;
    selected=options[next].id;const ticket=++revision;phase='editing';paint(t.editing);if(revision===ticket&&!blocked(options[next].input))options[next].input.focus();
   });
  }
 } else {
  const label=e('label','',t.answer);answerInput=e('input','iui-learning-media-answer');answerInput.type='text';answerInput.id=id+'-answer';label.htmlFor=answerInput.id;
  answerInput.setAttribute('aria-required','true');answerInput.autocomplete='off';answerInput.spellcheck=false;answerInput.maxLength=400;answerInput.setAttribute('aria-describedby',id+'-status '+id+'-matching');
  const matching=e('p','iui-learning-media-note',t.matching);matching.id=id+'-matching';response.append(label,answerInput,matching);controls.push(answerInput);
  c.on(answerInput,'input',()=>{if(!alive)return;if(blocked(answerInput!)||Array.from(answerInput!.value).length>200){restore();return;}draft=answerInput!.value;revision++;phase='editing';paint(t.editing);});
  c.on(answerInput,'keydown',event=>{const key=event as KeyboardEvent;if(key.key!=='Enter'||key.isComposing||key.keyCode===229)return;key.preventDefault();if(!key.repeat)checkAnswer(answerInput!);});
 }
 const toolbar=e('div','iui-learning-media-actions'),check=action('check',t.check),reveal=action('reveal',t.reveal),retry=action('retry',t.retry);toolbar.append(check,reveal,retry);
 const status=e('p','iui-learning-media-status'),explanation=e('p','iui-learning-media-explanation');status.id=id+'-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');root.append(toolbar,status,explanation);
 const reference=()=>n.type==='learning-image-choice-card'?n.options.find(option=>option.id===n.answerId)!.label:n.answers.map(a=>a.trim()).join(' / ');
 function restore():void {if(!alive)return;const before=revision;if(answerInput&&owned(answerInput))answerInput.value=draft;for(const option of options){if(!alive||revision!==before)return;if(owned(option.input))option.input.checked=selected===option.id;}}
 function paint(message?:string):void {
  if(!alive)return;const before=revision,connected=root.isConnected;restore();if(!alive||revision!==before||(connected&&(!root.isConnected||controls.some(blocked))))return;root.dataset.phase=phase;
  for(const[index,option]of options.entries()) {
   if(owned(option.input)){option.input.tabIndex=selected===option.id||(selected===null&&index===0)?0:-1;option.input.setAttribute('aria-invalid',String(phase==='missing'||phase==='incorrect'));}
   if(owned(option.row))option.row.dataset.selected=String(option.id===selected);
  }
  if(answerInput&&owned(answerInput))answerInput.setAttribute('aria-invalid',String(phase==='missing'||phase==='incorrect'));
  if(message!==undefined)put(status,message);
  const show=['correct','incorrect','reference'].includes(phase)&&n.explanation!==undefined;if(owned(explanation)){explanation.hidden=!show;explanation.textContent=show?n.explanation!:'';}
 }
 function checkAnswer(control:HTMLElement):void {
  if(blocked(control)||controls.some(blocked))return;const ticket=++revision;
  if(n.type==='learning-image-choice-card')phase=selected===null?'missing':selected===n.answerId?'correct':'incorrect';
  else phase=!draft.trim()?'missing':n.answers.some(answer=>answer.trim()===draft.trim())?'correct':'incorrect';
  paint(t[phase]);if(revision===ticket&&phase==='missing'&&!blocked(controls[0]))controls[0].focus();
 }
 c.on(check,'click',()=>checkAnswer(check));
 c.on(reveal,'click',()=>{if(blocked(reveal)||controls.some(blocked))return;revision++;phase='reference';paint(t.reference+': '+reference());});
 const reset=()=>{draft='';selected=null;phase='editing';const ticket=++revision;paint(t.reset);return ticket;};
 c.on(retry,'click',()=>{if(blocked(retry)||controls.some(blocked))return;const ticket=reset();if(revision===ticket&&!blocked(controls[0]))controls[0].focus();});readerNativeReset(c,root,controls,()=>revision,restore,reset);
 c.cleanup(()=>{alive=false;});paint('');return root;
}
