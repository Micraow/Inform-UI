import type {DisplayAutomationNode,ListAutomationsNode,AutomationPlanSummaryNode} from '../schema/document.js';
import type {Issue} from './index.js';
export type AutomationNode=DisplayAutomationNode|ListAutomationsNode|AutomationPlanSummaryNode;
export type AutomationItem=NonNullable<DisplayAutomationNode['item']>;
export function inspectAutomation(node:AutomationNode,path:string,add:(issue:Issue)=>void,safe:(url:string)=>boolean):void {
 const issue=(at:string,message:string)=>add({code:'AUTOMATION_DATA',path:path+at,message});
 const nonblank=(value:unknown,at:string)=>{if(typeof value==='string'&&!value.trim())issue(at,'Supply nonblank text.');};
 for(const [key,value]of Object.entries(node))if(typeof value==='string')nonblank(value,'/'+key);
 const items=node.type==='display-automation'&&node.item?[node.item]:node.type==='list-automations'?node.items??[]:[];
 const ids=new Set<string>();items.forEach((item,index)=>{const at=node.type==='display-automation'?'/item':'/items/'+index;if(ids.has(item.id))issue(at+'/id','Automation IDs must be unique.');ids.add(item.id);for(const[key,value]of Object.entries(item))nonblank(value,at+'/'+key);if(!safe(item.url))issue(at+'/url','Supply an allowed URL.');});
 if(node.type==='list-automations'&&node.viewAll){nonblank(node.viewAll.label,'/viewAll/label');if(!safe(node.viewAll.url))issue('/viewAll/url','Supply an allowed URL.');}
 if(node.type==='automation-plan-summary'){
  if(node.steps===null&&!node.summaryErrorLabel)issue('/summaryErrorLabel','Unavailable steps require an error label.');
  const seen=new Set<string>();node.steps?.forEach((step,index)=>{if(seen.has(step.id))issue('/steps/'+index+'/id','Step IDs must be unique.');seen.add(step.id);nonblank(step.title,'/steps/'+index+'/title');});
  for(const[key,value]of Object.entries(node.statusLabels??{}))nonblank(value,'/statusLabels/'+key);
  if(Boolean(node.showPlanLabel)!==Boolean(node.hidePlanLabel))issue('/showPlanLabel','Supply both show and hide plan labels.');
  if(node.collapsed&&!node.showPlanLabel)issue('/collapsed','Initially collapsed plans need show and hide labels.');
  if((node.layout==='library'||node.planType==='language_learning')&&node.collapsed)issue('/collapsed','Library layout always shows the full plan.');
 }
}
