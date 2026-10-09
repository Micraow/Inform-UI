import type {RatingNode} from '../schema/document.js';
import type {RendererContext} from './context.js';
import type {RatingLabels} from './rating-labels.js';
let serial = 0;
/** Bounded shared-state radio rating. Native keyboard behavior stays native. */
export function renderRating(c: RendererContext, n: RatingNode, labels: RatingLabels): HTMLElement {
  const out=c.element('fieldset','iui-rating'),legend=c.element('legend','iui-rating-label',n.label);
  const row=c.element('div','iui-rating-options'),output=c.element('output','iui-rating-output');
  const feedback=c.element('p','iui-rating-feedback');
  const id=`iui-rating-internal-${c.prefix}${++serial}`,max=n.max??5;
  let localError='',last:number|undefined,alive=true;
  output.id=`${id}-output`;output.setAttribute('aria-live','polite');output.setAttribute('aria-atomic','true');
  feedback.id=`${id}-feedback`;feedback.setAttribute('role','status');feedback.setAttribute('aria-atomic','true');
  const description=[output.id,feedback.id];out.append(legend);
  if(n.hint){const hint=c.element('p','iui-caption iui-rating-hint',n.hint);hint.id=`${id}-hint`;description.unshift(hint.id);out.append(hint);}
  out.setAttribute('aria-describedby',description.join(' '));
  const inputs=Array.from({length:max},(_,index)=>{
    const value=index+1,label=c.element('label','iui-rating-choice'),input=c.element('input');
    input.type='radio';input.name=id;input.id=`${id}-${value}`;input.value=String(value);input.dataset.bind=n.bind;
    input.setAttribute('aria-label',labels.choice(value,max));input.setAttribute('aria-describedby',description.join(' '));
    const star=c.element('span','iui-rating-star','★');star.setAttribute('aria-hidden','true');
    const number=c.element('span','iui-rating-number',value);number.setAttribute('aria-hidden','true');
    label.htmlFor=input.id;label.append(input,star,number);row.append(label);
    c.on(input,'change',()=>{
      if(!alive)return;
      if(input.matches(':disabled')||!input.checked){paint();return;}
      apply(value);
    });
    return input;
  });
  out.append(row,output);
  const clear=n.clearable===false?undefined:c.element('button','iui-rating-clear',labels.clear);
  if(clear){clear.type='button';clear.setAttribute('aria-describedby',output.id);c.on(clear,'click',()=>{
    if(!alive)return;
    if(clear.matches(':disabled')||c.getState()[n.bind]===0){paint();return;}
    apply(0);
  });out.append(clear);}
  out.append(feedback);
  function apply(value:number){
    localError='';
    if(c.getState()[n.bind]===value){paint();return;}
    try{c.change({[n.bind]:value});}
    catch{localError=labels.rejected;}
    paint();
  }
  function paint(){
    if(!alive)return;
    const current=c.getState()[n.bind] as number;
    if(current!==last)localError='';last=current;
    out.disabled=n.disabled!==undefined&&c.value(n.disabled)===true;
    out.dataset.value=String(current);
    inputs.forEach((input,index)=>{
      input.checked=current===index+1;
      input.parentElement!.dataset.filled=String(index<current);
    });
    const summary=current===0?labels.unrated:labels.choice(current,max);
    if(output.value!==summary)output.value=summary;
    if(clear)clear.setAttribute('aria-disabled',String(current===0||clear.matches(':disabled')));
    const message=out.matches(':disabled')?'':localError;
    if(feedback.textContent!==message)feedback.textContent=message;
    feedback.hidden=!message;
  }
  c.cleanup(()=>{alive=false;});c.bind(paint);return out;
}
