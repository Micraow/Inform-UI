import { z } from '@inform/component-contract/zod';
import { createBudget, inspectData, isRecord } from '@inform/component-contract';
import type { Budget, Issue } from '@inform/component-contract';

/** Trusted, build-time JSON Schema subset. Never accepts schemas from a DSL document. */
export type DataSchema = boolean | { [key:string]: any };
const own=(x:object,k:string)=>Object.prototype.hasOwnProperty.call(x,k);
const ptr=(p:string,k:string|number)=>p+'/'+String(k).replace(/~/g,'~0').replace(/\//g,'~1');
const error=(path:string,message:string):Issue=>({code:'view-data',path,message});
const patterns=new Map<string,RegExp>();
function pattern(source:string){let re=patterns.get(source);if(!re){re=new RegExp(source,'u');patterns.set(source,re);}return re;}
function jsonEqual(a:unknown,b:unknown){return JSON.stringify(a)===JSON.stringify(b);}

/** Bounded interpreter retains oneOf/if/then/else and bounds omitted by Zod's JSON export. */
export function validateDataSchema(schema:DataSchema,value:unknown,budget:Budget=createBudget(200_000),path=''):readonly Issue[]{
 const walk=(s:DataSchema,v:any,p:string,depth=0):Issue[]=>{
  budget.consume();if(depth>64)return[error(p,'Data nesting limit exceeded.')];
  if(s===false)return[error(p,'This data shape is not allowed.')];if(s===true)return[];
  if(Array.isArray(s.type))return walk({...s,type:undefined,anyOf:s.type.map((type:string)=>({type}))},v,p,depth+1);
  const out:Issue[]=[];const fail=(m:string)=>out.push(error(p,m));
  if(own(s,'const')&&!jsonEqual(v,s.const))fail('Value does not match the required literal.');
  if(s.enum&&!s.enum.some((x:unknown)=>jsonEqual(v,x)))fail('Value is outside the declared choices.');
  if(s.type){const valid=s.type==='null'?v===null:s.type==='array'?Array.isArray(v):s.type==='object'?isRecord(v):s.type==='integer'?Number.isSafeInteger(v):s.type==='number'?typeof v==='number'&&Number.isFinite(v):typeof v===s.type;if(!valid)return[error(p,'Expected '+s.type+'.')];}
  if(typeof v==='string'){
   const length=Array.from(v).length;if(s.minLength!==undefined&&length<s.minLength)fail('Text is shorter than the declared minimum.');if(s.maxLength!==undefined&&length>s.maxLength)fail('Text exceeds the declared maximum.');if(s.pattern&&!pattern(s.pattern).test(v))fail('Text does not match the declared format.');
  }
  if(typeof v==='number'){
   if(!Number.isFinite(v))fail('Numbers must be finite.');if(s.minimum!==undefined&&v<s.minimum)fail('Number is below the minimum.');if(s.maximum!==undefined&&v>s.maximum)fail('Number exceeds the maximum.');if(s.exclusiveMinimum!==undefined&&v<=s.exclusiveMinimum)fail('Number must exceed the minimum.');if(s.exclusiveMaximum!==undefined&&v>=s.exclusiveMaximum)fail('Number must be below the maximum.');if(s.multipleOf&&Math.abs(v/s.multipleOf-Math.round(v/s.multipleOf))>1e-9)fail('Number is not an allowed increment.');
  }
  if(Array.isArray(v)){
   if(s.minItems!==undefined&&v.length<s.minItems)fail('Array has too few items.');if(s.maxItems!==undefined&&v.length>s.maxItems)fail('Array has too many items.');if(s.uniqueItems&&new Set(v.map(x=>JSON.stringify(x))).size!==v.length)fail('Array items must be unique.');if(s.items!==undefined)for(let i=0;i<v.length;i++)out.push(...walk(s.items,v[i],ptr(p,i),depth+1));
  }else if(isRecord(v)){
   const keys=Object.keys(v);if(s.maxProperties!==undefined&&keys.length>s.maxProperties)fail('Record has too many fields.');
   for(const key of s.required??[])if(!own(v,key))out.push(error(ptr(p,key),'Required field is missing.'));
   for(const key of keys){budget.consume();if(s.propertyNames)out.push(...walk(s.propertyNames,key,ptr(p,key),depth+1));if(own(s.properties??{},key))out.push(...walk(s.properties[key],v[key],ptr(p,key),depth+1));else if(s.additionalProperties===false)out.push(error(ptr(p,key),'Unknown data field.'));else if(s.additionalProperties&&typeof s.additionalProperties==='object')out.push(...walk(s.additionalProperties,v[key],ptr(p,key),depth+1));}
  }
  if(s.anyOf&&!s.anyOf.some((x:DataSchema)=>walk(x,v,p,depth+1).length===0))fail('No declared data variant matches.');
  if(s.oneOf&&s.oneOf.filter((x:DataSchema)=>walk(x,v,p,depth+1).length===0).length!==1)fail('Exactly one declared data variant must match.');
  for(const child of s.allOf??[])out.push(...walk(child,v,p,depth+1));
  if(s.if){const branch=walk(s.if,v,p,depth+1).length===0?s.then:s.else;if(branch)out.push(...walk(branch,v,p,depth+1));}
  return out.slice(0,64);
 };
 try{const issues=inspectData(value,budget);return issues.length?issues:walk(schema,value,path);}catch(cause){return[error(path,cause instanceof Error?cause.message:'Data validation budget exceeded.')];}
}

function mergeRoot(schema:DataSchema):{properties:Record<string,DataSchema>;required:string[]}{
 if(typeof schema==='boolean')return{properties:{},required:[]};
 const props:Record<string,DataSchema>={...schema.properties},required=new Set<string>(schema.required??[]);
 const variants=(schema.oneOf??schema.anyOf??[]) as DataSchema[];
 for(const variant of variants){const shape=mergeRoot(variant);for(const [key,value]of Object.entries(shape.properties)){if(!own(props,key))props[key]=value;else if(JSON.stringify(props[key])!==JSON.stringify(value))props[key]={anyOf:[props[key],value]};}}
 if(variants.length){const requiredLists=variants.map(x=>mergeRoot(x).required);for(const key of requiredLists[0])if(requiredLists.every(x=>x.includes(key)))required.add(key);}
 return{properties:props,required:[...required]};
}
export function compileDataField(schema:DataSchema):z.ZodType{
 if(schema===false)return z.never();if(schema===true)throw Error('Unbounded data schemas are not allowed.');
 if(Array.isArray(schema.type))return compileDataField({...schema,type:undefined,anyOf:schema.type.map((type:string)=>({type}))});
 let out:z.ZodType;
 if(own(schema,'const'))out=z.literal(schema.const);
 else if(schema.enum)out=z.union(schema.enum.map((v:any)=>z.literal(v)) as [z.ZodType,z.ZodType,...z.ZodType[]]);
 else if((schema.oneOf||schema.anyOf)&&!schema.properties){const variants=(schema.oneOf??schema.anyOf).map(compileDataField);out=variants.length===1?variants[0]:z.union(variants as [z.ZodType,z.ZodType,...z.ZodType[]]);}
 else if(schema.type==='object'||schema.properties){
  if(!schema.properties&&typeof schema.additionalProperties==='object')out=z.record(schema.propertyNames?compileDataField(schema.propertyNames) as z.ZodString:z.string().max(200),compileDataField(schema.additionalProperties));
  else{const {properties,required}=mergeRoot(schema);const object=z.strictObject(Object.fromEntries(Object.entries(properties).map(([key,value])=>[key,required.includes(key)?compileDataField(value):compileDataField(value).optional()])));out=typeof schema.additionalProperties==='object'?object.catchall(compileDataField(schema.additionalProperties)):object;}
 }else if(schema.type==='array'){let list=z.array(compileDataField(schema.items));if(schema.minItems!==undefined)list=list.min(schema.minItems);list=list.max(schema.maxItems??1000);out=list;}
 else if(schema.type==='string'){let str=z.string();if(schema.minLength!==undefined)str=str.min(schema.minLength);str=str.max(schema.maxLength??12000);if(schema.pattern)str=str.regex(pattern(schema.pattern));out=str;}
 else if(schema.type==='number'||schema.type==='integer'){let num=z.number().finite();if(schema.type==='integer')num=num.int();if(schema.minimum!==undefined)num=num.min(schema.minimum);if(schema.maximum!==undefined)num=num.max(schema.maximum);if(schema.exclusiveMinimum!==undefined)num=num.gt(schema.exclusiveMinimum);if(schema.multipleOf!==undefined)num=num.multipleOf(schema.multipleOf);out=num;}
 else if(schema.type==='boolean')out=z.boolean();else if(schema.type==='null')out=z.null();
 else throw Error('Unsupported or unconstrained field schema: '+JSON.stringify(schema));
 return out;
}
/** Root must remain a strict ZodObject for the upstream OpenUI positional data ABI. */
export function compileDataRecord(schema:DataSchema):z.ZodObject{
 const {properties,required}=mergeRoot(schema);
 return z.strictObject(Object.fromEntries(Object.entries(properties).map(([key,value])=>[key,required.includes(key)?compileDataField(value):compileDataField(value).optional()]))).superRefine((value,ctx)=>{for(const issue of validateDataSchema(schema,value))ctx.addIssue({code:'custom',message:issue.message,path:issue.path.split('/').slice(1)});}).meta({...typeof schema==='object'?schema:{},properties,required,additionalProperties:false});
}
