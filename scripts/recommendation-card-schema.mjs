/** Additive schema fragment. Integration must preserve every existing definition. */
export function recommendationCardSchema(){
 const str=max=>({type:'string',minLength:1,maxLength:max});
 const object=(properties,required=Object.keys(properties))=>({type:'object',properties,required,additionalProperties:false});
 const key={...str(200),pattern:String.raw`^[^\s\u0000-\u001f\u007f]+$(?![\s\S])`};
 const common={type:{const:'recommendation-card'},id:key,label:str(200),fallback:str(2000)};
 const data=object({conversationId:key,title:str(500),description:{type:'string',maxLength:4000},emoji:str(32),iconData:str(500000)},['conversationId','title','description']);
 return {oneOf:[object({...common,status:{enum:['pending','failed']}},['type','label','status']),object({...common,status:{const:'resolved'},canOpenConversation:{type:'boolean'},data},['type','label','status','canOpenConversation','data'])]};
}
