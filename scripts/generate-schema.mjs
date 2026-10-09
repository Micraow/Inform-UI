/** Project-owned iui/1 schema construction. No external runtime code is used. */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { compile } from 'json-schema-to-typescript';
import { emitSchemaSubsets } from './schema-subsets.mjs';

const string = (maxLength = 12000, minLength) => ({ type: 'string', ...(minLength === undefined ? {} : { minLength }), maxLength });
const short = string(200, 1);
const number = { type: 'number' };
const bool = { type: 'boolean' };
const integer = (minimum, maximum) => ({ type: 'integer', minimum, maximum });
const choice = (...values) => ({ enum: values });
const array = (items, minItems = 0, maxItems = 500) => ({ type: 'array', items, minItems, maxItems });
const object = (properties, required = []) => ({ type: 'object', properties, required, additionalProperties: false });
const ref = (name) => ({ $ref: `#/$defs/${name}` });
const key = { type: 'string', pattern: '^[A-Za-z_][A-Za-z0-9_.-]{0,79}$' };
const color = choice('default', 'secondary', 'tertiary', 'success', 'warning', 'danger', 'info', 'accent');
const weight = choice('normal', 'medium', 'semibold', 'bold');
const align = choice('start', 'center', 'end');
const children = array(ref('Node'));
const scalar = { anyOf: [string(), number, bool] };
const nodes = [];
const defs = {};
const owners = {};
const node = (name, props = {}, required = [], group = 'base') => {
  owners[name] = group;
  const nameInSchema = name.split('-').map((s) => s[0].toUpperCase() + s.slice(1)).join('') + 'Node';
  defs[nameInSchema] = object({ type: { const: name }, id: short, ...props }, ['type', ...required]);
  nodes.push(ref(nameInSchema));
};

