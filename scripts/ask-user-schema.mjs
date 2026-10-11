/** Bounded local elicitation contract. The optional review UI is project-owned. */
export function installAskUserSchema({node,defs}) {
 const text=(max=500,min=1)=>({type:'string',minLength:min,maxLength:max}),bool={type:'boolean'};
 const object=(properties,required=[])=>({type:'object',properties,required,additionalProperties:false});
 const key={...text(80),pattern:'^[A-Za-z][A-Za-z0-9_-]{0,79}$(?![\\s\\S])'};
 const question=object({id:key,label:text(),kind:{enum:['text','textarea','select']},required:bool,placeholder:text(300,0),initialValue:text(4000,0),maxLength:{type:'integer',minimum:1,maximum:4000},options:{type:'array',maxItems:30,items:object({value:text(200),label:text(300)},['value','label'])}},['id','label']);
 const common={label:text(200),status:{enum:['resolved','pending','failed']},fallback:text(2000),showCTA:bool,enabled:bool,disabled:bool,localReview:bool,cancelLabel:text(200),reviewLabel:text(200),invalidLabel:text(500),acceptedLabel:text(500)};
 node('ask-user-details',{...common,invitation:text(2000,0),buttonLabel:text(200),submitLabel:text(200),questions:{type:'array',maxItems:20,items:question},emptyLabel:text(500)},['label'],'base');
 Object.assign(defs.AskUserDetailsNode,{if:{properties:{status:{enum:['pending','failed']}},required:['status']},then:{properties:{questions:false}},else:{properties:{questions:{},buttonLabel:{},submitLabel:{}},required:['questions','buttonLabel','submitLabel']}});
 node('ask-user-files',{...common,kind:{enum:['file','photo','video','media']},buttonLabel:text(200),fileLabel:text(200),photoLabel:text(200),videoLabel:text(200),mediaLabel:text(200),submitLabel:text(200),emptyLabel:text(500),multiple:bool,maxFiles:{type:'integer',minimum:1,maximum:20},maxFileBytes:{type:'integer',minimum:1,maximum:1000000000}},['label'],'base');
 Object.assign(defs.AskUserFilesNode,{if:{properties:{status:{enum:['pending','failed']}},required:['status']},then:{},else:{properties:{kind:{}},required:['kind']}});
}
