/** Supplied, finite entity presentations; no action resolver or account service. */
export function installEntitySchema({node,defs}) {
 const text=(max=500,min=1)=>({type:'string',minLength:min,maxLength:max}),bool={type:'boolean'};
 const object=(properties,required=[])=>({type:'object',properties,required,additionalProperties:false});
 const id={...text(200),pattern:String.raw`^[^\s\u0000-\u001f\u007f]+$(?![\s\S])`};
 const image=object({src:text(500000),alt:text(500,0)},['src']);
 const common={label:text(200),status:{enum:['pending','failed','resolved']},fallback:text(2000),disabled:bool,loadImageLabel:text(200)};
 const action={actionId:id,actionLabel:text(300),disabled:bool};
 const overview=object({id,title:text(),images:{type:'array',items:image,maxItems:12},metadata:{type:'array',items:object({label:text(200),value:text(1000)},['label','value']),maxItems:20},description:text(6000),...action},['id','title','images','metadata']);
 node('entity-card',{...common,title:text(),subtitle:text(2000,0),image:{anyOf:[image,{type:'null'}]},...action},['label'],'base');
 Object.assign(defs.EntityCardNode,{if:{properties:{status:{enum:['pending','failed']}},required:['status']},then:{properties:{image:false,actionId:false}},else:{properties:{title:{}},required:['title']}});
 node('entity-overview',{...common,variant:{enum:['single','carousel']},item:overview,items:{type:'array',items:overview,maxItems:50},emptyLabel:text(500),title:text(),mobile:bool},['label'],'base');
 Object.assign(defs.EntityOverviewNode,{if:{properties:{status:{enum:['pending','failed']}},required:['status']},then:{properties:{item:false,items:false}},else:{oneOf:[{properties:{variant:{const:'single'},item:{},items:false},required:['item']},{properties:{variant:{const:'carousel'},item:false,items:{}},required:['variant','items']}]}});
}
