/** Bounded, authored local questionnaires. Expressions use the existing Value grammar. */
export function installQuestionnaireSchema({node,defs}) {
  const text=(max=500,min=1)=>({type:'string',minLength:min,maxLength:max});
  const key={type:'string',pattern:'^[A-Za-z_][A-Za-z0-9_.-]{0,79}$(?![\\s\\S])'};
  const object=(properties,required=[])=>({type:'object',properties,required,additionalProperties:false});
  const ref=name=>({$ref:`#/$defs/${name}`});
  const scalar={anyOf:[text(12000,0),{type:'number'},{type:'boolean'},{type:'null'}]};
  const answers={type:'object',maxProperties:40,propertyNames:key,additionalProperties:scalar};
  const common={id:key,label:text(200),description:text(2000,0),required:{type:'boolean'},visibleWhen:ref('Value'),validWhen:ref('Value'),validationMessage:text(1000)};
  defs.QuestionnaireChoice=object({value:text(200),label:text(500)},['value','label']);
  defs.QuestionnaireField={oneOf:[
    object({...common,type:{const:'text'},placeholder:text(500,0),minLength:{type:'integer',minimum:0,maximum:12000},maxLength:{type:'integer',minimum:0,maximum:12000}},['id','label','type']),
    object({...common,type:{const:'number'},placeholder:text(500,0),min:{type:'number'},max:{type:'number'},step:{type:'number',exclusiveMinimum:0}},['id','label','type']),
    object({...common,type:{const:'choice'},options:{type:'array',minItems:1,maxItems:40,items:ref('QuestionnaireChoice')}},['id','label','type','options']),
    object({...common,type:{const:'boolean'}},['id','label','type'])
  ]};
  defs.QuestionnaireSource=object({title:text(500),url:text(2048),version:text(200)},['title']);
  node('questionnaire',{
    questionnaireId:key,version:text(80),title:text(500),description:text(4000,0),hiddenValuePolicy:{enum:['retain','clear']},
    fields:{type:'array',minItems:1,maxItems:40,items:ref('QuestionnaireField')},
    computed:{type:'object',maxProperties:40,propertyNames:key,additionalProperties:ref('Value')},
    initialAnswers:answers,defaults:answers,sources:{type:'array',maxItems:20,items:ref('QuestionnaireSource')},
    disabled:{type:'boolean'},action:key,submitLabel:text(200),resetLabel:text(200)
  },['questionnaireId','version','title','hiddenValuePolicy','fields'],'base');
}
