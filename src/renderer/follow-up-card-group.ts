import type {FollowUpCardGroupNode,FollowUpCardIntent} from '../schema/document.js';
import type {RendererContext} from './context.js';
import {readerBlocked} from './reader-controls.js';
import {ownedTree} from './owned-tree.js';
import {intentGate} from './intent-gate.js';
export interface FollowUpCardDetail {
  readonly componentId:string|null;
  readonly itemId:string;
  readonly intent:Readonly<FollowUpCardIntent>;
}
/** Local cancelable intent events. No navigation, telemetry, chat or network requests. */
export function renderFollowUpCardGroup(c:RendererContext,node:FollowUpCardGroupNode):HTMLElement {
  let alive=true;
  const e=c.element,root=e('section','iui-follow-up-card-group');
  const scope=ownedTree(c,root),gate=intentGate(scope);
  scope.own(()=>{alive=false;});
  const write=scope.during;
  write(()=>root.setAttribute('aria-label',node.label));write(()=>{root.dir='auto';});
  if(node.status==='loading'){
    const loading=e('div','iui-follow-up-card-loading',node.message??'');
    write(()=>root.setAttribute('aria-busy','true'));write(()=>loading.setAttribute('role','status'));write(()=>root.append(loading));return root;
  }
  if(node.status==='error'){if(node.message){const message=e('p','iui-follow-up-card-fallback',node.message);write(()=>root.append(message));}return root;}
  for(const item of node.items){
    const button=e('button','iui-follow-up-card');write(()=>{button.type='button';});write(()=>{button.disabled=item.disabled??false;});
    write(()=>{button.dataset.followUpId=item.id;});write(()=>button.setAttribute('aria-label',item.label));
    if(item.iconData){
      const image=e('img','iui-follow-up-card-icon');write(()=>{image.alt='';});write(()=>{image.width=36;});write(()=>{image.height=36;});
      write(()=>{image.decoding='async';});write(()=>{image.referrerPolicy='no-referrer';});
      scope.listen(image,'error',()=>{if(scope.current()&&root.contains(image))write(()=>{image.hidden=true;});});
      const slot=e('span','iui-follow-up-card-icon-slot');
      write(()=>slot.append(image));scope.acquire(()=>{image.src=item.iconData!;return image;},value=>{if(slot.contains(value))value.removeAttribute('src');});write(()=>button.append(slot));
    }else if(item.emoji){const icon=e('span','iui-follow-up-card-emoji',item.emoji);write(()=>icon.setAttribute('aria-hidden','true'));write(()=>button.append(icon));}
    const copy=e('span','iui-follow-up-card-copy'),label=e('span','iui-follow-up-card-label',item.label);write(()=>copy.append(label));
    if(item.description){const description=e('span','iui-follow-up-card-description',item.description);write(()=>copy.append(description));}
    write(()=>button.append(copy));write(()=>root.append(button));
    scope.listen(button,'click',()=>gate.run(()=>{
      if(readerBlocked(root,button,alive))return;
      const intent=Object.freeze({...item.intent});
      const detail:FollowUpCardDetail=Object.freeze({componentId:node.id??null,itemId:item.id,intent});
      const event=scope.during(()=>{
        const Event=c.doc.defaultView?.CustomEvent;
        if(Event)return new Event('iui:follow-up-card',{detail,bubbles:true,cancelable:true,composed:false});
        const fallback=scope.during(()=>c.doc.createEvent('CustomEvent'));
        scope.during(()=>fallback.initCustomEvent('iui:follow-up-card',true,true,detail));return fallback;
      });
      if(readerBlocked(root,button,alive))return;
      const dispatch=scope.during(()=>root.dispatchEvent);
      scope.during(()=>dispatch.call(root,event));
      // No post-dispatch paint: cancellation/replacement/disposal cannot mutate stale UI.
    }));
  }
  return root;
}
