import {officialSymbol} from './official-symbol.js';
import type {AskUserLocationNode,AskLocationDetail} from '../core/ask-location.js';
import type {RendererContext} from './context.js';
import {suppliedReaderContext,suppliedReaderPainter} from './supplied-reader-lifecycle.js';
import {readerBlocked,readerNativeReset} from './reader-controls.js';
import {intentGate} from './intent-gate.js';
/** Local supplied request card. Does not call browser permissions or geolocation. */
export function renderAskLocation(parent:RendererContext,node:AskUserLocationNode,options:{gate?:ReturnType<typeof intentGate>}={}):HTMLElement {
 const root=parent.element('section','iui-ask-location'),c=suppliedReaderContext(parent,root),life=c.lifecycle,write=life.during,paint=suppliedReaderPainter(c),gate=options.gate??intentGate(life),e=c.element;
 write(()=>{root.setAttribute('role','group');root.setAttribute('aria-label',node.label);root.dir='auto';root.dataset.phase=node.status??'resolved';});
 if(node.status==='pending'){const loading=e('p','iui-ask-location-loading',node.fallback??'Waiting for supplied location request');write(()=>{loading.setAttribute('role','status');root.setAttribute('aria-busy','true');root.append(loading);});return root;}
 if(node.status==='failed'){if(node.fallback)write(()=>root.append(e('p','',node.fallback)));else write(()=>{root.hidden=true;});return root;}
 const panel=e('div','iui-ask-location-panel'),copy=e('div','iui-ask-location-copy'),icon=officialSymbol(c,'iui-ask-location-icon','MapPin'),text=e('div','iui-ask-location-text'),title=e('h3','',node.title??''),description=e('p','',node.description??''),learn=e('button','iui-ask-location-learn',node.learnMoreLabel??''),actions=e('div','iui-ask-location-actions'),decline=e('button','iui-ask-location-decline',node.notNowLabel??''),request=e('button','iui-ask-location-request',node.turnOnLabel??''),reset=e('button','iui-ask-location-reset',node.resetLabel??'Reset location request'),notice=e('p','iui-ask-location-notice');
 write(()=>{icon.setAttribute('aria-hidden','true');notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');for(const[b,action]of[[learn,'learn-more'],[decline,'dismiss'],[request,'request-location-permission'],[reset,'reset']]as const){b.type='button';b.dataset.locationAction=action;b.disabled=node.disabled===true;}description.append(c.doc.createTextNode(' '),learn);text.append(title,description);copy.append(icon,text);actions.append(decline,request);panel.append(copy,actions);root.append(panel,reset,notice);});
 let dismissed=node.dismissed===true,revision=0,message='',pending=()=>false;
 const refresh=()=>paint(scope=>{scope.during(()=>{panel.hidden=dismissed;});scope.during(()=>{root.dataset.dismissed=String(dismissed);});scope.during(()=>{notice.textContent=message;});});
 const ready=(button:HTMLButtonElement)=>write(()=>node.disabled!==true&&!readerBlocked(root,button,life.current()));
 for(const[button,intent]of[[learn,'learn-more'],[decline,'dismiss'],[request,'request-location-permission']]as const)c.on(button,'click',event=>gate.run(()=>{
  const before=revision;if(write(()=>event.defaultPrevented)||dismissed||pending()||!ready(button))return;
  const Constructor=write(()=>c.doc.defaultView?.CustomEvent);if(!Constructor)return;
  const detail:AskLocationDetail=Object.freeze({id:node.id??null,intent,...(intent==='learn-more'?{url:node.learnMoreUrl}: {})});
  const emitted=write(()=>new Constructor('inform:view-ask-location',{detail,bubbles:true,cancelable:true,composed:false}));
  if(before!==revision||dismissed||pending()||!ready(button))return;
  const accepted=write(()=>root.dispatchEvent(emitted));if(before!==revision||dismissed||pending()||!ready(button))return;
  revision++;if(accepted&&intent==='dismiss')dismissed=true;
  message=accepted?(node.requestedLabel??'Local request accepted'):(node.cancelledLabel??'Local request cancelled');refresh();
 }));
 const clear=()=>{revision++;dismissed=node.dismissed===true;message='';refresh();};
 c.on(reset,'click',event=>gate.run(()=>{if(write(()=>event.defaultPrevented)||!ready(reset))return;clear();}));
 pending=readerNativeReset(c,root,[reset],()=>revision,refresh,clear);refresh();return root;
}
