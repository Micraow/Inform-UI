import { z } from '@inform/component-contract/zod';
import { freezeData } from '@inform/component-contract';
import type { ComponentDefinition, ModuleDefinition, RendererAdapter, RuntimeResource, SlotSpec } from '@inform/component-contract';
import raw from './specs.json';
import { compileDataField, compileDataRecord, validateDataSchema } from './schema';
import type { DataSchema } from './schema';
import { viewExample } from './examples';
import { validateDomainSemantics } from './semantics/dispatch';
export { validateDomainSemantics } from './semantics/dispatch';
// Reexports let standalone tooling share exactly the same physical Zod/schema registry.
export { buildProfile, createCatalog, resources } from '@inform/component-contract';
export { compileDataField, compileDataRecord, validateDataSchema } from './schema';
export type { DataSchema } from './schema';
export interface ViewSpec {
 oldType:string;oldDefinition:string;name:string;classification:'base'|'view'|'host'|'refusal';family:string;dataName:string|null;rendererKey:string;orderedProps:string[];
 slots:Record<string,SlotSpec>;bindings:{prop:string;dataProp:string|null;schema:DataSchema;optional:boolean}[];actions:{prop:string;scope:string;required:boolean}[];dataSchema:DataSchema;
 composition:{requiredPublicBases:string[];status:string;evidence:string[]};renderer:{oldSource:string;oldLine:number|null;oldDispatcherCase:boolean;oldOperational:boolean;actualAdapterBound:boolean;browserVerified:boolean;evidence:string[]};limitations:string[];
}
export const migrationMap=freezeData(raw as unknown as {provenance:Record<string,string>;entries:ViewSpec[]});
export const viewSpecs:readonly ViewSpec[]=migrationMap.entries.filter(x=>x.classification==='view'||x.classification==='host');
export const viewExamples=Object.freeze(Object.fromEntries(viewSpecs.map(spec=>[spec.name,viewExample(spec,viewSpecs)])));
export const viewResources:readonly RuntimeResource[]=freezeData([{id:'inform/views',kind:'renderer',dependsOn:['inform/foundation']}]);
export interface ViewModuleOptions {adapters:Readonly<Record<string,RendererAdapter>>;includeHost?:boolean;names?:readonly string[];examples?:Readonly<Record<string,{data:Record<string,unknown>;source:string}>>}
/** Missing adapters stay unbound. The shared buildProfile rejects their registration. */
export function createViewModules(options:ViewModuleOptions):readonly ModuleDefinition[]{
 const selected=viewSpecs.filter(x=>(options.includeHost!==false||x.classification!=='host')&&(!options.names||options.names.includes(x.name)));
 if(options.names)for(const name of options.names)if(!selected.some(x=>x.name===name))throw Error('Unknown or excluded View: '+name);
 // Restricted child slots are real contract dependencies, including narrow per-View profiles.
 for(let index=0;index<selected.length;index++)for(const slot of Object.values(selected[index].slots))if(Array.isArray(slot.accepts))for(const name of slot.accepts){
  const dependency=viewSpecs.find(spec=>spec.name===name);if(!dependency||selected.some(spec=>spec.name===name))continue;
  if(options.includeHost===false&&dependency.classification==='host')throw Error('Excluded host View dependency: '+name);
  selected.push(dependency);
 }
 const grouped=new Map<string,ViewSpec[]>();for(const spec of selected){const key=spec.family;grouped.set(key,[...grouped.get(key)??[],spec]);}
 return [...grouped].map(([family,specs])=>{
  const data=specs.map(spec=>{const schema=compileDataRecord(spec.dataSchema);return{name:spec.dataName!,schema,orderedProps:Object.keys(schema.shape),description:'Strict supplied record for '+spec.name+'. Conditional variants are enforced by the same bounded validator.'};});
  const components:ComponentDefinition[]=specs.map(spec=>({name:spec.name,layer:'domain',description:'Supplied '+spec.oldType.replaceAll('-',' ')+' View rendered with the shared Inform foundation theme.',orderedProps:spec.orderedProps,
   props:context=>{const shape:Record<string,z.ZodType>={data:context.data(spec.dataName!)};for(const[key,slot]of Object.entries(spec.slots))shape[key]=context.children(slot);for(const binding of spec.bindings){const field=compileDataField(binding.schema);shape[binding.prop]=context.binding(binding.optional?field.optional():field);}for(const action of spec.actions)shape[action.prop]=context.action();return z.strictObject(shape);},
   semantics:{static:[],evaluated:[(props,{budget})=>validateDataSchema(spec.dataSchema,props.data,budget,'/data'),(props,{budget})=>validateDomainSemantics(spec,props,viewSpecs,budget)]},
   renderer:options.adapters[spec.name]??{kind:'unbound',key:spec.rendererKey},
   docs:'Use '+spec.name+'(data'+(Object.keys(spec.slots).length?', '+Object.keys(spec.slots).join(', '):'')+'). data is a strict supplied record; child slots accept actual DSL elements. Actions are runtime-issued local handles. Host-looking identifiers in data grant no execution permission. '+(spec.classification==='host'?'This host-dependent View requires an explicitly policy-gated adapter. ':''),
   examples:[{id:spec.oldType,description:'Synthetic supplied record. '+viewExamples[spec.name].provenance,source:options.examples?.[spec.name]?.source??viewExamples[spec.name].source}],
   capabilities:['display',...(spec.bindings.length?['local-state' as const]:[]),...(spec.actions.length?['local-action' as const]:[])],limitations:spec.limitations,
  }));
  return{id:'views/'+family,layer:'domain' as const,dependsOn:['base/layout','base/controls','base/media','base/icon',...new Set(specs.flatMap(spec=>Object.values(spec.slots).flatMap(slot=>Array.isArray(slot.accepts)?slot.accepts.flatMap(name=>{const target=viewSpecs.find(item=>item.name===name);return target&&target.family!==family?['views/'+target.family]:[];}):[])))],runtimeRequires:['inform/views'],components,data};
 });
}
/** Evidence is caller-supplied integration data, never inferred from schema registration. */
export function createMigrationCoverage(evidence:Readonly<Record<string,{actualAdapterBound?:boolean;browserVerified?:boolean;publicBaseComposed?:boolean;sources?:readonly string[]}>>={}){
 const entries=migrationMap.entries.map(spec=>{const proof=evidence[spec.name];return{oldType:spec.oldType,name:spec.name,classification:spec.classification,contractDefined:spec.classification!=='refusal',oldRendererPresent:spec.renderer.oldOperational,actualAdapterBound:proof?.actualAdapterBound===true,browserVerified:proof?.browserVerified===true,publicBaseComposed:proof?.publicBaseComposed===true,requiredPublicBases:spec.composition.requiredPublicBases,evidence:[...proof?.sources??[]]};});
 return{total:entries.length,contractViews:viewSpecs.length,actualAdapterBound:entries.filter(x=>x.actualAdapterBound).length,publicBaseComposed:entries.filter(x=>x.publicBaseComposed).length,browserVerified:entries.filter(x=>x.browserVerified).length,entries};
}
