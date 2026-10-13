import {renderOfficialIcon} from './official-icons.js';
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
 const warning=renderOfficialIcon(c,'TriangleExclamationErrorWarning',{size:20});write(()=>icon.append(warning));
 const copy=c.element('div','iui-finance-status-copy'),title=c.element('h3','iui-finance-status-title',data.title),description=c.element('p','iui-finance-status-description',data.description);
 write(()=>copy.append(title,description));write(()=>row.append(icon,copy));write(()=>card.append(row));write(()=>root.append(card));return root;
}
