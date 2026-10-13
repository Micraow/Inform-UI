/** Inform prompt projection from the exact exported validation schema.
 * Never infer constraints from examples or re-maintain component bounds here.
 */
type Schema = boolean | Record<string, any>;
export interface PromptSchemaOptions {
  componentNames?: readonly string[];
  orderedProps?: readonly string[];
  bindingProps?: readonly string[];
  actionProps?: readonly string[];
  /** Explicit searchable catalogs only; no generic enum truncation. */
  catalogEnums?: Readonly<Record<string, string>>;
}
const own=(value:object,key:string)=>Object.prototype.hasOwnProperty.call(value,key);
const json=(value:unknown)=>JSON.stringify(value);
const number=(value:number)=>Math.abs(value)>=1e9?value.toExponential().replace('e+','e'):String(value);
const field=(name:string)=>/^[A-Za-z_$][\w$]*$/.test(name)?name:json(name);
const refName=(ref:string)=>/^#\/\$defs\//.test(ref)?ref.slice(8).replace(/~1/g,'/').replace(/~0/g,'~'):ref;
const annotations=new Set(['$schema','$id','$anchor','$dynamicAnchor','$comment','id','title','description','examples','deprecated','readOnly','writeOnly']);
const structural=new Set(['type','enum','const','$ref','$dynamicRef','$defs','definitions','properties','required','additionalProperties','unevaluatedProperties','patternProperties','propertyNames','dependentRequired','dependentSchemas','dependencies','items','prefixItems','additionalItems','contains','minContains','maxContains','unevaluatedItems','anyOf','oneOf','allOf','not','if','then','else']);
const scalar=new Set(['minimum','maximum','exclusiveMinimum','exclusiveMaximum','multipleOf','minLength','maxLength','pattern','format','contentEncoding','contentMediaType','contentSchema','minItems','maxItems','uniqueItems','minProperties','maxProperties','default']);
const relationKeys=['oneOf','allOf','not','if','dependentRequired','dependentSchemas','dependencies','contains','propertyNames','patternProperties','unevaluatedProperties','unevaluatedItems','contentSchema'];
function literalHasSiblings(s:Record<string,any>):boolean{
  if(Object.keys(s).some(key=>!['type','enum','const','default'].includes(key)&&!annotations.has(key)&&!key.startsWith('x-')))return true;
  const values=own(s,'const')?[s.const]:s.enum;
  if(!s.type||!Array.isArray(values))return false;
  const types=Array.isArray(s.type)?s.type:[s.type];
  return values.some(value=>!types.some((type:string)=>type==='null'?value===null:type==='array'?Array.isArray(value):type==='object'?value!==null&&typeof value==='object'&&!Array.isArray(value):type==='integer'?Number.isInteger(value):typeof value===type));
}
function checkKeys(schema:Record<string,any>,path:string){
  for(const key of Object.keys(schema))if(!annotations.has(key)&&!structural.has(key)&&!scalar.has(key)&&!key.startsWith('x-'))throw Error(`Unsupported schema prompt keyword ${path}.${key}; add a tested projection rather than omitting it.`);
}
function nestedRelation(value:any):boolean{
  if(!value||typeof value!=='object')return false;
  if(Array.isArray(value))return value.some(nestedRelation);
  if(relationKeys.some(key=>own(value,key)))return true;
  if((own(value,'$ref')||own(value,'$dynamicRef'))&&Object.keys(value).some(key=>!['$ref','$dynamicRef'].includes(key)&&!annotations.has(key)&&!key.startsWith('x-')))return true;
  if((own(value,'const')||own(value,'enum'))&&literalHasSiblings(value))return true;
  if(Array.isArray(value.required)&&value.required.some((name:string)=>!own(value.properties??{},name)))return true;
  return ['properties','additionalProperties','items','additionalItems','prefixItems','anyOf'].some(key=>{
    const child=value[key];return key==='properties'&&child?Object.values(child).some(nestedRelation):nestedRelation(child);
  });
}
function numericRange(s:Record<string,any>):string{
  const lows=[s.minimum,typeof s.exclusiveMinimum==='number'?s.exclusiveMinimum:undefined].filter(x=>typeof x==='number');
  const highs=[s.maximum,typeof s.exclusiveMaximum==='number'?s.exclusiveMaximum:undefined].filter(x=>typeof x==='number');
  const lower=lows.length?Math.max(...lows):undefined;
  const upper=highs.length?Math.min(...highs):undefined;
  if(lower===undefined&&upper===undefined)return '';
  const left=s.exclusiveMinimum===lower||s.exclusiveMinimum===true?'(':'[';
  const right=s.exclusiveMaximum===upper||s.exclusiveMaximum===true?')':']';
  return `${left}${lower===undefined?'-∞':number(lower)},${upper===undefined?'∞':number(upper)}${right}`;
}
function suffix(s:Record<string,any>,keys:readonly string[]):string{
  const values=keys.filter(key=>own(s,key)).map(key=>`${key}=${json(s[key])}`);
  return values.length?`{${values.join(',')}}`:'';
}
/** Human-readable type, including bounds that upstream's Zod signatures omit. */
export function schemaPromptType(schema:Schema,options:PromptSchemaOptions={},path='',depth=0):string{
  if(depth>80)throw Error('Schema prompt nesting exceeds 80 levels: '+path);
  if(schema===false)return 'never';if(schema===true)return 'unknown';
  if(!schema||typeof schema!=='object')throw Error('Invalid JSON schema at '+path);
  checkKeys(schema,path);
  const s=schema;
  if(typeof s.$ref==='string')return refName(s.$ref)+suffix(s,[...scalar]);
  if(typeof s.$dynamicRef==='string')return s.$dynamicRef+suffix(s,[...scalar]);
  let type:string;
  if(own(s,'const')||Array.isArray(s.enum)){
    type=own(s,'const')?json(s.const):(options.catalogEnums?.[path]??s.enum.map(json).join(' | '));
    const siblings=Object.fromEntries(Object.entries(s).filter(([key])=>!['enum','const','default'].includes(key)&&!annotations.has(key)&&!key.startsWith('x-')));
    if(literalHasSiblings(s))type=`(${type}) & ${schemaPromptType(siblings,options,path,depth+1)}`;
  }
  else if(s.anyOf||s.oneOf){
    const alternatives=(s.anyOf??s.oneOf) as Schema[];
    const names=alternatives.map(x=>typeof x==='object'&&x!==null&&typeof x.$ref==='string'?refName(x.$ref):null);
    const components=new Set(options.componentNames??[]);
    if(names.length&&names.every(name=>name!==null&&components.has(name))&&new Set(names).size===components.size)type='Component';
    else type=[...new Set(alternatives.map((x,i)=>schemaPromptType(x,options,`${path}.alternative${i+1}`,depth+1)))].join(' | ');
    const siblings=Object.fromEntries(Object.entries(s).filter(([key])=>!['anyOf','oneOf','default'].includes(key)&&!annotations.has(key)&&!key.startsWith('x-')));
    if(Object.keys(siblings).length)type=`(${type}) & ${schemaPromptType(siblings,options,path,depth+1)}`;
  }else if(Array.isArray(s.type))type=s.type.map((t:string)=>schemaPromptType({...s,type:t},options,path,depth+1)).join(' | ');
  else if(s.type==='integer'||s.type==='number')type=s.type+numericRange(s)+suffix(s,['multipleOf']);
  else if(s.type==='string')type='string'+suffix(s,['minLength','maxLength','pattern','format','contentEncoding','contentMediaType']);
  else if(s.type==='array'||s.items!==undefined||s.prefixItems!==undefined){
    const prefix=Array.isArray(s.prefixItems)?s.prefixItems:Array.isArray(s.items)?s.items:null;
    if(prefix){
      const values=prefix.map((item:Schema,i:number)=>schemaPromptType(item,options,`${path}[${i}]`,depth+1));
      const rest=Array.isArray(s.items)?s.additionalItems:s.items;
      if(rest!==false&&!(typeof s.maxItems==='number'&&s.maxItems<=prefix.length))values.push(`...${schemaPromptType(rest??true,options,`${path}[...]`,depth+1)}[]`);
      type=`[${values.join(', ')}]`;
    }else{
      const item=schemaPromptType(s.items??true,options,path+'[]',depth+1);
      type=`${item.includes(' | ')?'('+item+')':item}[]`;
    }
    type+=suffix(s,['minItems','maxItems','uniqueItems']);
  }else if(s.type==='object'||s.properties||s.additionalProperties!==undefined){
    const required=new Set<string>(s.required??[]),properties=s.properties??{};
    const fields=Object.entries(properties).map(([name,item])=>`${field(name)}${required.has(name)?'':'?'}: ${schemaPromptType(item as Schema,options,path?path+'.'+name:name,depth+1)}`);
    if(s.additionalProperties!==false)fields.push(`[key: string]: ${schemaPromptType(s.additionalProperties??true,options,path+'.*',depth+1)}`);
    type=`{${fields.join(', ')}}`+suffix(s,['minProperties','maxProperties']);
  }else type=(typeof s.type==='string'?s.type:'unknown')+suffix(s,[...scalar].filter(key=>key!=='default'));
  if(own(s,'const')||Array.isArray(s.enum)||s.anyOf||s.oneOf)type+=suffix(s,[...scalar].filter(key=>key!=='default'));
  return type+suffix(s,['default']);
}
export function schemaPromptSignature(name:string,schema:Schema,options:PromptSchemaOptions={}):string{
  if(!schema||typeof schema!=='object')throw Error(name+' needs an object schema');
  const props=schema.properties??{},required=new Set<string>(schema.required??[]);
  const ordered=options.orderedProps??Object.keys(props);
  if(ordered.length!==Object.keys(props).length||ordered.some(key=>!own(props,key)))throw Error(name+' positional order does not match schema properties');
  const bindings=new Set(options.bindingProps??[]),actions=new Set(options.actionProps??[]);
  return `${name}(${ordered.map(key=>{
    let type=actions.has(key)?'ActionExpression':schemaPromptType(props[key],options,name+'.'+key);
    if(bindings.has(key))type=`$binding<${type}>`;
    return `${field(key)}${required.has(key)?'':'?'}: ${type}`;
  }).join(', ')})`;
}
/** Preserve validation keyword structure in conditional/relational rules. */
function assertionSchema(value:any):any{
  if(!value||typeof value!=='object')return value;
  if(Array.isArray(value))return value.map(assertionSchema);
  const maps=new Set(['properties','patternProperties','dependentSchemas','$defs','definitions']);
  const singles=new Set(['additionalProperties','unevaluatedProperties','propertyNames','items','additionalItems','contains','unevaluatedItems','not','if','then','else','contentSchema']);
  const lists=new Set(['anyOf','oneOf','allOf','prefixItems']);
  return Object.fromEntries(Object.entries(value).filter(([key])=>!annotations.has(key)&&(!key.startsWith('x-')||key==='x-inform-runtime-rules')).map(([key,item])=>{
    if(maps.has(key)&&item&&typeof item==='object')return[key,Object.fromEntries(Object.entries(item).map(([name,child])=>[name,assertionSchema(child)]))];
    if(singles.has(key)||lists.has(key))return[key,assertionSchema(item)];
    // const, enum and default are authored JSON values, not schema nodes.
    return[key,item];
  }));
}
/** Extra assertion groups that cannot be expressed by an ordinary type signature. */
export function schemaPromptRelations(definitions:Record<string,Schema>):string{
  const lines:string[]=[];
  const walk=(schema:Schema,path:string,depth=0)=>{
    if(depth>80)throw Error('Schema relation nesting exceeds 80 levels: '+path);
    if(!schema||typeof schema!=='object')return;
    checkKeys(schema,path);
    if(Array.isArray(schema['x-inform-runtime-rules']))for(const rule of schema['x-inform-runtime-rules'])lines.push(`${path} [runtime rule ${rule.id}]: ${rule.rule}`);
    if(Array.isArray(schema.required)&&schema.required.some((name:string)=>!own(schema.properties??{},name)))lines.push(`${path}: ${json({required:schema.required})}`);
    const refSiblings=((own(schema,'$ref')||own(schema,'$dynamicRef'))&&Object.keys(schema).some(key=>!['$ref','$dynamicRef'].includes(key)&&!annotations.has(key)&&!key.startsWith('x-')))||((own(schema,'const')||own(schema,'enum'))&&literalHasSiblings(schema));
    // Keep the complete assertion object, not just a combinator: its sibling
    // required/properties/bounds are conjunctive and must not disappear.
    if(relationKeys.some(key=>own(schema,key))||(Array.isArray(schema.anyOf)&&schema.anyOf.some(nestedRelation))||refSiblings)lines.push(`${path}: ${json(assertionSchema(schema))}`);
    for(const[name,child]of Object.entries(schema.properties??{}))walk(child as Schema,path+'.'+name,depth+1);
    if(schema.items&&typeof schema.items==='object'&&!Array.isArray(schema.items))walk(schema.items,path+'[]',depth+1);
    if(schema.additionalProperties&&typeof schema.additionalProperties==='object')walk(schema.additionalProperties,path+'.*',depth+1);
    if(schema.additionalItems&&typeof schema.additionalItems==='object')walk(schema.additionalItems,path+'[...]',depth+1);
    for(const[at,child]of (schema.prefixItems??(Array.isArray(schema.items)?schema.items:[])).entries())walk(child,path+`[${at}]`,depth+1);
    // Branch assertions were emitted verbatim above, so repeating their descendants
    // would expand conditional schemas without adding information.
  };
  for(const[name,schema]of Object.entries(definitions))walk(schema,name);
  return lines.length?'## Schema relationship constraints\n\nThese compact JSON clauses use JSON Schema semantics in addition to the signatures; sibling constraints also apply. oneOf means exactly one branch; anyOf means at least one; allOf means every branch. Optional properties may be absent, including inside conditions. default is a schema annotation; its application is determined by the runtime contract. x-inform-runtime-rules are additional checks enforced by Inform runtime, not by an ordinary JSON Schema validator.\n\n'+[...new Set(lines)].map(line=>'- '+line).join('\n'):'';
}
export const schemaPromptNotation='Read signatures together with all schema and runtime relationship rules: integer requires a whole number; [a,b] includes both bounds, (a,b) excludes them; minItems/maxItems count array entries; ? means the field may be omitted, not that null is accepted. null is allowed only when explicitly listed. Runtime string minLength/maxLength use UTF-16 code units (an emoji may count as 2), which can differ from standard JSON Schema Unicode-code-point counting; final validation uses Inform runtime. {default=...} records an annotated default; the runtime determines its application. A tuple lists positional item types; allowed rest items are shown. Undeclared keys are rejected by strict objects. Catalog-backed enums must match their named catalog. Constraints on an untyped schema apply only to the relevant value kind; do not infer a narrower type.';

/** Exact shared documentation prefixes are printed once, never truncated away. */
export function schemaPromptUsage(groups:readonly {id:string;components:readonly {name:string;docs:string}[]}[]):string[]{
  return groups.flatMap(group=>{
    if(!group.components.length)return[];
    let prefix=group.components[0].docs;
    for(const def of group.components.slice(1)){let at=0;while(at<prefix.length&&at<def.docs.length&&prefix[at]===def.docs[at])at++;prefix=prefix.slice(0,at);}
    prefix=prefix.slice(0,prefix.lastIndexOf('. ')+2);
    if(group.components.length<2||prefix.length<100)prefix='';
    return [...(prefix?[`${group.id} shared usage: ${prefix.trim()}`]:[]),...group.components.map(def=>`${def.name} usage: ${def.docs.slice(prefix.length)}`).filter(line=>!line.endsWith('usage: '))];
  });
}
