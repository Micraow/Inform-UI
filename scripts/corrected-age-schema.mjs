export function installCorrectedAgeSchema({node,defs}) {
  const optionalDate={anyOf:[{type:'string',maxLength:10},{type:'null'}]};
  const rawUnit={anyOf:[{type:'number'},{type:'string',maxLength:8},{type:'null'}]};
  defs.CorrectedAgeInput={type:'object',additionalProperties:false,properties:{basis:{anyOf:[{enum:['gestation','due-date']},{type:'null'}]},birthDate:optionalDate,observationDate:optionalDate,dueDate:optionalDate,gestationalWeeks:rawUnit,gestationalDays:rawUnit,confirmedPreterm:{type:['boolean','null']}}};
  node('calculator-corrected-adjusted-age-of-preterm-infants',{label:{type:'string',minLength:1,maxLength:200},initial:{$ref:'#/$defs/CorrectedAgeInput'},disabled:{type:'boolean'},calculateLabel:{type:'string',minLength:1,maxLength:200},resetLabel:{type:'string',minLength:1,maxLength:200}},['label'],'base');
}
