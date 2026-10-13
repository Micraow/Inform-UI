import {renderOfficialIcon} from './official-icons.js';
import type {LedgerTransactionDetailNode,TransactionDetailRelated} from '../schema/document.js';
import type {RendererContext} from './context.js';
import {readerBlocked} from './reader-controls.js';
import {ownedTree} from './owned-tree.js';

export interface TransactionDetailIntent {readonly componentId:string|null;readonly transactionId:string}

/** Independent supplied detail surface. Side effects belong to an explicitly authorized host. */
export function renderTransactionDetail(c:RendererContext,node:LedgerTransactionDetailNode):HTMLElement {
  const root=c.element('section','iui-transaction-detail');
  root.setAttribute('aria-label',node.label);
  root.dataset.mobile=String(node.mobile??false);
  root.dir='auto';
  if(node.status==='pending'){
    root.setAttribute('aria-busy','true');
    const placeholder=c.element('div','iui-transaction-detail-loading');
    placeholder.setAttribute('role','status');placeholder.setAttribute('aria-label',node.label);
    root.append(placeholder);return root;
  }
  if(node.status==='failed'||!node.data){
    if(node.fallback)root.append(c.element('p','iui-transaction-detail-fallback',node.fallback));
    else root.hidden=true;
    return root;
  }
  // Shared resources and permanent composed ownership, without local observers.
  let dispatching=false;
  const life=ownedTree(c,root);
  const usable=(control:HTMLElement)=>life.current()&&!readerBlocked(root,control,true);
  const data=node.data,hidden=node.sensitiveValuesHidden===true,labels=data.labels;
  const element=c.element;
  const text=(cls:string,value:string)=>element('span',cls,value);
  const divider=()=>element('div','iui-transaction-detail-divider');
  const logo=(record:{logo?:{src:string;alt:string}},related=false)=>{
    const box=element('span','iui-transaction-detail-logo');
    box.dataset.related=String(related);
    const fallback=element('span','iui-transaction-detail-logo-fallback');
    fallback.setAttribute('aria-hidden','true');
    // A simple original compass mark; deliberately not branded artwork.
    const svg=renderOfficialIcon(c,'Compass',{size:24});
    fallback.append(svg);box.append(fallback);
    if(record.logo){
      const image=element('img','iui-transaction-detail-image');
      image.alt=record.logo.alt;image.decoding='async';image.referrerPolicy='no-referrer';
      life.listen(image,'error',()=>{
        if(!usable(image)||!box.contains(image))return;
        life.during(()=>{image.hidden=true;});life.during(()=>{fallback.hidden=false;});
      });
      life.listen(image,'load',()=>{
        if(!usable(image)||!box.contains(image))return;
        life.during(()=>{fallback.hidden=true;});
      });
      box.append(image);
      life.acquire(()=>{image.src=record.logo!.src;return image;},owned=>{if(box.contains(owned))owned.removeAttribute('src');});
    }
    return box;
  };
  const header=element('div','iui-transaction-detail-header');
  const heading=element('div','iui-transaction-detail-heading');
  heading.append(logo(data));
  const headingCopy=element('div','iui-transaction-detail-heading-copy');
  headingCopy.append(text('iui-transaction-detail-name',data.name),text('iui-transaction-detail-amount',hidden?data.maskedAmountLabel:data.amountLabel));
  heading.append(headingCopy);header.append(heading);root.append(header);
  const sections=element('div','iui-transaction-detail-sections');
  const details=element('dl','iui-transaction-detail-facts');
  const rows=[['merchant',data.merchant],['date',data.dateLabel],['account',hidden?labels.masked:data.account],['category',data.category]] as const;
  rows.forEach(([key,value],index)=>{
    const row=element('div','iui-transaction-detail-fact');row.dataset.field=key;
    row.append(element('dt','iui-transaction-detail-key',labels[key]),element('dd','iui-transaction-detail-value',value));
    details.append(row);if(index<rows.length-1)details.append(divider());
  });
  if(data.budget){
    details.append(divider());
    const budget=element('div','iui-transaction-detail-budget');
    const values=element('div','iui-transaction-detail-budget-values');
    values.append(text('iui-transaction-detail-key',labels.budget),text('iui-transaction-detail-value',hidden?labels.masked:data.budget.limitLabel));
    const track=element('div','iui-transaction-detail-track');track.setAttribute('role','progressbar');track.setAttribute('aria-label',labels.budget);
    track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax','100');track.setAttribute('aria-valuenow',String(data.budget.progressPct));
    const bar=element('div','iui-transaction-detail-bar');bar.dataset.color=data.budget.color??'default';bar.style.width=data.budget.progressPct+'%';
    track.append(bar);budget.append(values,track);details.append(budget);
  }
  const related=element('section','iui-transaction-detail-related');
  related.setAttribute('aria-label',labels.related);
  related.append(element('h3','iui-transaction-detail-related-title',labels.related));
  const list=element('div','iui-transaction-detail-related-list');
  const emit=(record:TransactionDetailRelated,button:HTMLButtonElement)=>{
    if(dispatching)return;
    dispatching=true;
    try{
      if(node.disabled||record.disabled||!usable(button))return;
      const detail:TransactionDetailIntent=Object.freeze({componentId:node.id??null,transactionId:record.id});
      const Event=life.during(()=>c.doc.defaultView?.CustomEvent);
      const event=Event?life.during(()=>new Event('inform:view-transaction-detail',{detail,bubbles:true,cancelable:true,composed:false})):life.during(()=>c.doc.createEvent('CustomEvent'));
      if(!Event)life.during(()=>event.initCustomEvent('inform:view-transaction-detail',true,true,detail));
      if(!usable(button))return;
      root.dispatchEvent(event);
    }finally{dispatching=false;}
  };
  data.related.forEach((record,index)=>{
    const button=element('button','iui-transaction-detail-related-item');button.type='button';button.disabled=!!(node.disabled||record.disabled);
    button.setAttribute('aria-label',record.actionLabel);button.dataset.transactionId=record.id;
    const row=element('span','iui-transaction-detail-related-row');row.append(logo(record,true));
    const copy=element('span','iui-transaction-detail-related-copy');
    copy.append(text('iui-transaction-detail-related-name',record.name),text('iui-transaction-detail-related-date',record.dateLabel));
    const amount=element('span','iui-transaction-detail-related-amount');
    amount.append(text('iui-transaction-detail-related-value',hidden?record.maskedAmountLabel:record.amountLabel));
    if(record.pending)amount.append(text('iui-transaction-detail-pending',record.pendingLabel!));
    row.append(copy,amount);button.append(row);list.append(button);
    life.listen(button,'click',()=>emit(record,button));
    if(index<data.related.length-1)list.append(divider());
  });
  if(data.related.length===0)list.append(element('p','iui-transaction-detail-empty',labels.empty));
  related.append(list);sections.append(details,related);root.append(sections);
  return root;
}