defs.Value = { oneOf: [string(), number, bool, { type: 'null' }, object({ $: { ...key, minLength: 1 } }, ['$']), object({ op: choice('add', 'sub', 'mul', 'div', 'max', 'min', 'round', 'abs', 'clamp', 'gt', 'lt', 'eq', 'if', 'format'), args: array(ref('Value'), 1, 12) }, ['op', 'args'])] };
const textStyle = { color, weight, align, italic: bool, underline: bool, strike: bool, shimmer: bool };
defs.TextRun = object({ value: ref('Value'), bold: bool, italic: bool, underline: bool, strike: bool, code: bool, href: string(2048, 1) }, ['value']);
node('text', { value: ref('Value'), runs: array(ref('TextRun'), 1, 100), ...textStyle });
defs.TextNode.oneOf = [object(defs.TextNode.properties, ['value']), object(defs.TextNode.properties, ['runs'])];
for (const name of ['title', 'caption']) node(name, { value: ref('Value'), ...textStyle, ...(name === 'title' ? { level: integer(1, 3) } : {}) }, ['value']);
node('markdown', { value: string() }, ['value']);
node('code', { value: string(), language: short, inline: bool }, ['value']);
node('math', { latex: string(6000, 1), block: bool }, ['latex']);
node('badge', { value: ref('Value'), color }, ['value']);
node('divider');
node('spacer', { height: integer(0, 200) });
node('link', { value: ref('Value'), href: string(2048, 1) }, ['value', 'href']);
node('image', { src: string(500000, 1), alt: string(), aspectRatio: choice('1:1', '4:3', '16:9', '3:4'), fit: choice('cover', 'contain') }, ['src', 'alt']);
const layout = { gap: integer(0, 16), padding: integer(0, 16), radius: choice('none', 'sm', 'md', 'lg', 'xl', '2xl'), border: bool, background: choice('none', 'surface', 'surface-secondary', 'surface-tertiary', 'success-soft', 'danger-soft', 'info-soft'), align: choice('start', 'center', 'end', 'stretch'), justify: choice('start', 'center', 'end', 'between', 'around'), width: { anyOf: [integer(30, 1400), choice('100%', 'auto')] }, children };
for (const name of ['box', 'card', 'row', 'col', 'grid']) node(name, { ...layout, ...(name === 'grid' ? { columns: integer(1, 6), mobileColumns: integer(1, 6) } : {}) }, ['children']);
node('grid-item', { colSpan: integer(1, 6), rowSpan: integer(1, 20), mobileColSpan: integer(1, 6), children: array(ref('Node'), 1, 30) }, ['children']);
node('blockquote', { children: array(ref('Node'), 1, 30), attribution: string(500), cite: string(2048, 1) }, ['children']);
node('section', { heading: string(), children }, ['children']);
node('figure', { children, caption: string() }, ['children']);
node('details', { summary: short, children }, ['summary', 'children']);
node('tooltip', { label: short, value: string(2000), placement: choice('top', 'bottom') }, ['label', 'value']);
node('popover', { label: short, title: short, children: array(ref('Node'), 1, 20), placement: choice('top', 'bottom') }, ['label', 'children']);
node('carousel', { children }, ['children']);
node('list', { ordered: bool, items: array({ anyOf: [ref('Value'), ref('Node')] }, 0, 100) }, ['items']);
defs.TableCellObject = object({ value: ref('Value'), rowSpan: integer(1, 200), colSpan: integer(1, 20), header: bool, scope: choice('row', 'col', 'rowgroup'), align }, ['value']);
defs.TableCell = { anyOf: [ref('Value'), ref('TableCellObject')] };
defs.TableSection = object({ kind: choice('head', 'body', 'foot'), rows: array(array(ref('TableCell'), 0, 20), 0, 200) }, ['kind', 'rows']);
node('table', { columns: array(short, 1, 20), rows: array(array(ref('TableCell'), 0, 20), 0, 200), sections: array(ref('TableSection'), 1, 12), caption: string(), status: choice('ready', 'loading', 'error'), message: string() }, ['columns']);
defs.TableNode.oneOf = [object(defs.TableNode.properties, ['rows']), object(defs.TableNode.properties, ['sections'])];
node('metric', { variant: choice('plain', 'card'), label: short, value: ref('Value'), unit: short, hint: string(), precision: integer(0, 6), color }, ['label', 'value']);
node('metric-grid', { children: array(ref('Node'), 1, 12), columns: integer(1, 4) }, ['children']);
node('steps', { items: array(object({ title: short, detail: string(), latex: string() }, ['title']), 1, 20) }, ['items']);
node('callout', { value: string(), tone: choice('neutral', 'info', 'caution') }, ['value']);
node('slider', { label: short, bind: short, min: number, max: number, step: { ...number, exclusiveMinimum: 0 }, unit: short, marks: array(object({ value: number, label: string() }, ['value', 'label']), 0, 30) }, ['label', 'bind', 'min', 'max', 'step']);
node('toggle', { label: short, bind: short }, ['label', 'bind']);
node('select', { label: short, bind: short, options: array(object({ value: { anyOf: [string(), number] }, label: short }, ['value', 'label']), 1, 40) }, ['label', 'bind', 'options']);
const inputCommon = { label: short, bind: short, hint: string(), error: ref('Value'), required: bool, disabled: ref('Value') };
const inputOptions = array(object({ value: { anyOf: [string(), number] }, label: short, disabled: bool }, ['value', 'label']), 1, 40);
node('input', { ...inputCommon, kind: choice('text', 'number', 'email'), placeholder: string(200), min: number, max: number, step: { ...number, exclusiveMinimum: 0 }, minLength: integer(0, 12000), maxLength: integer(1, 12000) }, ['label', 'bind', 'kind'], 'forms');
node('textarea', { ...inputCommon, placeholder: string(200), rows: integer(2, 20), minLength: integer(0, 12000), maxLength: integer(1, 12000) }, ['label', 'bind'], 'forms');
for (const name of ['radio', 'segmented']) node(name, { ...inputCommon, options: inputOptions }, ['label', 'bind', 'options'], 'forms');
node('field', { label: short, hint: string(), children: array(ref('Node'), 1, 20), disabled: ref('Value') }, ['label', 'children'], 'forms');
node('form', { label: short, children, submitLabel: short, cancelLabel: short, action: key, disabled: ref('Value'), successMessage: string(), errorMessage: string() }, ['label', 'children'], 'forms');
node('button', { label: short, action: object({ kind: choice('reset', 'set'), bind: short, value: scalar }, ['kind']) }, ['label', 'action']);
node('topology', { nodes: array(object({ id: short, label: short, subtitle: string() }, ['id', 'label']), 2, 24), links: array(object({ from: short, to: short, label: string(), load: ref('Value') }, ['from', 'to']), 1, 40), highlight: choice('max-load', 'none'), caption: string() }, ['nodes', 'links'], 'graphics');
node('chart', { kind: choice('line', 'bar', 'scatter', 'area', 'donut'), xKey: short, xScale: choice('category', 'linear', 'time'), xLabel: short, xMin: number, xMax: number, timezone: short, data: array({ type: 'object', additionalProperties: ref('Value') }, 0, 300), series: array(object({ key: short, label: short, color: choice('blue', 'green', 'orange', 'red', 'purple', 'gray') }, ['key', 'label']), 1, 6), yMin: number, yMax: number, unit: string(), title: string(), note: string(), status: choice('ready', 'loading', 'error'), message: string() }, ['kind', 'xKey', 'data', 'series'], 'charts');
const nullableNumber = { anyOf: [number, { type: 'null' }] };
const probability = { anyOf: [{ type: 'number', minimum: 0, maximum: 100 }, { type: 'null' }] };
const condition = choice('clear', 'partly-cloudy', 'cloudy', 'rain', 'snow', 'storm', 'fog', 'unknown');
const timestamp = { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}(?::\\d{2}(?:\\.\\d{1,3})?)?(?:Z|[+-]\\d{2}:\\d{2})$', maxLength: 40 };
const date = { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' };
// Original in-page time controls. No OS alarms, remote synchronization or persistence.
node('clock', { title: short, timezone: short, mode: choice('live', 'snapshot'), at: timestamp, hourCycle: choice('h12', 'h23'), seconds: bool }, ['timezone', 'mode'], 'time');
const { at: _snapshotOnly, ...liveClock } = defs.ClockNode.properties;
defs.ClockNode.oneOf = [
  object({ ...liveClock, mode: { const: 'live' } }, ['mode']),
  object({ ...defs.ClockNode.properties, mode: { const: 'snapshot' } }, ['mode', 'at'])
];
node('stopwatch', { title: short, elapsedMs: integer(0, 604800000), laps: bool }, [], 'time');
node('timer', { title: short, durationMs: integer(1, 604800000) }, ['durationMs'], 'time');
node('weather', { location: object({ name: short, timezone: short }, ['name', 'timezone']), updatedAt: timestamp, source: object({ label: short, url: string(2048), synthetic: bool }, ['label', 'synthetic']), units: object({ temperature: choice('celsius', 'fahrenheit') }, ['temperature']), current: object({ time: timestamp, temperature: nullableNumber, feelsLike: nullableNumber, condition, humidity: probability }, ['time', 'temperature', 'condition']), daily: array(object({ date, low: nullableNumber, high: nullableNumber, condition, precipitationProbability: probability }, ['date', 'low', 'high', 'condition', 'precipitationProbability']), 0, 16), hourly: array(object({ time: timestamp, temperature: nullableNumber, precipitationProbability: probability }, ['time', 'temperature', 'precipitationProbability']), 0, 384), initialDate: date, status: choice('ready', 'loading', 'error'), message: string() }, ['location', 'updatedAt', 'source', 'units', 'current', 'daily', 'hourly'], 'weather');

// Shared project-owned sports model. Data is supplied; no provider or league rules are inferred.
const sportsScore={anyOf:[integer(0,1000000),{type:'null'}]};
defs.SportsTeam=object({id:key,name:short,shortName:string(16,1),color:choice('blue','green','orange','red','purple','gray')},['id','name']);
defs.SportsGame=object({id:key,startAt:timestamp,homeTeam:key,awayTeam:key,status:choice('scheduled','live','final','postponed','cancelled'),homeScore:sportsScore,awayScore:sportsScore,period:short,clock:short,stage:short,venue:string(300),neutral:bool,winnerTeamId:key,detail:string(3000),periodScores:array(object({label:short,home:sportsScore,away:sportsScore},['label','home','away']),0,30),tieBreak:object({label:short,home:sportsScore,away:sportsScore},['label','home','away']),stats:array(object({label:short,home:{anyOf:[string(200),number,{type:'null'}]},away:{anyOf:[string(200),number,{type:'null'}]}},['label','home','away']),0,30)},['id','startAt','homeTeam','awayTeam','status','homeScore','awayScore']);
defs.SportsStanding=object({teamId:key,group:short,rank:integer(1,10000),played:sportsScore,won:sportsScore,drawn:sportsScore,lost:sportsScore,points:nullableNumber,for:sportsScore,against:sportsScore,note:string(500)},['teamId','rank','played','won','drawn','lost','points']);
defs.SportsData=object({league:object({id:key,name:short,sport:choice('football','basketball','baseball','hockey','other'),season:short},['id','name','sport']),timezone:short,updatedAt:timestamp,source:object({label:short,synthetic:bool,url:string(2048)},['label','synthetic']),teams:array(ref('SportsTeam'),0,100),games:array(ref('SportsGame'),0,300),standings:array(ref('SportsStanding'),0,100)},['league','timezone','updatedAt','source','teams','games']);
const sportsCommon={data:ref('SportsData'),status:choice('ready','loading','error'),message:string()};
node('sports-schedule',{...sportsCommon,initialDate:date,initialTeamId:key,initialStage:short},['data'], 'sports');
node('sports-scoreboard',{...sportsCommon,gameId:key},['data'], 'sports');
node('sports-standings',{...sportsCommon,initialTeamId:key,initialGroup:short},['data'], 'sports');
// Local learning components: supplied answers are teaching data, never secure exam secrets.
defs.QuizQuestion=object({id:key,kind:choice('single','multiple'),prompt:string(6000,1),latex:string(6000,1),choices:array(object({id:key,label:string(2000,1)},['id','label']),2,20),correct:array(key,1,20),explanation:string(6000),explanationLatex:string(6000,1),points:integer(1,100)},['id','kind','prompt','choices','correct','explanation']);
node('quiz',{title:short,description:string(),questions:array(ref('QuizQuestion'),0,100),status:choice('ready','loading','error'),message:string()},['title','questions'], 'learning');
defs.Flashcard=object({id:key,front:string(6000,1),back:string(6000,1),frontLatex:string(6000,1),backLatex:string(6000,1),hint:string(2000)},['id','front','back']);
node('flashcards',{title:short,description:string(),cards:array(ref('Flashcard'),0,100),status:choice('ready','loading','error'),message:string()},['title','cards'], 'learning');
// Supplied financial snapshots: no provider connection, trading action or implicit FX conversion.
const price={anyOf:[{type:'number',minimum:0},{type:'null'}]};
defs.FinanceSource=object({label:short,synthetic:bool,url:string(2048)},['label','synthetic']);
defs.FinanceInstrument=object({id:key,symbol:short,name:short,currency:{type:'string',pattern:'^[A-Z]{3}$'},exchange:short,timezone:short,asOf:timestamp,marketStatus:choice('open','closed','pre','post','halted','unknown'),delayMinutes:integer(0,10080),price,previousClose:price,history:array(object({time:timestamp,price},['time','price']),0,500)},['id','symbol','name','currency','timezone','asOf','marketStatus','delayMinutes','price','previousClose','history']);
defs.FinanceRange=object({id:key,label:short,from:timestamp,to:timestamp},['id','label','from','to']);
const financeCommon={title:short,source:ref('FinanceSource'),status:choice('ready','loading','error'),message:string()};
node('finance-quote',{...financeCommon,instrument:ref('FinanceInstrument')},['source','instrument'], 'finance');
node('finance-chart',{...financeCommon,instrument:ref('FinanceInstrument'),ranges:array(ref('FinanceRange'),0,12),initialRange:key},['source','instrument','ranges'], 'finance');
node('finance-comparison',{...financeCommon,instruments:array(ref('FinanceInstrument'),2,6),baselineAt:timestamp,timezone:short,ranges:array(ref('FinanceRange'),0,12),initialRange:key},['source','instruments','baselineAt','ranges'], 'finance');
node('finance-heatmap',{title:short,source:ref('FinanceSource'),asOf:timestamp,timezone:short,weightLabel:short,changeBasis:short,cells:array(object({id:key,symbol:short,name:short,sector:short,weight:price,price,currency:{type:'string',pattern:'^[A-Z]{3}$'},changePercent:nullableNumber,asOf:timestamp,marketStatus:choice('open','closed','pre','post','halted','unknown'),delayMinutes:integer(0,10080)},['id','symbol','name','sector','weight','price','currency','changePercent','asOf','marketStatus','delayMinutes']),0,200),initialSector:short,status:choice('ready','loading','error'),message:string()},['source','asOf','timezone','weightLabel','changeBasis','cells'], 'finance');
// Local conversion controls use factual unit definitions and caller-supplied exchange snapshots.
const unitRegistry=JSON.parse(await readFile(new URL('../src/data/units.json',import.meta.url),'utf8'));
const unitCode={enum:[...new Set(Object.values(unitRegistry).flatMap(category=>category.units.map(unit=>unit.id)))],description:Object.entries(unitRegistry).map(([name,category])=>name+': '+category.units.map(unit=>unit.id).join(', ')).join('; ')};
node('unit-converter',{title:short,category:choice('length','mass','temperature','speed','area','volume','time','pressure','data'),amount:number,from:unitCode,to:unitCode,precision:{...integer(1,12),description:'Maximum significant digits, default 8; raw values are retained.'},temperatureMode:{...choice('absolute','difference'),description:'Temperature only. Absolute includes scale offsets and must be >= 0 K; difference converts signed intervals without offsets.'}},['category','amount','from','to'], 'converters');
const currencyCode={type:'string',pattern:'^[A-Z]{3}$'};
node('currency-converter',{title:short,source:ref('FinanceSource'),asOf:timestamp,base:currencyCode,rates:array(object({currency:currencyCode,rate:{anyOf:[{type:'number',exclusiveMinimum:0},{type:'null'}],description:'Units of this currency per one base-currency unit; null means unavailable.'}},['currency','rate']),0,200),amount:number,from:currencyCode,to:currencyCode,precision:integer(1,12),status:choice('ready','loading','error'),message:string()},['source','asOf','base','rates','amount'], 'converters');
node('svg', { viewBox: { type: 'string', pattern: '^\\d+\\s+\\d+\\s+\\d+\\s+\\d+$' }, shapes: array(object({ tag: choice('rect', 'line', 'circle', 'path', 'text', 'polyline', 'polygon'), attrs: { type: 'object', maxProperties: 24, additionalProperties: { anyOf: [string(), number] } }, text: string() }, ['tag', 'attrs']), 1, 150), label: string() }, ['viewBox', 'shapes'], 'graphics');
node('native', { name: choice('box', 'row', 'col', 'grid', 'grid-item', 'card', 'text', 'title', 'caption', 'badge', 'divider', 'code', 'blockquote', 'bold', 'italic', 'underline', 'strikethrough', 'spacer', 'list', 'list-item', 'table', 'table-row', 'table-cell', 'flow', 'flow-item'), props: { ...object({ gap: integer(0, 16), padding: integer(0, 16), columns: integer(1, 6), radius: choice('none', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', 'full'), border: bool, color, size: choice('xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'), weight, align: choice('start', 'center', 'end', 'stretch'), justify: choice('start', 'center', 'end', 'between', 'around'), width: { anyOf: [integer(20, 1400), choice('100%', 'auto')] }, height: integer(0, 1400), maxWidth: integer(20, 1400), minWidth: integer(0, 1400), background: choice('surface', 'surface-secondary', 'surface-tertiary', 'none'), marker: choice('bullet', 'number', 'none'), variant: choice('soft', 'solid', 'outline', 'ghost'), pill: bool, textAlign: align }), maxProperties: 18 }, children }, ['name', 'children'], 'compatibility');
defs.Node = { oneOf: nodes };
const schema = { $schema: 'https://json-schema.org/draft/2020-12/schema', $id: 'urn:micraow:intelligent-ui:schema:iui:1', title: 'IUIDocument', description: 'The project-defined iui/1 wire contract. Semantic validation additionally enforces safe expressions, data and URLs. Native nodes are recognized but unsupported by the portable renderer.', ...object({ version: { const: 'iui/1' }, title: string(), description: string(), theme: choice('auto', 'light', 'dark'), state: { type: 'object', propertyNames: key, maxProperties: 80, additionalProperties: scalar }, computed: { type: 'object', propertyNames: key, maxProperties: 80, additionalProperties: ref('Value') }, body: array(ref('Node'), 1, 150) }, ['version', 'body']), $defs: defs };
const dir = fileURLToPath(new URL('../src/schema/', import.meta.url));
await mkdir(dir, { recursive: true });
await writeFile(`${dir}/iui.schema.json`, JSON.stringify(schema, null, 2) + '\n');
await emitSchemaSubsets(schema, owners, `${dir}/fragments`);
const types = await compile(schema, 'IUIDocument', { bannerComment: '/** Generated by scripts/generate-schema.mjs. Edit the generator, not this file. */', additionalProperties: false, strictIndexSignatures: false, maxItems: -1 });
await writeFile(`${dir}/document.d.ts`, types);
console.log(`Generated iui/1 schema and TypeScript declarations (${nodes.length} node types).`);
// Generate the validation function ahead of time: CSP-safe browsers never compile schemas.
const { default: Ajv2020 } = await import('ajv/dist/2020.js');
const { default: standaloneCode } = await import('ajv/dist/standalone/index.js');
const ajv = new Ajv2020({ allErrors: true, strict: true, code: { source: true, optimize: true }, ownProperties: true, discriminator: true });
const validationSchema = structuredClone(schema);
validationSchema.$defs.Node.type = "object";
validationSchema.$defs.Node.discriminator = { propertyName: 'type' };
const validate = ajv.compile(validationSchema);
await writeFile(`${dir}/validator.cjs`, '/* Generated by scripts/generate-schema.mjs. Do not edit. */\n' + standaloneCode(ajv, validate));
await writeFile(`${dir}/validator.d.cts`, "import type { ValidateFunction } from 'ajv';\ndeclare const validate: ValidateFunction;\nexport = validate;\n");
