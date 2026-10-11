import type {VoiceCardNode,LearningSpeakCard,SpeakExercise,VoiceIntentDetail,SpeakIntentDetail} from '../core/voice-cards.js';
import type {RendererContext} from './context.js';
import {suppliedReaderContext,suppliedReaderInput,suppliedReaderPainter} from './supplied-reader-lifecycle.js';
import {readerBlocked,readerNativeReset} from './reader-controls.js';
import {intentGate} from './intent-gate.js';
import {renderSearchImage} from './search-image.js';

/** Supplied UI only. Events are receipts: they do not start recording, playback or a session. */
export function renderVoiceCard(parent:RendererContext,node:VoiceCardNode,owner:HTMLElement,host:HTMLElement):HTMLElement {
 const root=parent.element('section','iui-voice-card iui-'+node.type),c=suppliedReaderContext(parent,root),life=c.lifecycle,write=life.during,paint=suppliedReaderPainter(c),input=suppliedReaderInput(c),gate=intentGate(life);
 write(()=>{root.dir='auto';root.setAttribute('role','group');root.setAttribute('aria-label',node.label);root.dataset.phase=node.status??'resolved';});
 if(node.status==='pending'){
  const loading=c.element('div','iui-voice-loading');write(()=>{root.setAttribute('aria-busy','true');loading.setAttribute('role','status');loading.setAttribute('aria-label',node.label);root.append(loading);});return root;
 }
 if(node.status==='failed'){if(node.fallback)write(()=>root.append(c.element('p','iui-voice-fallback',node.fallback)));else write(()=>{root.hidden=true;});return root;}
 const button=(label:string,action:string)=>{const el=c.element('button','iui-voice-'+action,label);write(()=>{el.type='button';el.dataset.voiceAction=action;});return el;};
 const status=c.element('p','iui-voice-status'),capability=c.element('p','iui-voice-capability');write(()=>{status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');});
 let revision=0,notice='',finished=false,resetPending=()=>false,refresh=()=>{};
 const allowed=(control:HTMLElement)=>write(()=>node.disabled!==true&&!readerBlocked(root,control,life.current()));
 const request=(source:Event,control:HTMLButtonElement,name:string,detail:VoiceIntentDetail|SpeakIntentDetail,available:()=>boolean)=>{
  const ticket=revision;
  if(write(()=>source.defaultPrevented)||resetPending()||!allowed(control)||!available())return;
  const Constructor=write(()=>c.doc.defaultView?.CustomEvent);if(!Constructor)return;
  const event=write(()=>new Constructor(name,{detail:Object.freeze(detail),bubbles:true,cancelable:true,composed:false}));
  if(ticket!==revision||resetPending()||!allowed(control)||!available())return;
  const accepted=write(()=>root.dispatchEvent(event));
  if(ticket!==revision||resetPending()||!allowed(control)||!available())return;
  if(accepted&&detail.intent==='finish')finished=true;
  revision++;notice=accepted?(node.requestedLabel??'Local request accepted'):(node.cancelledLabel??'Local request cancelled');refresh();
 };
 if(node.type!=='learning-speak-card'){
  const launcher=node.type==='learning-voice-mode-launcher-card',trigger=button(launcher?node.startLabel??'Start voice':node.buttonLabel??'Start voice','start');
  write(()=>trigger.setAttribute('aria-label',launcher?node.startLabel??'Start voice':node.buttonLabel??'Start voice'));
  if(launcher){write(()=>root.append(c.element('h3','iui-voice-title',node.title),c.element('p','iui-voice-description',node.description),trigger));}
  else{
   write(()=>{root.dataset.presentation=node.presentation??'button';});
   if(node.presentation==='card'){
    if(node.iconSrc){const icon=renderSearchImage(c,{type:'search-image',searchImage:{content_url:node.iconSrc},alt:'',width:36,height:36,fit:'contain',hideOnFailure:true},owner,host);write(()=>{icon.classList.add('iui-voice-icon');icon.setAttribute('aria-hidden','true');trigger.prepend(icon);});}
    if(node.description)write(()=>trigger.append(c.element('span','iui-voice-description',node.description)));
   }
   write(()=>root.append(trigger));
  }
  write(()=>root.append(capability,status));
  const available=()=>node.available===true;
  refresh=()=>paint(scope=>{scope.during(()=>{trigger.disabled=node.disabled===true||!available();});scope.during(()=>{capability.textContent=available()?'':node.unavailableLabel??'Voice is unavailable';});scope.during(()=>{status.textContent=notice;});});
  c.on(trigger,'click',event=>gate.run(()=>request(event,trigger,'iui:voice',{id:node.id??null,source:node.type,intent:'start',...(launcher?{voiceSessionId:node.voiceSession!.id}:{})},available)));
  resetPending=readerNativeReset(c,root,[trigger],()=>revision,()=>refresh(),()=>{revision++;notice='';refresh();});refresh();return root;
 }
 const speak:LearningSpeakCard=node,exercises=speak.exercises??[];
 if(exercises.length===0){write(()=>{root.hidden=true;});return root;}
 let index=0;
 const current=():SpeakExercise=>exercises[index];
 const title=c.element('h3','iui-voice-title'),directions=c.element('p','iui-voice-description'),sourcePhrase=c.element('p','iui-speak-source'),phrase=c.element('div','iui-speak-phrase'),phaseLabel=c.element('p','iui-speak-phase'),playbackLabel=c.element('p','iui-speak-playback-status');
 const actions=c.element('div','iui-voice-actions'),primary=button('','speak'),playback=button('','playback'),previous=button(speak.previousLabel??'Previous exercise','previous'),next=button(speak.nextLabel??'Next exercise','next'),done=button(speak.doneLabel??'Finish','done'),reset=button(speak.resetLabel??'Reset practice','reset'),progress=c.element('output','iui-speak-progress'),navigation=c.element('div','iui-speak-navigation');
 write(()=>{phaseLabel.setAttribute('role','status');phaseLabel.setAttribute('aria-live','polite');progress.setAttribute('aria-live','polite');actions.append(primary,playback);navigation.append(previous,progress,next,done,reset);root.append(title,directions,sourcePhrase,phrase,phaseLabel,actions,playbackLabel,capability,navigation,status);});
 const canSpeak=()=>node.available===true&&current().available!==false;
 const active=()=>current().phase==='starting'||current().phase==='listening';
 const canPlay=()=>current().playbackAvailable===true&&!active()&&(current().mode!=='recall'||current().phase==='success'||current().phase==='failure');
 const canNext=()=>index<exercises.length-1&&current().phase==='success';
 const canFinish=()=>!finished&&!!speak.doneLabel&&index===exercises.length-1&&exercises.every(exercise=>exercise.phase==='success');
 refresh=()=>paint(scope=>{
  const exercise=current(),labels=exercise.labels??{},phase=exercise.phase??'idle',recall=exercise.mode==='recall',reveal=!recall||phase==='success'||phase==='failure';
  scope.during(()=>{root.dataset.exerciseId=exercise.id;root.dataset.speakPhase=phase;root.dataset.mode=exercise.mode??'repeat';});
  scope.during(()=>{title.textContent=labels.title??speak.label;});scope.during(()=>{directions.textContent=labels.directions??'';});scope.during(()=>{sourcePhrase.textContent=exercise.sourceText??'';sourcePhrase.hidden=!exercise.sourceText;});
  scope.during(()=>{phrase.lang=exercise.language??'';});
  const parts=(exercise.segments??[{text:exercise.text}]).map(segment=>{
   const hidden=!reveal&&!segment.matched&&segment.text.trim().length>0;
   const span=c.element('span',hidden?'iui-speak-hidden':'iui-speak-segment',hidden?'•••':segment.text);
   scope.during(()=>{if(hidden)span.setAttribute('aria-label',labels.hiddenWord??'Hidden phrase');else if(segment.matched)span.dataset.matched='true';});return span;
  });scope.during(()=>phrase.replaceChildren(...parts));
  const message=phase==='starting'?(labels.starting??'Starting'):phase==='listening'?(labels.listening??'Listening'):phase==='success'?(labels.success??'Completed'):phase==='failure'?(labels.failure??'Try again'):phase==='error'?(labels.error??'Speaking unavailable'):'';
  scope.during(()=>{phaseLabel.textContent=message;});
  scope.during(()=>{primary.textContent=active()?(labels.stop??'Stop'):(phase==='idle'?(labels.start??'Start speaking'):(labels.retry??'Try again'));primary.disabled=node.disabled===true||!canSpeak();});
  scope.during(()=>{playback.textContent=exercise.playbackPhase==='playing'?(labels.stopPlayback??'Stop playback'):(labels.play??'Listen');playback.disabled=node.disabled===true||!canPlay();playback.hidden=!canPlay();});
  scope.during(()=>{playbackLabel.textContent=exercise.playbackPhase==='error'?(labels.playbackError??'Playback unavailable'):'';});
  scope.during(()=>{capability.textContent=canSpeak()?'':node.unavailableLabel??'Speaking is unavailable';});
  scope.during(()=>{previous.disabled=node.disabled===true||index===0;next.disabled=node.disabled===true||!canNext();previous.hidden=exercises.length===1;next.hidden=exercises.length===1;});
  scope.during(()=>{done.hidden=!speak.doneLabel||index!==exercises.length-1;done.disabled=node.disabled===true||!canFinish();});
  scope.during(()=>{reset.disabled=node.disabled===true;});
  scope.during(()=>{progress.textContent=speak.progressLabels?.[index]??`${index+1} / ${exercises.length}`;});scope.during(()=>{status.textContent=notice;});
 });
 const detail=(intent:SpeakIntentDetail['intent']):SpeakIntentDetail=>({id:node.id??null,exerciseId:current().id,intent,text:current().text,...(current().language?{language:current().language}:{}),...(intent==='finish'?{exerciseIds:Object.freeze(exercises.map(exercise=>exercise.id))}:{})});
 c.on(primary,'click',event=>gate.run(()=>request(event,primary,'iui:speak',detail(active()?'stop':'start'),canSpeak)));
 c.on(playback,'click',event=>gate.run(()=>request(event,playback,'iui:speak',detail(current().playbackPhase==='playing'?'stop-playback':'play'),canPlay)));
 c.on(done,'click',event=>gate.run(()=>request(event,done,'iui:speak',detail('finish'),canFinish)));
 const navigate=(event:Event,control:HTMLButtonElement,step:number)=>gate.run(()=>input.run(scope=>{
  if(scope.during(()=>event.defaultPrevented)||!allowed(control)||step<0&&index===0||step>0&&!canNext())return;
  revision++;index+=step;notice='';refresh();
 }));
 c.on(previous,'click',event=>navigate(event,previous,-1));c.on(next,'click',event=>navigate(event,next,1));
 // A visible local reset remains available when speaking or Finish is disabled.
 const clear=()=>{input.retire();revision++;index=0;notice='';finished=false;refresh();};
 c.on(reset,'click',event=>gate.run(()=>{if(write(()=>event.defaultPrevented)||!allowed(reset))return;clear();}));
 resetPending=readerNativeReset(c,root,[reset],()=>revision,()=>refresh(),clear);refresh();return root;
}
