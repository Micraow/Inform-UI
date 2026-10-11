/** Independent, finite status presentation. No account lookup or remote resolution. */
export function financeStatusSchema(){
 const string=(max,min=1)=>({type:'string',minLength:min,maxLength:max});
 const object=(properties,required)=>({type:'object',properties,required,additionalProperties:false});
 const id={...string(200),pattern:String.raw`^[^\s\u0000-\u001f\u007f]+$(?![\s\S])`};
 const common={type:{const:'ledger-finance-status-banner'},id,label:string(200),fallback:string(2000)};
 const data=object({title:string(500),description:string(4000,0)},['title','description']);
 return {oneOf:[
  object({...common,status:{enum:['pending','failed']}},['type','label','status']),
  object({...common,status:{const:'resolved'},data},['type','label'])
 ]};
}
