import {suppliedReaderContext} from './supplied-reader-lifecycle.js';
import {intentGate} from './intent-gate.js';
import type {LedgerLowConfidenceCategoryCorrectionNode} from '../schema/document.js';
import type {RendererContext} from './context.js';
import {readerBlocked,readerNativeReset} from './reader-controls.js';
import {correctionEnglish,correctionChinese} from './category-correction-labels.js';
export interface CategoryCorrectionChange {readonly transactionId:string;readonly fromCategoryId:string|null;readonly toCategoryId:string}
export interface CategoryCorrectionDetail {readonly componentId:string|null;readonly snapshotId:string;readonly changes:readonly CategoryCorrectionChange[]}

/** Original, bounded local review workflow. This component has no persistence or financial adapter. */
export function renderCategoryCorrection(c:RendererContext,node:LedgerLowConfidenceCategoryCorrectionNode):HTMLElement {
  const root=c.element('section','iui-category-correction');c=suppliedReaderContext(c,root);const intent=intentGate(c.lifecycle),e=c.element,zh=c.labels().temperature==='温度',t=zh?correctionChinese:correctionEnglish;
  const base=c.allocateInternalId?.('category-correction')??`${c.prefix}-category-correction`,title=e('h2','',node.label);
  title.id=base+'-title';root.dir='auto';root.setAttribute('aria-labelledby',title.id);root.append(title,e('p','iui-correction-note',t.note),e('p','iui-correction-note',t.snapshot+': '+node.snapshotId));
  if(node.description!==undefined)root.append(e('p','iui-correction-text',node.description));
  const list=e('ol','iui-correction-transactions'),count=e('p','iui-correction-count'),actions=e('div','iui-correction-actions'),review=e('button','iui-correction-review',t.review),reset=e('button','iui-correction-reset',t.reset),panel=e('section','iui-correction-panel'),panelTitle=e('h3','',t.reviewTitle),preview=e('ol','iui-correction-preview'),empty=e('p','iui-correction-empty',t.none),panelActions=e('div','iui-correction-actions'),cancel=e('button','iui-correction-cancel',t.cancel),confirm=e('button','iui-correction-confirm',t.confirm),status=e('p','iui-correction-status');
  for(const button of[review,reset,cancel,confirm]){button.type='button';button.disabled=Boolean(node.disabled);}actions.append(review,reset);panelActions.append(cancel,confirm);panelTitle.id=base+'-review-title';panel.setAttribute('aria-labelledby',panelTitle.id);panel.append(panelTitle,preview,empty,panelActions);panel.hidden=true;status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');status.id=base+'-status';confirm.setAttribute('aria-describedby',status.id);root.append(list,count,actions,panel,status);
  const categories=new Map(node.categories.map(category=>[category.id,category.label]));
  const values=new Map<string,string>(),choiceByValue=new Map(node.categories.map((category,i)=>['c'+i,category.id]));
  const views=node.transactions.map((transaction,i)=>{
    const row=e('li','iui-correction-transaction'),heading=e('h3','',transaction.label),facts=e('dl','iui-correction-facts'),controls=e('div','iui-correction-controls'),label=e('label','',t.choose),select=e('select'),undo=e('button','iui-correction-undo',t.undo);
    row.dataset.transactionId=transaction.id;heading.id=base+'-transaction-'+i;row.setAttribute('aria-labelledby',heading.id);
    const fact=(label:string,value:string)=>{const group=e('div');group.append(e('dt','',label),e('dd','',value));facts.append(group);};
    fact(t.original,transaction.originalCategoryId===null?t.unknown:categories.get(transaction.originalCategoryId)!);fact(t.suggested,transaction.suggestedCategoryId===null?t.unknown:categories.get(transaction.suggestedCategoryId)!);fact(t.confidence,transaction.confidence===null?t.unknown:String(transaction.confidence));
    const at=e('p','iui-correction-date',t.date+': ');if(transaction.date===null)at.append(c.doc.createTextNode(t.unknown));else{const time=e('time','',transaction.date);time.dateTime=transaction.date;at.append(time);}
    const money=e('p','iui-correction-money',`${transaction.money.amount??t.unknown} ${transaction.money.currency}`);money.dir='ltr';row.append(heading,money,at,facts);if(transaction.note!==undefined)row.append(e('p','iui-correction-text',transaction.note));
    label.htmlFor=select.id=base+'-select-'+i;select.setAttribute('aria-describedby',heading.id);const keep=e('option','',t.keep);keep.value='';keep.defaultSelected=true;select.append(keep);for(const[value,id]of choiceByValue){const option=e('option','',categories.get(id));option.value=value;select.append(option);}select.disabled=Boolean(node.disabled)||!node.categories.length;undo.type='button';undo.disabled=Boolean(node.disabled);controls.append(label,select,undo);row.append(controls);list.append(row);
    const reviewRow=e('li','iui-correction-preview-row'),name=e('strong','',transaction.label),from=e('span','',t.original+': '+(transaction.originalCategoryId===null?t.unknown:categories.get(transaction.originalCategoryId)!)),to=e('span','iui-correction-new-category');reviewRow.dataset.transactionId=transaction.id;reviewRow.append(name,from,to);preview.append(reviewRow);
    return{transaction,row,controls,select,undo,reviewRow,name,from,to};
  });
  if(!views.length)root.insertBefore(e('p','',t.empty),list);if(!node.categories.length)root.insertBefore(e('p','',t.noCategories),list);
  if(node.source){const p=e('p','iui-correction-source',t.source+': '),link=e('a','',`${node.source.label} (${t.newTab})`);link.href=node.source.url;link.target='_blank';link.rel='noopener noreferrer';link.referrerPolicy='no-referrer';p.append(link);root.append(p);}
  let alive=true,initialized=false,revision=0,presentation=0,reviewedRevision=-1,confirmedRevision=-1;
  let resetPending=()=>false;
  type View=typeof views[number];
  const rowOwned=(view:View)=>list.parentElement===root&&view.row.parentElement===list&&view.controls.parentElement===view.row;
  const fieldOwned=(view:View,field:HTMLElement)=>rowOwned(view)&&field.parentElement===view.controls;
  const actionOwned=(button:HTMLElement)=>button.parentElement===actions&&actions.parentElement===root;
  const panelOwned=()=>panel.parentElement===root&&preview.parentElement===panel&&panelActions.parentElement===panel;
  const panelButtonOwned=(button:HTMLElement)=>panelOwned()&&button.parentElement===panelActions;
  const previewOwned=(view:View)=>panelOwned()&&view.reviewRow.parentElement===preview;
  const changes=():CategoryCorrectionChange[]=>views.flatMap(view=>{const category=values.get(view.transaction.id);return category===undefined?[]:[{transactionId:view.transaction.id,fromCategoryId:view.transaction.originalCategoryId,toCategoryId:category}];});
  const say=(text:string,at=revision)=>{if(alive&&root.isConnected&&revision===at&&status.parentElement===root)status.textContent=text;};
  const restore=()=>{const at=revision,shown=presentation;for(const view of views){if(!alive||revision!==at||presentation!==shown||(initialized&&!root.isConnected))return;if(fieldOwned(view,view.select)){const id=values.get(view.transaction.id),value=id===undefined?'':[...choiceByValue].find(([,category])=>category===id)![0];view.select.value=value;}}};
  const paint=()=>{
    const at=revision,shown=presentation,current=()=>alive&&revision===at&&presentation===shown&&(!initialized||root.isConnected);if(!current())return;restore();if(!current())return;
    for(const view of views){if(!current())return;const category=values.get(view.transaction.id);
      if(fieldOwned(view,view.undo))view.undo.setAttribute('aria-disabled',String(category===undefined));if(!current())return;
      if(previewOwned(view)){view.reviewRow.hidden=category===undefined;if(!current())return;if(previewOwned(view)&&view.to.parentElement===view.reviewRow)view.to.textContent=category===undefined?'':t.newCategory+': '+categories.get(category);}
    }
    if(!current())return;if(count.parentElement===root)count.textContent=t.count(values.size);if(!current())return;
    if(panelOwned()&&empty.parentElement===panel)empty.hidden=values.size>0;if(!current())return;
    for(const button of[review,reset]){if(!current())return;if(actionOwned(button))button.setAttribute('aria-disabled',String(!values.size));}
    if(current()&&panelButtonOwned(confirm))confirm.setAttribute('aria-disabled',String(!values.size||reviewedRevision!==revision||confirmedRevision===revision));
  };
  const draftChanged=()=>{const at=++revision,shown=++presentation;reviewedRevision=-1;paint();if(presentation===shown)say(values.size?t.changed:t.none,at);};
  for(const view of views){
    c.on(view.select,'change',()=>{if(!alive)return;const value=view.select.value;if(!fieldOwned(view,view.select)||readerBlocked(root,view.select,alive)||view.select.selectedIndex<0||(value!==''&&!choiceByValue.has(value))){restore();return;}const category=choiceByValue.get(value),next=category===view.transaction.originalCategoryId?undefined:category;if(values.get(view.transaction.id)===next){restore();return;}if(next===undefined)values.delete(view.transaction.id);else values.set(view.transaction.id,next);draftChanged();});
    c.on(view.undo,'click',()=>{if(!fieldOwned(view,view.undo)||!fieldOwned(view,view.select)||readerBlocked(root,view.undo,alive)||readerBlocked(root,view.select,alive)||!values.has(view.transaction.id))return;values.delete(view.transaction.id);draftChanged();});
  }
  const allFieldsOwned=()=>views.every(view=>fieldOwned(view,view.select));
  const clear=()=>{if(!allFieldsOwned()||!values.size){restore();return;}values.clear();draftChanged();};
  c.on(reset,'click',()=>{if(!actionOwned(reset)||readerBlocked(root,reset,alive)||views.some(view=>!fieldOwned(view,view.select)||readerBlocked(root,view.select,alive)))return;clear();});
  c.on(review,'click',()=>{if(resetPending()||!actionOwned(review)||!panelOwned()||readerBlocked(root,review,alive)||!values.size||!allFieldsOwned())return;const at=revision,shown=++presentation;reviewedRevision=at;panel.hidden=false;if(!alive||revision!==at||presentation!==shown||reviewedRevision!==at||!panelOwned())return;paint();if(!alive||revision!==at||presentation!==shown||reviewedRevision!==at||panel.hidden||!panelOwned()||resetPending())return;say(confirmedRevision===at?t.confirmed:t.ready,at);});
  c.on(cancel,'click',()=>{if(!panelButtonOwned(cancel)||readerBlocked(root,cancel,alive))return;const at=revision,shown=++presentation;reviewedRevision=-1;panel.hidden=true;if(!alive||revision!==at||presentation!==shown||reviewedRevision!==-1||!panelOwned())return;say(t.closed,at);if(actionOwned(review)&&!readerBlocked(root,review,alive))review.focus();});
  c.on(confirm,'click',()=>intent.run(()=>{
    const at=revision,shown=presentation;
    const currentContext=()=>alive&&!resetPending()&&revision===at&&presentation===shown&&reviewedRevision===at&&values.size>0&&panelButtonOwned(confirm)&&!readerBlocked(root,confirm,alive)&&allFieldsOwned()&&views.filter(view=>values.has(view.transaction.id)).every(view=>!readerBlocked(root,view.select,alive)&&previewOwned(view)&&!readerBlocked(root,view.reviewRow,alive)&&[view.name,view.from,view.to].every(field=>field.parentElement===view.reviewRow&&!readerBlocked(root,field,alive)));
    const permitted=()=>currentContext()&&confirmedRevision!==at;
    if(confirmedRevision===at){if(currentContext()){paint();if(currentContext())say(t.confirmed,at);}return;}
    if(!permitted())return;
    try{
      const payload:CategoryCorrectionDetail=Object.freeze({componentId:node.id??null,snapshotId:node.snapshotId,changes:Object.freeze(changes().map(change=>Object.freeze(change)))});
      const Event=c.doc.defaultView?.CustomEvent;if(!permitted())return;let event:CustomEvent<CategoryCorrectionDetail>;
      if(typeof Event==='function')event=new Event('inform:view-ledger-category-correction',{detail:payload,bubbles:true,cancelable:true,composed:false});else{event=c.doc.createEvent('CustomEvent');event.initCustomEvent('inform:view-ledger-category-correction',true,true,payload);}
      if(!permitted())return;const dispatch=root.dispatchEvent;if(!permitted())return;const accepted=dispatch.call(root,event);
      // Acceptance is a receipt even if the host moves the controls before this call returns.
      if(accepted)confirmedRevision=at;if(!currentContext())return;
      if(accepted){paint();if(currentContext())say(t.confirmed,at);}else say(t.cancelled,at);
    }catch{if(permitted())say(t.failed,at);}
  }));
  resetPending=readerNativeReset(c,root,views.map(view=>view.select),()=>revision,restore,clear);c.cleanup(()=>{alive=false;});paint();initialized=true;return root;
}
