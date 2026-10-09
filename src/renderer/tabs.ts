import type {RendererContext} from './context.js';
import type {TabGroupNode} from '../schema/document.js';
import {logicalOffset, physicalOffset} from './source-geometry.js';
import type {RTLScrollModel} from './source-geometry.js';
let serial = 0;
/** Local automatic-activation tabs; all child state and DOM remains mounted. */
export function renderTabs(c:RendererContext,n:TabGroupNode):HTMLElement {
  const out=c.element('div','iui-tab-group'),list=c.element('div','iui-tab-list');
  list.setAttribute('role','tablist');list.setAttribute('aria-label',n.label);list.setAttribute('aria-orientation','horizontal');out.append(list);
  const base=`iui-tabs-internal-${c.prefix}${++serial}`,enabled=n.children.flatMap((child,i)=>child.disabled?[]:[i]);
  if(!enabled.length)throw new Error('Tabs require an enabled panel.');
  let selected=n.initial===undefined?enabled[0]:n.children.findIndex(child=>child.id===n.initial&&!child.disabled),disposed=false,initialRevealed=false;
  if(selected<0)throw new Error('Initial tab must be enabled.');
  const buttons=n.children.map((child,i)=>{const button=c.element('button','iui-tab',child.label);button.type='button';button.disabled=!!child.disabled;button.id=`${base}-tab-${i}`;button.setAttribute('role','tab');list.append(button);return button;});
  const panels=n.children.map((child,i)=>{const panel=c.render(child) as HTMLElement;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',buttons[i].id);panel.tabIndex=0;buttons[i].setAttribute('aria-controls',panel.id);out.append(panel);return panel;});
  const rtl=()=>c.doc.defaultView?.getComputedStyle(list).direction==='rtl';
  const model=():RTLScrollModel=>{
    const before=list.scrollLeft;if(before<0)return 'negative';list.scrollLeft=-1;const negative=list.scrollLeft<0;list.scrollLeft=before;if(negative)return 'negative';
    list.scrollLeft=0;const zero=buttons[0].getBoundingClientRect().right;list.scrollLeft=1;const one=buttons[0].getBoundingClientRect().right;list.scrollLeft=before;return one<zero?'default':'reverse';
  };
  const reveal=()=>{
    if(disposed||!list.clientWidth)return;const max=Math.max(0,list.scrollWidth-list.clientWidth);if(!max)return;
    const rect=list.getBoundingClientRect(),button=buttons[selected].getBoundingClientRect(),scale=list.offsetWidth?rect.width/list.offsetWidth:1;if(!(scale>0))return;
    const left=rect.left+list.clientLeft*scale,right=left+list.clientWidth*scale;
    const delta=button.left<left?button.left-left:button.right>right?button.right-right:0;if(!delta)return;
    const isRTL=rtl(),scrollModel=isRTL?model():'negative';
    list.scrollLeft=physicalOffset(logicalOffset(list.scrollLeft,max,isRTL,scrollModel)+(isRTL?-delta:delta)/scale,max,isRTL,scrollModel);
  };
  const paint=()=>{buttons.forEach((button,i)=>{button.tabIndex=i===selected?0:-1;button.setAttribute('aria-selected',String(i===selected));panels[i].hidden=i!==selected;});out.dataset.active=n.children[selected].id;};
  const select=(index:number)=>{if(disposed||!enabled.includes(index))return;selected=index;paint();buttons[index].focus({preventScroll:true});reveal();};
  buttons.forEach((button,index)=>{
    c.on(button,'click',()=>select(index));
    c.on(button,'keydown',(event:Event)=>{const key=event as KeyboardEvent;if(disposed||button.disabled||key.altKey||key.ctrlKey||key.metaKey||key.shiftKey)return;
      const at=enabled.indexOf(index);let next:number|undefined;
      if(key.key==='Home')next=enabled[0];else if(key.key==='End')next=enabled.at(-1);
      else if(key.key==='ArrowLeft'||key.key==='ArrowRight'){const delta=(key.key==='ArrowRight'?1:-1)*(rtl()?-1:1);next=enabled[(at+delta+enabled.length)%enabled.length];}
      if(next!==undefined){key.preventDefault();select(next);}
    });
  });
  const initialReveal=()=>{if(!disposed&&!initialRevealed&&out.isConnected&&list.clientWidth>0){initialRevealed=true;reveal();}};
  c.bind(initialReveal);
  const Observer=c.doc.defaultView?.ResizeObserver;
  const observer=Observer?new Observer(initialReveal):undefined;observer?.observe(list);
  c.cleanup(()=>{disposed=true;observer?.disconnect();});paint();return out;
}
