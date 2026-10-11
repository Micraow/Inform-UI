/** Finite local welcome actions; no raw client dispatcher payload. */
export function installCapabilityWelcomeSchema({node,defs}) {
 const text=(max=500)=>({type:'string',minLength:1,maxLength:max}),bool={type:'boolean'},object=(properties,required)=>({type:'object',properties,required,additionalProperties:false});
 const common={id:text(80),disabled:bool};
 const action={oneOf:[object({...common,kind:{const:'prompt'},query:text(8000)},['id','kind','query']),object({...common,kind:{const:'url'},url:text(2048)},['id','kind','url']),object({...common,kind:{const:'capability'},capability:text(100),available:bool},['id','kind','capability']),object({...common,kind:{const:'voice'},available:bool},['id','kind'])]};
 node('whats-new-capability-welcome',{label:text(200),status:{enum:['resolved','pending','failed']},fallback:text(2000),items:{type:'array',maxItems:20,items:object({id:text(80),actionId:text(80),label:text(500),iconSrc:text(2048),fallbackSymbol:text(12),disabled:bool},['id','actionId','label'])},actions:{type:'array',maxItems:30,items:action},campaignId:text(200),disabled:bool,emptyLabel:text(500),resetLabel:text(200),requestedLabel:text(1000),cancelledLabel:text(1000)},['label'],'base');
 Object.assign(defs.WhatsNewCapabilityWelcomeNode,{if:{properties:{status:{enum:['pending','failed']}},required:['status']},then:{},else:{properties:{items:{},actions:{}},required:['items','actions']}});
}
