/** Original arithmetic over caller-supplied GCS component ratings; no assessment inference. */
export const GCS_VERSION = 'gcs-six-motor-levels' as const;
export type GcsComponent = 'eye' | 'verbal' | 'motor';
export interface GcsInput { version?: string | null; population?: 'adult' | 'other' | null; eye?: number | string | null; verbal?: number | string | null; motor?: number | string | null }
export type GcsComponentState = { status: 'rated'; value: number } | { status: 'not-testable' | 'missing' | 'invalid' };
export type GcsResult = { version: typeof GCS_VERSION; components: Readonly<Record<GcsComponent,GcsComponentState>> } & (
  {status:'calculated';total:number} | {status:'invalid';fields:readonly string[]} | {status:'incomplete';fields:readonly string[]} | {status:'not-testable';fields:readonly GcsComponent[]} | {status:'unsupported';reason:'version'|'population'});
const keys = ['eye','verbal','motor'] as const;
function state(raw: unknown, max: number): GcsComponentState {
  if(raw === null || raw === undefined || raw === '') return {status:'missing'};
  if(raw === 'NT') return {status:'not-testable'};
  if(typeof raw !== 'number' || !Number.isInteger(raw) || raw < 1 || raw > max) return {status:'invalid'};
  return {status:'rated',value:raw};
}
export function calculateGcs(input:GcsInput):GcsResult {
  const components = Object.freeze({eye:Object.freeze(state(input.eye,4)),verbal:Object.freeze(state(input.verbal,5)),motor:Object.freeze(state(input.motor,6))});
  const base = {version:GCS_VERSION,components};
  const invalid:string[] = keys.filter(key=>components[key].status==='invalid');
  if(input.population !== undefined && input.population !== null && input.population !== 'adult' && input.population !== 'other')invalid.push('population');
  if(input.version !== undefined && input.version !== null && typeof input.version !== 'string')invalid.push('version');
  if(invalid.length)return {...base,status:'invalid',fields:invalid};
  if(input.version && input.version!==GCS_VERSION)return {...base,status:'unsupported',reason:'version'};
  if(input.population==='other')return {...base,status:'unsupported',reason:'population'};
  const missing:string[]=[];
  if(!input.version)missing.push('version');if(!input.population)missing.push('population');
  missing.push(...keys.filter(key=>components[key].status==='missing'));
  const nt=keys.filter(key=>components[key].status==='not-testable');
  // NT remains distinct from absent or malformed data and never contributes a number.
  if(nt.length)return {...base,status:'not-testable',fields:nt};
  if(missing.length)return {...base,status:'incomplete',fields:missing};
  const total=keys.reduce((sum,key)=>sum+(components[key].status==='rated'?components[key].value:0),0);
  return {...base,status:'calculated',total};
}
export interface GcsInfoSection { id:string;label:string;body:string }
export interface GcsFieldPresentation { label?:string;help?:string;optionHelp?:Readonly<Record<string,string>>;variant?:'select'|'segmented' }
export interface GcsNode { type:'calculator-glasgow-coma-scale-gcs'; id?:string; label:string; initial?:GcsInput; defaults?:GcsInput; disabled?:boolean; calculateLabel?:string; resetLabel?:string; copyLabel?:string; subtitle?:string; status?:'pending'|'resolved'|'failed'; fallback?:string; resultMode?:'live'|'on-demand'; scoreLabel?:string; summaryPrefix?:string; infoSections?:readonly GcsInfoSection[]; activeInfoId?:string; notes?:readonly string[]; fields?:Partial<Record<GcsComponent,GcsFieldPresentation>> }

export interface GcsDetail { id:string|null; intent:'calculate'|'reset'|'copy-summary'|'select-info'; result?:GcsResult; text?:string; infoId?:string }
export function inspectGcs(node:GcsNode,path:string,add:(issue:{path:string;message:string;code:string})=>void):void {
  for(const key of ['label','calculateLabel','resetLabel','copyLabel','scoreLabel'] as const)if(typeof node[key]==='string'&&!(node[key] as string).trim())add({path:`${path}/${key}`,message:'Expected nonempty visible text.',code:'GCS_TEXT'});
}

export function inspectGcsPresentation(node:GcsNode,path:string,add:(issue:{path:string;message:string;code:string})=>void):void { const ids=new Set<string>(); for(const section of node.infoSections??[]){if(ids.has(section.id)||!section.id.trim()||!section.label.trim())add({path:path+'/infoSections',message:'Supply unique nonempty information IDs and labels.',code:'GCS_INFO'});ids.add(section.id);}if(node.activeInfoId!==undefined&&!ids.has(node.activeInfoId))add({path:path+'/activeInfoId',message:'Unknown information section.',code:'GCS_INFO'}); for(const [key,field] of Object.entries(node.fields??{})){if(field.label!==undefined&&!field.label.trim())add({path:path+'/fields/'+key,message:'Supply a nonblank visible field label.',code:'GCS_TEXT'});for(const option of Object.keys(field.optionHelp??{}))if(!['NT',...Array.from({length:key==='eye'?4:key==='verbal'?5:6},(_,i)=>String(i+1))].includes(option))add({path:path+'/fields/'+key+'/optionHelp',message:'Option help must refer to an exact component rating or NT.',code:'GCS_OPTION'});} }
