/** Finite supplied voice presentations and cancelable local intents. */
export function installVoiceCardsSchema({node,defs}) {
 const text=(max=500,min=1)=>({type:'string',minLength:min,maxLength:max}),bool={type:'boolean'};
 const object=(properties,required=[])=>({type:'object',properties,required,additionalProperties:false});
 const common={label:text(200),status:{enum:['resolved','pending','failed']},fallback:text(2000),disabled:bool,available:bool,unavailableLabel:text(500),requestedLabel:text(500),cancelledLabel:text(500)};
 const resolved=(name,required)=>Object.assign(defs[name],{if:{properties:{status:{enum:['pending','failed']}},required:['status']},then:{},else:{properties:Object.fromEntries(required.map(key=>[key,{}])),required}});
 node('learning-voice-mode-launcher-card',{...common,title:text(500),description:text(2000),startLabel:text(200),voiceSession:object({id:text(200)},['id'])},['label'],'learning');
 resolved('LearningVoiceModeLauncherCardNode',['title','description','startLabel','voiceSession']);
 node('offer-voice-conversation',{...common,presentation:{enum:['button','card']},buttonLabel:text(200),description:text(2000),iconSrc:text(2048)},['label'],'base');
 resolved('OfferVoiceConversationNode',['buttonLabel']);
 const labels=Object.fromEntries(['title','directions','start','stop','retry','starting','listening','success','failure','error','play','stopPlayback','playbackError','hiddenWord'].map(k=>[k,text(k==='directions'?2000:500)]));
 const exercise=object({id:text(80),text:text(4000),sourceText:text(4000),language:text(80),mode:{enum:['repeat','recall']},phase:{enum:['idle','starting','listening','success','failure','error']},available:bool,playbackAvailable:bool,playbackPhase:{enum:['idle','playing','error']},labels:object(labels),segments:{type:'array',minItems:1,maxItems:200,items:object({text:text(4000,0),matched:bool},['text'])}},['id','text']);
 node('learning-speak-card',{...common,exercises:{type:'array',minItems:1,maxItems:30,items:exercise},progressLabels:{type:'array',minItems:1,maxItems:30,items:text(200)},previousLabel:text(200),nextLabel:text(200),doneLabel:text(200)},['label'],'learning');
 resolved('LearningSpeakCardNode',['exercises']);
}
