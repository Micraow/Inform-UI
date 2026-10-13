import {renderOfficialIcon} from './official-icons.js';
import {suppliedReaderContext} from './supplied-reader-lifecycle.js';
import type{LedgerIncomeTrackerNode}from'../schema/document.js';import type{RendererContext}from'./context.js';import{renderSearchImage}from'./search-image.js';

/** A supplied income snapshot. Labels are never interpreted as money, dates or account operations. */
export function renderIncomeTracker(c:RendererContext,n:LedgerIncomeTrackerNode,renderOwner:HTMLElement,host:HTMLElement):HTMLElement{
 const root=c.element('section','iui-income-tracker');c=suppliedReaderContext(c,root);const e=c.element,zh=c.labels().temperature==='温度',words=zh?{estimate:'估计月收入',next:'下一笔工资',recurring:'经常性收入',noNext:'未找到下一笔工资。',date:'日期未提供',empty:'此快照未提供经常性收入。',source:'来源'}:{estimate:'Estimated monthly income',next:'Next paycheck',recurring:'Recurring income',noNext:'No upcoming paycheck found.',date:'Date unavailable',empty:'No recurring income supplied in this snapshot.',source:'Source'};
 const header=e('div','iui-income-header'),heading=e('div','iui-income-heading'),title=e('h2','iui-income-title',n.label),badge=e('div','iui-income-badge'),rule=e('div','iui-income-rule');title.id=c.allocateInternalId?.('income')??`${c.prefix}-income`;root.setAttribute('aria-labelledby',title.id);root.dir='auto';heading.append(title);if(n.subtitle!==undefined)heading.append(e('p','iui-income-subtitle',n.subtitle));badge.append(glyph('banknote'));header.append(heading,badge);rule.append(e('hr'));root.append(header,rule);
 const masked=n.maskedLabel??'••••';
 if(n.hasIncome){const body=e('div','iui-income-body'),estimate=e('div','iui-income-estimate'),amount=e('strong','iui-income-estimate-value',n.masked?masked:n.estimatedMonthlyIncomeLabel),next=e('div','iui-income-next'),sources=e('div','iui-income-sources');estimate.append(e('p','iui-income-label',n.estimatedLabel??words.estimate),amount);next.append(e('p','iui-income-label',n.nextPaycheckLabel??words.next));
  const paycheck=n.nextPaycheck;if(paycheck){const row=e('div','iui-income-paycheck'),avatar=e('div','iui-income-avatar'),details=e('div','iui-income-details'),name=e('p','iui-income-paycheck-name',paycheck.name??n.recurringIncomeLabel??words.recurring),meta=[paycheck.nextPayment??n.dateUnavailableLabel??words.date,paycheck.frequency,paycheck.accountDetail].filter(Boolean).join(' · '),payment=e('span','iui-income-paycheck-amount',paycheck.amountLabel==null?'':n.masked?masked:paycheck.amountLabel);avatar.setAttribute('aria-hidden','true');avatar.append(glyph(paycheck.icon??'banknote'));
   if(paycheck.logoUrl){const imageContext=c;const image=renderSearchImage(imageContext,{type:'search-image',searchImage:{content_url:paycheck.logoUrl},width:32,height:32,fit:'contain',hideOnFailure:true},renderOwner,host);avatar.append(image);}
   details.append(name,e('p','iui-income-paycheck-meta',meta));row.append(avatar,details,payment);next.append(row);
  }else next.append(e('p','iui-income-label',n.noUpcomingLabel??words.noNext));
  sources.append(e('p','iui-income-label',n.recurringIncomeLabel??words.recurring),e('p','iui-income-sources-value',n.incomeSourcesLabel));body.append(estimate,next,e('hr'),sources);root.append(body);
 }else{const empty=e('div','iui-income-empty'),icon=e('div','iui-income-badge');icon.append(glyph('calendar'));empty.append(icon,e('p','iui-income-label',n.emptyLabel??words.empty));root.append(empty);}
 if(n.source){const footer=e('div','iui-income-footer'),link=e('a',undefined,`${words.source}: ${n.source.label}`);link.href=n.source.url;link.target='_blank';link.rel='noopener noreferrer';link.referrerPolicy='no-referrer';footer.append(link);root.append(footer);}
 function glyph(name:string){const names:Record<string,any>={'banknote':'DollarCircle','bank':'BuildingWorkspace','briefcase':'SuitcaseWorkBusiness','calendar':'Calendar'};return renderOfficialIcon(c,names[name]??'InfoCircle',{className:'iui-income-icon',size:24});}

 return root;
}
