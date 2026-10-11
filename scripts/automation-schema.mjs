/** Finite supplied automation views. No scheduler, account or remote resolver. */
export function installAutomationSchema({node,defs}) {
 const text=(max=500)=>({type:'string',minLength:1,maxLength:max}),bool={type:'boolean'};
 const object=(properties,required=[])=>({type:'object',properties,required,additionalProperties:false});
 const id={...text(200),pattern:String.raw`^[^\s\u0000-\u001f\u007f]+$(?![\s\S])`};
 const item=object({id,title:text(),scheduleLabel:text(),url:text(2048),emoji:text(40),disabled:bool},['id','title','scheduleLabel','url']);
 const common={label:text(200),status:{enum:['pending','failed','resolved']},fallback:text(2000),disabled:bool};
 node('display-automation',{...common,item},['label'],'base');
 Object.assign(defs.DisplayAutomationNode,{if:{properties:{status:{enum:['pending','failed']}},required:['status']},then:{properties:{item:false}},else:{properties:{item:{}},required:['item']}});
 node('list-automations',{...common,headerLabel:text(200),emptyLabel:text(500),items:{type:'array',maxItems:100,items:item},viewAll:object({label:text(200),url:text(2048)},['label','url'])},['label'],'base');
 Object.assign(defs.ListAutomationsNode,{if:{properties:{status:{enum:['pending','failed']}},required:['status']},then:{properties:{items:false,viewAll:false}},else:{properties:{headerLabel:{},emptyLabel:{},items:{}},required:['headerLabel','emptyLabel','items']}});
 const step=object({id,title:text(),status:{enum:['completed','in_progress','pending']}},['id','title','status']);
 node('automation-plan-summary',{...common,title:text(),goalLabel:text(200),layout:{enum:['chat','library']},planType:{enum:['automation','language_learning']},mobile:bool,collapsed:bool,completedExpanded:bool,showPlanLabel:text(200),hidePlanLabel:text(200),showCompletedLabel:text(200),completedCountLabel:text(200),summaryErrorLabel:text(1000),emptyLabel:text(500),steps:{anyOf:[{type:'array',maxItems:100,items:step},{type:'null'}]},statusLabels:object({completed:text(200),in_progress:text(200),pending:text(200)},['completed','in_progress','pending'])},['label'],'base');
 Object.assign(defs.AutomationPlanSummaryNode,{if:{properties:{status:{enum:['pending','failed']}},required:['status']},then:{properties:{steps:false}},else:{properties:{title:{},goalLabel:{},steps:{},statusLabels:{}},required:['title','goalLabel','steps','statusLabels']}});
}
