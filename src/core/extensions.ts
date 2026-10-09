import type {Node} from '../schema/document.js';
import type {Issue,Scalar} from './index.js';
export type FieldNode = Extract<Node, { type: 'input'|'textarea'|'radio'|'segmented' }>;
export const isField = (node: Node): node is FieldNode => ['input','textarea','radio','segmented'].includes(node.type);
export function validDate(date: string): boolean { return /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0,10) === date; }
/** Native date fields expose only Gregorian date strings in the browser's supported year range. */
export function validInputDate(date: string): boolean { return !date.startsWith('0000') && validDate(date); }
export function timestamp(value: unknown): number {
  if (typeof value === 'number') return Math.abs(value) <= 8.64e15 ? value : NaN;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !validDate(value.slice(0,10))) return NaN;
  return Date.parse(value);
}
export function validTimezone(zone: string): boolean { try { new Intl.DateTimeFormat('en', { timeZone:zone }).format(0); return true; } catch { return false; } }
export function dateInZone(value: string|number, zone: string): string {
  const parts = new Intl.DateTimeFormat('en-US',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(value));
  const get=(type:string)=>parts.find(p=>p.type===type)!.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function inspectExtension(node:Node,path:string,state:Record<string,Scalar>,add:(issue:Issue)=>void){const error=(code:string,sub:string,message:string)=>add({code,path:path+sub,message});
  if(isField(node)) {
    if(!Object.hasOwn(state,node.bind)) error('UNKNOWN_BIND','/bind','Field binding must name initial state.');
    if(node.type==='input'||node.type==='textarea') {
      if(node.minLength!==undefined&&node.maxLength!==undefined&&node.minLength>node.maxLength) error('FIELD_CONSTRAINT','','minLength must not exceed maxLength.');
      if(node.type==='input') {
        if(node.kind==='date') {
          if([node.placeholder,node.minLength,node.maxLength,node.min,node.max,node.step].some(value=>value!==undefined)) error('FIELD_CONSTRAINT','','Date inputs do not support text or numeric constraints.');
          for(const bound of ['minDate','maxDate'] as const) if(node[bound]!==undefined&&!validInputDate(node[bound])) error('FIELD_CONSTRAINT','/'+bound,'Date bounds must be real Gregorian dates in YYYY-MM-DD format, years 0001–9999.');
          if(node.minDate!==undefined&&node.maxDate!==undefined&&node.minDate>node.maxDate) error('FIELD_CONSTRAINT','','minDate must not exceed maxDate.');
        } else if(node.minDate!==undefined||node.maxDate!==undefined) error('FIELD_CONSTRAINT','','Only date inputs use minDate/maxDate.');
        if(node.kind==='checkbox' && [node.placeholder,node.minLength,node.maxLength,node.min,node.max,node.step].some(value=>value!==undefined)) error('FIELD_CONSTRAINT','','Checkbox does not support text or numeric constraints.');
        if(node.kind==='number') {
          if(node.min!==undefined&&node.max!==undefined&&(node.min>node.max||!Number.isFinite(node.max-node.min))) error('FIELD_CONSTRAINT','','Numeric bounds must be ordered with a finite span.');
          if(node.minLength!==undefined||node.maxLength!==undefined) error('FIELD_CONSTRAINT','','Numeric inputs use min/max/step rather than text lengths.');
        } else if(node.min!==undefined||node.max!==undefined||node.step!==undefined) error('FIELD_CONSTRAINT','','Only numeric inputs use min/max/step.');
      }
    } else {
      const seen=new Set<Scalar>();
      for(const [i,option] of node.options.entries()) {
        if(seen.has(option.value)) error('DUPLICATE_OPTION',`/options/${i}/value`,'Option values must be unique.');seen.add(option.value);
        if(typeof option.value!==typeof state[node.bind]) error('INPUT_TYPE',`/options/${i}/value`,'Options must preserve the binding type.');
      }
    }
  }
  if(node.type==='form') {
    const visit=(n:Node)=>{if(n.type==='form')error('NESTED_FORM','/children','Forms cannot be nested.');if(n.type==='tab-group')error('TAB_FORM','/children','Place a complete form inside a tab panel, rather than splitting one form across hidden panels.');if('children'in n)n.children.forEach(visit);if(n.type==='list')n.items.forEach(x=>{if(x&&typeof x==='object'&&'type'in x)visit(x as Node);});};
    node.children.forEach(visit);
  }
  if(node.type==='chart') {
    const scale=node.xScale??'category';
    if(node.xMin!==undefined&&node.xMax!==undefined&&(!(node.xMin<node.xMax)||!Number.isFinite(node.xMax-node.xMin))) error('CHART_BOUNDS','','xMin must be smaller than xMax with a finite span.');
    if(scale==='category'&&(node.xMin!==undefined||node.xMax!==undefined)) error('CHART_AXIS','','Category axes cannot have numeric bounds.');
    if(node.timezone&&!validTimezone(node.timezone)) error('TIMEZONE','/timezone','Use a recognized IANA time zone.');
    if(node.kind==='scatter'&&scale==='category') error('CHART_AXIS','/xScale','Scatter requires an explicit linear or time xScale.');
    if((node.kind==='donut'||node.kind==='pie')&&(node.series.length!==1||scale!=='category'||node.xMin!==undefined||node.xMax!==undefined||node.yMin!==undefined||node.yMax!==undefined)) error(node.kind==='pie'?'CHART_PIE':'CHART_DONUT','',`${node.kind==='pie'?'Pie':'Donut'} uses one nonnegative series, category labels and no Cartesian bounds.`);
  }
  if(node.type==='weather') {
    if(!validTimezone(node.location.timezone)) error('TIMEZONE','/location/timezone','Use a recognized IANA time zone.');
    if(!Number.isFinite(timestamp(node.updatedAt))) error('WEATHER_DATE','/updatedAt','updatedAt must be a valid timestamp with offset.');
    if(!Number.isFinite(timestamp(node.current.time))) error('WEATHER_DATE','/current/time','Current observation needs a valid timestamp with offset.');
    let previous='';
    node.daily.forEach((d,i)=>{
      if(!validDate(d.date)||d.date<=previous) error('WEATHER_DATE',`/daily/${i}/date`,'Daily dates must be valid, unique and increasing.');previous=d.date;
      if(d.low!==null&&d.high!==null&&d.low>d.high) error('WEATHER_RANGE',`/daily/${i}`,'Daily low must not exceed high.');
    });
    let prior=-Infinity;
    node.hourly.forEach((h,i)=>{const ms=timestamp(h.time);if(!Number.isFinite(ms)||ms<=prior)error('WEATHER_DATE',`/hourly/${i}/time`,'Hourly timestamps must be valid, unique and increasing.');prior=ms;});
    if(node.initialDate!==undefined&&(!validDate(node.initialDate)||!node.daily.some(d=>d.date===node.initialDate))) error('WEATHER_DATE','/initialDate','Initial date must name a provided daily forecast.');
    const temperatures=[node.current.temperature,node.current.feelsLike,...node.daily.flatMap(d=>[d.low,d.high]),...node.hourly.map(h=>h.temperature)];
    const absoluteZero=node.units.temperature==='celsius'?-273.15:-459.67;
    if(temperatures.some(n=>typeof n==='number'&&(n<absoluteZero||n>1000))) error('WEATHER_RANGE','','Temperatures must be physically valid and suitable for a weather display.');
  }
}
/** Stable finite domains, including a single extreme value; bounds never turn into NaN SVG coordinates. */
export function chartXDomain(values:readonly number[],min?:number,max?:number,time=false):[number,number]{
  let low=min??Math.min(...values),high=max??Math.max(...values);if(!values.length)return[0,1];
  if(low===high){const offset=time?3_600_000:Math.max(1,Math.abs(low)*.05),limit=time?8.64e15:Number.MAX_VALUE;
    if(min===undefined)low=Math.max(-limit,low-offset);if(max===undefined)high=Math.min(limit,high+offset);
  }return[low,high];
}

export function fieldTypeIssue(node: FieldNode, value: Scalar|undefined, path:string):Issue|undefined {
  const expected=node.type==='input'&&node.kind==='checkbox'?'boolean':node.type==='input'&&node.kind==='number'?'number':node.type==='radio'||node.type==='segmented'?typeof node.options[0].value:'string';
  if(typeof value!==expected) return {code:'INPUT_TYPE',path,message:`Field binding must be ${expected}.`};
  if(node.type==='input'&&node.kind==='date'&&value!==''&&!validInputDate(value as string)) return {code:'INPUT_DATE',path,message:'Date binding must be empty or a real Gregorian date in YYYY-MM-DD format, years 0001–9999.'};
  if((node.type==='radio'||node.type==='segmented')&&value!==''&&!node.options.some(o=>o.value===value)) return {code:'INPUT_OPTION',path,message:'Choice binding must match an option or an empty string.'};
}

/** Y starts at zero by default without imposing an arbitrary one-unit minimum span. */
export function chartYDomain(values:readonly number[],min?:number,max?:number):[number,number]{
 const low=min??Math.min(0,...values),high=max??Math.max(0,...values);
 return low===0&&high===0&&min===undefined&&max===undefined?[0,1]:[low,high];
}
