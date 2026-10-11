import type {OnboardingCardsNode,OnboardingArtwork,OnboardingFeatureDetail,OnboardingPluginDetail,OnboardingTaskDetail} from '../core/onboarding-cards.js';
import type {RendererContext} from './context.js';
import type {Inline} from './markdown-parser.js';
import {parseMarkdown} from './markdown-parser.js';
import {suppliedReaderContext,suppliedReaderPainter} from './supplied-reader-lifecycle.js';
import {readerBlocked,readerNativeReset} from './reader-controls.js';
import {intentGate} from './intent-gate.js';
import {renderSearchImage} from './search-image.js';
import {renderCarousel} from './carousel.js';
import {carouselEnglish} from './carousel-labels.js';

/** Formatting without navigation, source loading or authored HTML execution. */
function textOnly(c:RendererContext,value:string):HTMLElement {
 const root=c.element('div','iui-onboarding-welcome'),write=c.lifecycle.during,plan=parseMarkdown(value);
 const append=(parent:HTMLElement,tokens:Inline[])=>{for(const token of tokens){const child=c.element(token.kind==='text'||token.kind==='link'?'span':token.kind,'',token.text);write(()=>parent.append(child));}};
 for(const block of plan.blocks){
  if(block.kind==='code'){const pre=c.element('pre','',block.text);write(()=>root.append(pre));}
  else if(block.kind==='list'){const list=c.element(block.ordered?'ol':'ul');for(const item of block.items){const li=c.element('li');if(item.value!==undefined)write(()=>{li.value=item.value!;});append(li,item.content);write(()=>list.append(li));}write(()=>root.append(list));}
  else {const el=c.element(block.kind==='heading'?'h3':block.kind==='quote'?'blockquote':'p');append(el,block.content);write(()=>root.append(el));}
 }
 return root;
}
/** Bounded local receipts and selection. This component never executes a service action. */
export function renderOnboardingCards(parent:RendererContext,node:OnboardingCardsNode,owner:HTMLElement,host:HTMLElement):HTMLElement {
 const root=parent.element('section','iui-onboarding-cards iui-'+node.type),c=suppliedReaderContext(parent,root),life=c.lifecycle,write=life.during,paint=suppliedReaderPainter(c),gate=intentGate(life);
 write(()=>{root.dir='auto';root.setAttribute('role','group');root.setAttribute('aria-label',node.label);root.dataset.phase=node.status??'resolved';});
 if(node.status==='pending'){const loading=c.element('div','iui-onboarding-cards-loading');write(()=>{root.setAttribute('aria-busy','true');loading.setAttribute('role','status');loading.setAttribute('aria-label',node.label);root.append(loading);});return root;}
 if(node.status==='failed'){if(node.fallback)write(()=>root.append(c.element('p','',node.fallback)));else write(()=>{root.hidden=true;});return root;}
 const notice=c.element('p','iui-onboarding-cards-status');write(()=>{notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');notice.setAttribute('aria-atomic','true');});
 let revision=0,message='',selected=node.type==='onboarding-starter-tasks'?node.selectedTaskId:undefined,resetPending=()=>false;
 const initial=selected,selectable:{id:string;button:HTMLButtonElement}[]=[],anchors:HTMLButtonElement[]=[];
 const refresh=()=>paint(scope=>{scope.during(()=>{notice.textContent=message;});for(const item of selectable)scope.during(()=>item.button.setAttribute('aria-pressed',String(item.id===selected)));});
 const allowed=(control:HTMLButtonElement,enabled:()=>boolean)=>write(()=>node.disabled!==true&&enabled()&&!readerBlocked(root,control,life.current()));
 const makeButton=(label:string,cls:string,enabled:()=>boolean)=>{const button=c.element('button',cls,label);write(()=>{button.type='button';button.disabled=node.disabled===true||!enabled();button.setAttribute('aria-label',label);});if(node.disabled!==true&&enabled())anchors.push(button);return button;};
 const request=(event:Event,control:HTMLButtonElement,name:string,detail:OnboardingFeatureDetail|OnboardingPluginDetail|OnboardingTaskDetail,enabled:()=>boolean,choose?:string)=>{
  const before=revision,selectionInput=choose!==undefined;
  // A new selection is local input and may supersede a queued reset. Other intents wait.
  if(write(()=>event.defaultPrevented)||!selectionInput&&resetPending()||!allowed(control,enabled))return;
  const Constructor=write(()=>c.doc.defaultView?.CustomEvent);if(!Constructor)return;
  const emitted=write(()=>new Constructor(name,{detail:Object.freeze(detail),bubbles:true,cancelable:true,composed:false}));
  if(before!==revision||!selectionInput&&resetPending()||!allowed(control,enabled))return;
  const accepted=write(()=>root.dispatchEvent(emitted));if(before!==revision||!selectionInput&&resetPending()||!allowed(control,enabled))return;
  revision++;if(accepted&&choose!==undefined)selected=choose;message=accepted?(node.requestedLabel??'Local request accepted'):(node.cancelledLabel??'Local request cancelled');refresh();
 };
 const artwork=(value:OnboardingArtwork,width=80,height=80)=>{
  const theme=write(()=>owner.dataset.theme),dark=theme==='dark'||theme!=='light'&&write(()=>c.doc.defaultView?.matchMedia?.('(prefers-color-scheme: dark)').matches===true);
  const src=dark?value.darkImageSrc??value.imageSrc:value.imageSrc??value.darkImageSrc;
  if(!src)return undefined;
  const image=renderSearchImage(c,{type:'search-image',searchImage:{content_url:src},alt:'',width,height,fit:'contain',hideOnFailure:true},owner,host);write(()=>{image.classList.add('iui-onboarding-artwork');image.setAttribute('aria-hidden','true');});return image;
 };
 if(node.type==='onboarding-feature-card'){
  if(node.welcomeHeading)write(()=>root.append(c.element('h3','',node.welcomeHeading)));
  if(node.welcomeBody){const welcome=textOnly(c,node.welcomeBody);write(()=>root.append(welcome));}
  const cards=(node.features??[]).map(feature=>{
   const enabled=()=>feature.disabled!==true,button=makeButton(feature.title,'iui-onboarding-feature',enabled),heading=c.element('span','iui-onboarding-item-title',feature.title),description=c.element('span','iui-onboarding-item-description',feature.description),art=c.element('span','iui-onboarding-feature-art');
   write(()=>{button.textContent='';button.dataset.featureId=feature.featureId;});
   const image=artwork(feature,120,110);if(image)write(()=>art.append(image));if(feature.artworkLabel)write(()=>art.append(c.element('span','iui-onboarding-artwork-label',feature.artworkLabel)));write(()=>button.append(art,heading,description));
   c.on(button,'click',event=>gate.run(()=>request(event,button,'iui:onboarding-feature',{id:node.id??null,target:'feature',itemId:feature.id,featureId:feature.featureId,intent:feature.featureId==='intelligence'?'set-thinking-effort':feature.featureId==='images'?'open-image-composer':'open-feature',...(feature.tooltip?{tooltip:feature.tooltip}:{})},enabled)));
   return button;
  });
  if(cards.length){let index=0;const carousel=renderCarousel({...c,render:()=>cards[index++]},{type:'carousel',label:node.label,children:cards.map(()=>({type:'text',value:''}))},{...carouselEnglish,previous:node.previousLabel??carouselEnglish.previous,next:node.nextLabel??carouselEnglish.next});write(()=>root.append(carousel));}
  write(()=>root.append(c.element('h3','iui-onboarding-cards-title',node.title)));
  const benefits=c.element('div','iui-onboarding-benefits');
  for(const benefit of node.benefits??[]){const enabled=()=>benefit.disabled!==true,row=benefit.featureId?makeButton(benefit.title,'iui-onboarding-benefit',enabled):c.element('div','iui-onboarding-benefit');write(()=>{row.textContent='';});if(benefit.symbol){const symbol=c.element('span','iui-onboarding-symbol',benefit.symbol);write(()=>{symbol.setAttribute('aria-hidden','true');row.append(symbol);});}const text=c.element('span','iui-onboarding-item-copy');write(()=>{text.append(c.element('span','iui-onboarding-item-title',benefit.title),c.element('span','iui-onboarding-item-description',benefit.description));row.append(text);benefits.append(row);});
   if(benefit.featureId)c.on(row,'click',event=>gate.run(()=>request(event,row as HTMLButtonElement,'iui:onboarding-feature',{id:node.id??null,target:'benefit',itemId:benefit.id,featureId:benefit.featureId!,intent:'open-feature'},enabled)));
  }write(()=>root.append(benefits));if(!cards.length&&!node.benefits?.length)write(()=>root.append(c.element('p','iui-onboarding-empty',node.emptyLabel??'No features supplied')));
 }else if(node.type==='onboarding-plugin-suggestions'){
  const header=c.element('div','iui-onboarding-plugin-header');write(()=>header.append(c.element('h3','iui-onboarding-cards-title',node.title)));
  if(node.canBrowse){const browse=makeButton(node.browseLabel??'Browse apps','iui-onboarding-browse',()=>node.canBrowse===true);write(()=>header.append(browse));c.on(browse,'click',event=>gate.run(()=>request(event,browse,'iui:onboarding-plugin',{id:node.id??null,intent:'browse'},()=>node.canBrowse===true)));}write(()=>root.append(header));
  const list=c.element('ul','iui-onboarding-plugins');
  for(const[ordinal,plugin]of(node.plugins??[]).slice(0,4).entries()){
   const row=c.element('li','iui-onboarding-plugin'),copy=c.element('div','iui-onboarding-item-copy'),state=c.element('span','iui-onboarding-plugin-state',plugin.statusLabel??(plugin.status==='connected'?'Connected':plugin.status==='unavailable'?'Unavailable':''));write(()=>{row.dataset.pluginId=plugin.id;row.dataset.pluginStatus=plugin.status;copy.append(c.element('span','iui-onboarding-item-title',plugin.label));});if(plugin.description)write(()=>copy.append(c.element('span','iui-onboarding-item-description',plugin.description)));const image=artwork(plugin,44,44);if(image)write(()=>row.append(image));write(()=>row.append(copy,state));
   if(plugin.status==='available'&&node.canConnect){const enabled=()=>plugin.disabled!==true&&node.canConnect===true&&plugin.status==='available',connect=makeButton(plugin.connectLabel??'Connect '+plugin.label,'iui-onboarding-connect',enabled);write(()=>row.append(connect));c.on(connect,'click',event=>gate.run(()=>request(event,connect,'iui:onboarding-plugin',{id:node.id??null,intent:'connect',pluginId:plugin.id,position:ordinal+1},enabled)));}
   write(()=>list.append(row));
  }write(()=>root.append(list));if(!node.plugins?.length)write(()=>root.append(c.element('p','iui-onboarding-empty',node.emptyLabel??'No apps supplied')));
 }else{
  const variant=node.variant??'pills',selection=variant==='selection',tasks=node.tasks??[];write(()=>{root.dataset.variant=variant;root.append(c.element('h3','iui-onboarding-cards-title',node.heading));});
  const list=c.element('div','iui-onboarding-task-list');write(()=>{list.setAttribute('role','group');list.setAttribute('aria-label',node.label);});
  for(const task of tasks){const enabled=()=>task.disabled!==true&&(selection||!task.requiresSitePreview||node.canRequestSitePreview===true),label=variant==='cards'&&node.actionLabel?node.actionLabel+': '+task.label:task.label,button=makeButton(label,'iui-onboarding-task-button',enabled),row=variant==='cards'?c.element('div','iui-onboarding-task'):button,copy=c.element('span','iui-onboarding-item-copy'),title=c.element('span','iui-onboarding-item-title',task.label);write(()=>{button.dataset.taskId=task.id;button.textContent=variant==='cards'?(node.actionLabel??task.label):'';row.dataset.completed=String(task.completed===true);copy.append(title);});if(task.description&&variant==='cards')write(()=>copy.append(c.element('span','iui-onboarding-item-description',task.description)));
   const image=variant==='pills'?undefined:artwork(task,variant==='cards'?(task.imageWidth??72):24,variant==='cards'?56:24);if(image)write(()=>row.append(image));else if(task.symbol){const symbol=c.element('span','iui-onboarding-symbol',task.symbol);write(()=>{symbol.setAttribute('aria-hidden','true');row.append(symbol);});}
   write(()=>row.append(copy));if(variant==='cards')write(()=>row.append(button));if(selection){selectable.push({id:task.id,button});write(()=>button.setAttribute('aria-pressed',String(selected===task.id)));}
   c.on(button,'click',event=>gate.run(()=>request(event,button,'iui:onboarding-task',selection?{id:node.id??null,intent:'select',taskId:task.id}:{id:node.id??null,intent:'submit-prompt',taskId:task.id,prompt:task.prompt!,...(task.starterPromptId?{starterPromptId:task.starterPromptId}:{}),requiresSitePreview:task.requiresSitePreview===true},enabled,selection?task.id:undefined)));write(()=>list.append(row));
  }write(()=>root.append(list));if(!tasks.length)write(()=>root.append(c.element('p','iui-onboarding-empty',node.emptyLabel??'No tasks supplied')));
  if(selection&&tasks.length){const reset=makeButton(node.resetLabel??'Reset selection','iui-onboarding-selection-reset',()=>true);anchors.unshift(reset);write(()=>root.append(reset));c.on(reset,'click',event=>gate.run(()=>{if(write(()=>event.defaultPrevented)||!allowed(reset,()=>true))return;revision++;selected=initial;message='';refresh();}));}
 }
 write(()=>root.append(notice));if(anchors.length)resetPending=readerNativeReset(c,root,[anchors[0]],()=>revision,()=>refresh(),()=>{revision++;selected=initial;message='';refresh();});refresh();return root;
}
