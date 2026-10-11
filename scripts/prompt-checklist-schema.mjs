/** Original bounded supplied contract. No captured runtime or resolution API. */
export function promptChecklistSchema(){
 const str=max=>({type:'string',minLength:1,maxLength:max}),key={...str(200),pattern:String.raw`^[^\s\u0000-\u001f\u007f]+$(?![\s\S])`};
 const obj=(properties,required=Object.keys(properties))=>({type:'object',properties,required,additionalProperties:false});
 const prompt=obj({id:key,label:str(500),promptText:str(8000),summary:{type:'string',maxLength:2000},icon:{enum:['info','check','warning','error','plus','minus','arrow-left','arrow-right','external-link','clock']},imageData:str(500000)},['id','label','promptText']);
 const task=obj({id:key,title:str(500),prompts:{type:'array',maxItems:40,items:prompt},tryOwnPromptText:str(8000),tryOwnLabel:str(200)},['id','title','prompts','tryOwnPromptText']);
 const data=obj({title:str(500),mode:{enum:['full','compact']},tasks:{type:'array',maxItems:40,items:task},completedTaskIds:{type:'array',maxItems:40,uniqueItems:true,items:key},selectedTaskId:{anyOf:[key,{type:'null'}]},completedItemsExpanded:{type:'boolean'},latestCompletedTaskId:key,latestCompletedTaskTitle:str(500),showCompletedItemsLabel:str(200),tryOwnLabel:str(200),completion:obj({headline:str(500),body:str(4000),showCompletedItemsLabel:str(200)})},['title','mode','tasks','completedTaskIds','showCompletedItemsLabel','tryOwnLabel','completion']);
 const common={type:{const:'prompt-checklist'},id:key,label:str(200),fallback:str(2000),disabled:{type:'boolean'}};
 return {oneOf:[obj({...common,status:{enum:['pending','failed']}},['type','label','status']),obj({...common,status:{const:'resolved'},data},['type','label','status','data'])]};
}
