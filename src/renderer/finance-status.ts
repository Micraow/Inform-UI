import type {LedgerFinanceStatusBannerNode} from '../schema/document.js';
import type {RendererContext} from './context.js';
/** A read-only supplied banner. Generation checks are shared; there is no private resource registry. */
export function renderFinanceStatus(c:RendererContext,node:LedgerFinanceStatusBannerNode):HTMLElement{
 const write=c.lifecycle.during,root=c.element('section','iui-finance-status');
 write(()=>root.setAttribute('aria-label',node.label));write(()=>{root.dir='auto';});
 if(node.status==='pending'){
  write(()=>root.setAttribute('aria-busy','true'));
  const loading=c.element('div','iui-finance-status-loading');
  write(()=>loading.setAttribute('role','status'));write(()=>loading.setAttribute('aria-label',node.label));
  write(()=>root.append(loading));return root;
 }
 const data='data' in node?node.data:undefined;
 if(node.status==='failed'||!data){
  if(node.fallback){const fallback=c.element('p','iui-finance-status-fallback',node.fallback);write(()=>root.append(fallback));}
  else write(()=>{root.hidden=true;});
  return root;
 }
 const card=c.element('div','iui-finance-status-card'),row=c.element('div','iui-finance-status-row');
 const icon=c.element('span','iui-finance-status-icon');write(()=>icon.setAttribute('aria-hidden','true'));
 // Original geometric warning mark; it conveys no independent account assessment.
 const warning=c.svg('svg',{viewBox:'0 0 24 24',width:20,height:20,fill:'none','aria-hidden':'true',focusable:'false'});
 const outline=c.svg('path',{d:'M10.3 3.7a2 2 0 0 1 3.4 0l8 14a2 2 0 0 1-1.7 3H4a2 2 0 0 1-1.7-3Z',stroke:'currentColor','stroke-width':1.8,'stroke-linejoin':'round'});
 const stem=c.svg('path',{d:'M12 8v5',stroke:'currentColor','stroke-width':1.8,'stroke-linecap':'round'}),dot=c.svg('circle',{cx:12,cy:16.5,r:1,fill:'currentColor'});
 write(()=>warning.append(outline,stem,dot));write(()=>icon.append(warning));
 const copy=c.element('div','iui-finance-status-copy'),title=c.element('h3','iui-finance-status-title',data.title),description=c.element('p','iui-finance-status-description',data.description);
 write(()=>copy.append(title,description));write(()=>row.append(icon,copy));write(()=>card.append(row));write(()=>root.append(card));return root;
}
