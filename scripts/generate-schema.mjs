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
// Finite supplied agenda labels; semantic validation checks real dates and time ordering.
const agendaDate = { type:'string', pattern:'^(?!0000)\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])$' };
const agendaTime = { type:'string', pattern:'^(?:[01]\\d|2[0-3]):[0-5]\\d$' };
defs.AgendaEvent = object({ id:key, date:agendaDate, title:short, start:agendaTime, end:agendaTime, location:string(500), description:string(2000), status:choice('planned','cancelled'), url:string(2048,1) }, ['id','date','title']);
defs.AgendaEvent.oneOf = [
  object(defs.AgendaEvent.properties, ['start']),
  object({ ...defs.AgendaEvent.properties, start:false, end:false })
];
node('agenda', { label:short, description:string(2000), events:array(ref('AgendaEvent'),0,100) }, ['label','events']);
// Supplied, literal person information only; semantic checks own IDs and URL policy.
defs.PersonFact = object({ id:key, label:short, value:string(2000,1) }, ['id','label','value']);
defs.PersonLink = object({ id:key, label:short, url:string(2048,1) }, ['id','label','url']);
defs.PersonSource = object({ label:short, url:string(2048,1) }, ['label']);
node('person-profile', { name:short, role:short, organization:short, location:short, biography:string(6000), expanded:bool, facts:array(ref('PersonFact'),0,12), links:array(ref('PersonLink'),0,8), source:ref('PersonSource') }, ['name']);
// Original finite article supplied by the author; no ingestion, verification or runtime state.
node('news-article', { headline:string(300,1), source:object({label:short,url:string(2048,1)},['label']), summary:string(4000), author:short, published:agendaDate, paragraphs:array(string(4000,1),0,30), expanded:bool, tags:array(string(40,1),0,8) }, ['headline','source']);
// A finite supplied collection, with explicit nullable ratings and strict calendar labels.
defs.ReviewRecord = object({ id:{...key,pattern:'^[A-Za-z_][A-Za-z0-9_.-]{0,79}$(?![\\s\\S])'}, author:short, body:string(4000,1), rating:{anyOf:[integer(1,5),{type:'null'}]}, date:{...agendaDate,minLength:10,maxLength:10}, title:short, url:string(2048,1) }, ['id','author','body','rating']);
defs.ReviewSource = object({label:short,url:string(2048,1)}, ['label']);
node('entity-reviews', {label:short,description:string(2000),source:ref('ReviewSource'),items:array(ref('ReviewRecord'),0,50)}, ['label','items']);
// Supplied venue wall times only; semantic checks enforce dates and unique choices.
defs.RestaurantAvailabilitySlot = object({id:key,date:{...agendaDate,minLength:10,maxLength:10},time:{...agendaTime,minLength:5,maxLength:5},available:bool},['id','date','time','available']);
defs.RestaurantAvailabilitySource = object({label:short,url:string(2048,1)},['label']);
node('restaurant-availability',{title:short,venue:short,partySize:integer(1,20),timeZoneLabel:string(100,1),description:string(2000),source:ref('RestaurantAvailabilitySource'),slots:array(ref('RestaurantAvailabilitySlot'),0,100)},['title','venue','partySize','timeZoneLabel','slots']);
// Original bounded local onboarding selection; no account/provider action.
defs.OnboardingOption = object({id:{...key,pattern:'^[A-Za-z_][A-Za-z0-9_.-]{0,79}$(?![\\s\\S])'},label:short,description:string(1000)},['id','label']);
node('onboarding-selection',{label:short,description:string(2000),options:array(ref('OnboardingOption'),2,12),mode:choice('single','multiple'),initial:array(key,0,12),minimum:integer(0,12),maximum:integer(1,12),disabled:bool,continueLabel:short},['label','options']);
defs.OnboardingSelectionNode.oneOf=[object({...defs.OnboardingSelectionNode.properties,mode:{const:'single'},initial:array(key,0,1),minimum:integer(0,1),maximum:{const:1}}),object({...defs.OnboardingSelectionNode.properties,mode:{const:'multiple'}},['mode'])];
// Original finite supplied-place and media contracts; no lookup or location services.
const suppliedKey = {...key, pattern:'^[A-Za-z_][A-Za-z0-9_.-]{0,79}$(?![\\s\\S])'};
// Original bounded local poll composer; incomplete text is a valid initial draft.
defs.PollDraftOption=object({id:suppliedKey,label:string(200)},['id','label']);
node('create-interactive-poll',{label:short,description:string(2000),question:string(500),options:array(ref('PollDraftOption'),2,8),multiple:bool,disabled:bool},['label','options']);
defs.LocationChoiceOption = object({id:suppliedKey,label:short,address:string(1000),description:string(1000)},['id','label']);
defs.LocationChoiceSource = object({label:short,url:string(2048,1)},['label']);
node('location-choice-request',{label:short,description:string(2000),options:array(ref('LocationChoiceOption'),1,12),source:ref('LocationChoiceSource')},['label','options']);
defs.BusinessGalleryImage = object({id:suppliedKey,src:string(500000,1),alt:string(2000,1),caption:string(2000)},['id','src','alt']);
node('business-gallery',{label:short,description:string(2000),images:array(ref('BusinessGalleryImage'),1,12)},['label','images']);
// Original supplied travel/events contracts. Civil validity and instant ordering are semantic.
const travelDate = {type:'string',pattern:'^[1-9]\\d{3}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])$(?![\\s\\S])',minLength:10,maxLength:10};
const travelTime = {type:'string',pattern:'^(?:[01]\\d|2[0-3]):[0-5]\\d$(?![\\s\\S])',minLength:5,maxLength:5};
const flightAt = {type:'string',pattern:'^[1-9]\\d{3}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])T(?:[01]\\d|2[0-3]):[0-5]\\d(?:Z|[+-](?:(?:0\\d|1[0-3]):[0-5]\\d|14:00))$(?![\\s\\S])',minLength:17,maxLength:22};
defs.TravelEventSource = object({label:short,url:string(2048,1)},['label','url']);
defs.FlightEndpoint = object({airport:{type:'string',pattern:'^[A-Z]{3}$(?![\\s\\S])'},at:flightAt,name:short},['airport','at']);
defs.FlightLeg = object({id:suppliedKey,carrier:short,number:short,departure:ref('FlightEndpoint'),arrival:ref('FlightEndpoint'),cabin:short},['id','carrier','number','departure','arrival']);
node('flight-option',{label:short,optionId:suppliedKey,legs:array(ref('FlightLeg'),1,8),description:string(2000),price:object({amount:{type:'number',minimum:0,maximum:1e12},currency:{type:'string',pattern:'^[A-Z]{3}$(?![\\s\\S])'}},['amount','currency']),note:string(2000),source:ref('TravelEventSource')},['label','optionId','legs']);
defs.ArtistEvent = object({id:suppliedKey,title:short,date:travelDate,venue:short,start:travelTime,timeZoneLabel:short,location:short,description:string(2000),url:string(2048,1)},['id','title','date','venue']);
node('artist-upcoming-events',{artist:short,label:short,events:array(ref('ArtistEvent'),0,40),description:string(2000),source:ref('TravelEventSource')},['artist','events']);
// Original supplied tracker snapshots; operational state is never inferred or fetched.
defs.TrackerSource=object({label:short,url:string(2048,1)},['label','url']);
defs.PackageMilestone=object({id:suppliedKey,label:short,state:choice('complete','current','pending'),occurredAt:flightAt,location:short,description:string(2000)},['id','label','state']);
node('package-tracker',{label:short,description:string(2000),carrier:short,trackingId:short,status:choice('pre-transit','in-transit','out-for-delivery','delivered','exception','unknown'),observedAt:flightAt,destination:short,expectedDelivery:short,milestones:array(ref('PackageMilestone'),0,40),source:ref('TrackerSource')},['label','carrier','trackingId','status','observedAt','milestones']);
defs.TrackedFlightEndpoint=object({airport:{type:'string',pattern:'^[A-Z]{3}$(?![\\s\\S])',minLength:3,maxLength:3},name:short,scheduledAt:flightAt,estimatedAt:flightAt,actualAt:flightAt,terminal:short,gate:short},['airport','scheduledAt']);
defs.FlightUpdate=object({id:suppliedKey,at:flightAt,message:short,kind:choice('information','change','disruption'),description:string(2000)},['id','at','message','kind']);
node('flight-tracker',{label:short,description:string(2000),carrier:short,flightNumber:short,status:choice('scheduled','boarding','departed','landed','cancelled','diverted','unknown'),observedAt:flightAt,departure:ref('TrackedFlightEndpoint'),arrival:ref('TrackedFlightEndpoint'),updates:array(ref('FlightUpdate'),0,40),source:ref('TrackerSource')},['label','carrier','flightNumber','status','observedAt','departure','arrival','updates']);
// Original supplied plain-text mail and finite file navigation; no provider/filesystem access.
defs.ReaderSource=object({label:short,url:string(2048,1)},['label','url']);
defs.EmailPreviewPerson=object({name:short,address:string(320,1)},['address']);
const readerMetadata={sizeBytes:integer(0,1e12),mediaType:short,description:string(2000)};
defs.EmailPreviewAttachment=object({id:suppliedKey,name:short,...readerMetadata,url:string(2048,1)},['id','name']);
node('email-preview',{subject:string(500,1),from:ref('EmailPreviewPerson'),to:array(ref('EmailPreviewPerson'),0,40),cc:array(ref('EmailPreviewPerson'),0,40),sentAt:flightAt,body:string(20000),quotedText:string(20000),attachments:array(ref('EmailPreviewAttachment'),0,20),source:ref('ReaderSource')},['subject','from','to','body']);
const fileEntryCommon={id:suppliedKey,name:short,parentId:{anyOf:[suppliedKey,{type:'null'}]},description:string(2000)};
defs.FileNavFolder=object({...fileEntryCommon,kind:{const:'folder'}},['id','name','kind']);
defs.FileNavFile=object({...fileEntryCommon,...readerMetadata,kind:{const:'file'},category:choice('document','image','audio','video','archive','other'),modifiedAt:flightAt,url:string(2048,1)},['id','name','kind']);
defs.FileNavEntry={oneOf:[ref('FileNavFolder'),ref('FileNavFile')]};
node('file-nav-list',{label:short,description:string(2000),entries:array(ref('FileNavEntry'),0,120),initialFolderId:suppliedKey,source:ref('ReaderSource')},['label','entries']);
// Original supplied job and product decision cards; all actions are explicitly local.
defs.DecisionSource=object({label:short,url:string(2048,1)},['label','url']);
defs.SuppliedPrice=object({amount:{type:'number',minimum:0,maximum:1e12},currency:{type:'string',pattern:'^[A-Z]{3}$(?![\\s\\S])',minLength:3,maxLength:3}},['amount','currency']);
defs.JobSalary=object({minimum:{type:'number',minimum:0,maximum:1e12},maximum:{type:'number',minimum:0,maximum:1e12},currency:{type:'string',pattern:'^[A-Z]{3}$(?![\\s\\S])',minLength:3,maxLength:3},period:choice('hour','month','year')},['minimum','maximum','currency','period']);
defs.SuppliedJob=object({id:suppliedKey,title:short,organization:short,location:short,workplace:choice('remote','hybrid','onsite','unknown'),employment:choice('full-time','part-time','contract','internship','unknown'),description:string(5000),salary:ref('JobSalary'),postedDate:travelDate,deadlineDate:travelDate,url:string(2048,1)},['id','title','organization','location','workplace','employment']);
node('jobs',{label:short,description:string(2000),jobs:array(ref('SuppliedJob'),0,40),source:ref('DecisionSource')},['label','jobs']);
defs.ProductVariant=object({id:suppliedKey,label:short,availability:choice('available','unavailable','unknown'),price:ref('SuppliedPrice')},['id','label','availability']);
node('product-card',{productId:suppliedKey,name:short,brand:short,seller:short,description:string(5000),availability:choice('available','unavailable','unknown'),price:ref('SuppliedPrice'),variants:array(ref('ProductVariant'),0,12),initialVariantId:suppliedKey,initialQuantity:integer(1,20),disabled:bool,image:object({src:string(300000,1),alt:string(2000,1)},['src','alt']),source:ref('DecisionSource')},['productId','name','availability']);
// Original supplied local-business hours and restaurant dining-review reader.
defs.PlaceSource=object({label:short,url:string(2048,1)},['label','url']);
const placeDay=choice('monday','tuesday','wednesday','thursday','friday','saturday','sunday');
const placeTime={type:'string',pattern:'^(?:[01][0-9]|2[0-3]):[0-5][0-9]$(?![\\s\\S])'};
defs.BusinessHoursPeriod=object({opens:placeTime,closes:placeTime,nextDay:bool},['opens','closes']);
defs.BusinessHoursDay=object({day:placeDay,status:choice('hours','closed','unknown'),periods:array(ref('BusinessHoursPeriod'),0,4),note:string(1000)},['day','status','periods']);
node('local-business',{name:short,category:short,address:string(1000,1),description:string(3000),phoneLabel:short,timezoneLabel:short,hours:array(ref('BusinessHoursDay'),0,7),initialDay:placeDay,services:array(short,0,20),accessibility:array(short,0,20),source:ref('PlaceSource')},['name','category','address','hours']);
const diningScore={type:'number',minimum:0,maximum:5};
defs.DiningReview=object({id:suppliedKey,author:short,text:string(6000,1),rating:diningScore,food:diningScore,service:diningScore,atmosphere:diningScore,visitDate:travelDate,occasion:choice('breakfast','lunch','dinner','other','unknown'),dishes:array(short,0,12),source:ref('PlaceSource')},['id','author','text','occasion']);
node('restaurant-reviews',{label:short,restaurantName:short,reviews:array(ref('DiningReview'),0,60),description:string(2000),source:ref('PlaceSource')},['label','restaurantName','reviews']);
// Original local flight search intent and supplied result exploration.
const discoveryAirport={type:'string',pattern:'^[A-Z]{3}$(?![\\s\\S])',minLength:3,maxLength:3};
defs.DiscoveryAirport=object({code:discoveryAirport,label:short},['code','label']);
node('flight-search-form',{label:short,description:string(2000),airports:array(ref('DiscoveryAirport'),2,80),initialOrigin:discoveryAirport,initialDestination:discoveryAirport,initialDepartureDate:travelDate,initialReturnDate:travelDate,initialTravelers:integer(1,9),disabled:bool},['label','airports']);
defs.DiscoveryFlightResult=object({id:suppliedKey,label:short,legs:array(ref('FlightLeg'),1,8),price:ref('SuppliedPrice'),note:string(2000),source:ref('TravelEventSource')},['id','label','legs']);
node('flight-results',{label:short,description:string(2000),results:array(ref('DiscoveryFlightResult'),0,40),source:ref('TravelEventSource')},['label','results']);
// Original bounded reader for supplied discussion content; no provider integration.
const threadScore = { anyOf: [integer(-1000000000, 1000000000), { type:'null' }] };
defs.ThreadComment = object({ id:key, author:short, body:string(4000,1), score:threadScore, replies:array(ref('ThreadComment'),0,20) }, ['id','author','body']);
node('reddit-thread-card', { title:string(300,1), author:short, body:string(6000), source:object({label:short,url:string(2048,1)},['label']), comments:array(ref('ThreadComment'),0,50), community:short, score:threadScore, expanded:bool }, ['title','author','body','source','comments']);
node('markdown', { value: string() }, ['value']);
node('writing-block', { label: short, value: string(), editable: bool, note: string(1000) }, ['label','value']);
// Original supplied envelope and local plan review; no services or execution.
node('email-draft', { label:short, subject:string(300), body:string(), to:array(string(320,1),0,20), cc:array(string(320,1),0,20), note:string(1000), editable:bool }, ['label','subject','body','to']);
defs.TaskReviewStep = object({id:key,title:short,description:string(2000),details:string(6000),reviewed:bool}, ['id','title']);
node('task-expansion-card', {title:short,summary:string(2000),steps:array(ref('TaskReviewStep'),1,20),disabled:ref('Value')}, ['title','steps']);
node('code', { value: string(), language: short, inline: bool, copy: bool, highlight: bool }, ['value']);
// Inline code cannot opt into block controls. Keep exact disjoint structural
// branches so validator, generated public types and all domain subsets agree.
defs.CodeNode.oneOf = [
  object({ ...defs.CodeNode.properties, inline: { const: true }, copy: { const: false }, highlight: { const: false } }, ['inline']),
  object({ ...defs.CodeNode.properties, inline: { const: false } })
];
node('math', { latex: string(6000, 1), block: bool }, ['latex']);
node('badge', { value: ref('Value'), color }, ['value']);
node('divider');
node('spacer', { height: integer(0, 200) });
node('link', { value: ref('Value'), href: string(2048, 1) }, ['value', 'href']);
node('favicon',{label:short,src:string(12000,1),fallback:string(2,1),size:choice('sm','md','lg')},['label']);
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
node('flow', { children: array(ref('Node'), 1, 50), gap: choice('none','sm','md','lg'), align: choice('start','center','end'), justify: choice('start','center','end','between') }, ['children']);
node('icon', { name: choice('info','check','warning','error','plus','minus','arrow-left','arrow-right','external-link','clock'), size: choice('sm','md','lg'), tone: choice('default','muted','info','success','warning','danger'), label: short }, ['name']);
node('pulse-indicator', { label: short, status: choice('idle','busy','success','warning','error'), animate: bool }, ['label','status']);
node('loading', { label: short, progress: ref('Value'), size: choice('sm','md','lg'), showValue: bool }, ['label']);
node('loading-block', { label: short, shape: choice('text','card','circle'), lines: integer(1,10), animate: bool }, ['label']);
const { lines: _textOnlyLines, ...nonTextLoadingBlock } = defs.LoadingBlockNode.properties;
defs.LoadingBlockNode.oneOf = [
  object({ ...defs.LoadingBlockNode.properties, shape: { const: 'text' } }),
  object({ ...nonTextLoadingBlock, shape: choice('card','circle') }, ['shape'])
];
const sourceFields = { title: string(300,1), url: string(2048,1), publisher: string(200,1), description: string(1000,1) };
defs.SourceRecord = object(sourceFields, ['title','url']);
node('citation', { ...sourceFields, number: integer(1,999) }, ['title','url']);
node('web-link-cards', { label: short, items: array(ref('SourceRecord'),1,20) }, ['label','items']);
// Original supplied prompt suggestions: explicit DOM handoff, no generated/chat content.
defs.PromptSuggestion=object({id:key,text:string(2000,1)},['id','text']);
node('prompt-suggestions',{label:short,description:string(1000),items:array(ref('PromptSuggestion'),1,12),initialVisible:integer(1,12)},['label','items']);
// Original bounded previews; no automatic playback or arbitrary animation payloads.
node('animate', { label:short, children:array(ref('Node'),0,50), effect:choice('fade','rise'), duration:integer(100,1000), disabled:bool }, ['label','children']);
node('celebration', { label:short, message:string(1000,1), duration:integer(300,1800), disabled:bool }, ['label','message']);
node('carousel', { children, label: short, controls: bool }, ['children']);
node('tab-panel', { label: short, disabled: bool, children }, ['id','label','children']);
node('tab-group', { label: short, initial: short, children: array(ref('TabPanelNode'),1,20) }, ['label','children']);
node('list', { ordered: bool, items: array({ anyOf: [ref('Value'), ref('Node')] }, 0, 100) }, ['items']);
defs.TableCellObject = object({ value: ref('Value'), rowSpan: integer(1, 200), colSpan: integer(1, 20), header: bool, scope: choice('row', 'col', 'rowgroup'), align }, ['value']);
defs.TableCell = { anyOf: [ref('Value'), ref('TableCellObject')] };
defs.TableSection = object({ kind: choice('head', 'body', 'foot'), rows: array(array(ref('TableCell'), 0, 20), 0, 200) }, ['kind', 'rows']);
// Original supplied-data menu. All records are finite, local and strictly declarative.
defs.MenuItem = object({id:key,name:short,description:string(2000),price:{anyOf:[{type:'number',minimum:0},{type:'null'}]},tags:array(string(40,1),0,8),status:choice('available','unavailable')},['id','name','price']);
defs.MenuSection = object({id:key,title:short,items:array(ref('MenuItem'),0,40)},['id','title','items']);
node('restaurant-menu',{title:short,description:string(2000),currency:{type:'string',pattern:'^[A-Z]{3}$'},source:object({label:short,url:string(2048,1)},['label']),sections:array(ref('MenuSection'),0,20)},['title','currency','sections']);
node('table', { columns: array(short, 1, 20), rows: array(array(ref('TableCell'), 0, 20), 0, 200), sections: array(ref('TableSection'), 1, 12), caption: string(), status: choice('ready', 'loading', 'error'), message: string() }, ['columns']);
defs.TableNode.oneOf = [object(defs.TableNode.properties, ['rows']), object(defs.TableNode.properties, ['sections'])];
node('metric', { variant: choice('plain', 'card'), label: short, value: ref('Value'), unit: short, hint: string(), precision: integer(0, 6), color }, ['label', 'value']);
node('metric-grid', { children: array(ref('Node'), 1, 12), columns: integer(1, 4) }, ['children']);
node('steps', { items: array(object({ title: short, detail: string(), latex: string() }, ['title']), 1, 20) }, ['items']);
node('callout', { value: string(), tone: choice('neutral', 'info', 'caution') }, ['value']);
node('label', { text: short, target: short }, ['text', 'target']);
node('slider', { label: short, bind: short, min: number, max: number, step: { ...number, exclusiveMinimum: 0 }, unit: short, marks: array(object({ value: number, label: string() }, ['value', 'label']), 0, 30) }, ['label', 'bind', 'min', 'max', 'step']);
defs.ChecklistItem=object({id:key,label:short,bind:key,hint:string(1000),disabled:ref('Value')},['id','label','bind']);
node('checklist',{label:short,items:array(ref('ChecklistItem'),0,50),disabled:ref('Value'),filter:bool,bulk:bool,emptyText:string(1000)},['label','items']);
node('rating', { label: short, bind: key, max: integer(2, 10), disabled: ref('Value'), clearable: bool, hint: string(1000) }, ['label', 'bind']);
node('toggle', { label: short, bind: short }, ['label', 'bind']);
node('select', { label: short, bind: short, options: array(object({ value: { anyOf: [string(), number] }, label: short }, ['value', 'label']), 1, 40) }, ['label', 'bind', 'options']);
const inputCommon = { label: short, bind: short, hint: string(), error: ref('Value'), required: bool, disabled: ref('Value') };
const inputOptions = array(object({ value: { anyOf: [string(), number] }, label: short, disabled: bool }, ['value', 'label']), 1, 40);
node('input', { ...inputCommon, kind: choice('text', 'number', 'email', 'checkbox', 'date'), minDate: { type: 'string', pattern: '^(?!0000)\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])$' }, maxDate: { type: 'string', pattern: '^(?!0000)\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])$' }, placeholder: string(200), min: number, max: number, step: { ...number, exclusiveMinimum: 0 }, minLength: integer(0, 12000), maxLength: integer(1, 12000) }, ['label', 'bind', 'kind'], 'forms');
// Date-only constraints remain separate from numeric/text constraints in schema and types.
defs.InputNode.oneOf = [
  object({ ...defs.InputNode.properties, kind: { const: 'date' }, ...Object.fromEntries(['placeholder', 'min', 'max', 'step', 'minLength', 'maxLength'].map(name => [name, false])) }),
  object({ ...defs.InputNode.properties, kind: choice('text', 'number', 'email', 'checkbox'), minDate: false, maxDate: false })
];
defs.InputNode.if = { properties: { kind: { const: 'checkbox' } }, required: ['kind'] };
defs.InputNode.then = { properties: Object.fromEntries(['placeholder', 'min', 'max', 'step', 'minLength', 'maxLength'].map(name => [name, false])) };
node('textarea', { ...inputCommon, placeholder: string(200), rows: integer(2, 20), minLength: integer(0, 12000), maxLength: integer(1, 12000) }, ['label', 'bind'], 'forms');
for (const name of ['radio', 'segmented']) node(name, { ...inputCommon, options: inputOptions }, ['label', 'bind', 'options'], 'forms');
node('field', { label: short, hint: string(), children: array(ref('Node'), 1, 20), disabled: ref('Value') }, ['label', 'children'], 'forms');
node('form', { label: short, children, submitLabel: short, cancelLabel: short, action: key, disabled: ref('Value'), successMessage: string(), errorMessage: string() }, ['label', 'children'], 'forms');
defs.ButtonAction = { oneOf: [
  object({ kind: { const: 'reset' } }, ['kind']),
  object({ kind: { const: 'set' }, bind: short, value: scalar }, ['kind','bind','value']),
  object({ kind: { const: 'host' }, name: key }, ['kind','name'])
] };
node('button', { label: short, action: ref('ButtonAction'), disabled: ref('Value'), tone: choice('default','primary','danger'), hint: string(1000) }, ['label','action']);
node('topology', { nodes: array(object({ id: short, label: short, subtitle: string() }, ['id', 'label']), 2, 24), links: array(object({ from: short, to: short, label: string(), load: ref('Value') }, ['from', 'to']), 1, 40), highlight: choice('max-load', 'none'), caption: string() }, ['nodes', 'links'], 'graphics');
node('chart', { kind: choice('line', 'bar', 'scatter', 'area', 'donut', 'pie'), xKey: short, xScale: choice('category', 'linear', 'time'), xLabel: short, xMin: number, xMax: number, timezone: short, data: array({ type: 'object', additionalProperties: ref('Value') }, 0, 300), series: array(object({ key: short, label: short, color: choice('blue', 'green', 'orange', 'red', 'purple', 'gray') }, ['key', 'label']), 1, 6), yMin: number, yMax: number, unit: string(), title: string(), note: string(), status: choice('ready', 'loading', 'error'), message: string() }, ['kind', 'xKey', 'data', 'series'], 'charts');
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
// Original finite sentence-embedded fill-in practice. Answer data is public teaching material.
defs.FillBlankPart = { anyOf: [string(2000), object({blank:key}, ['blank'])] };
defs.FillBlankEntry = object({id:key,label:short,answers:array(string(200,1),1,8),hint:string(1000),explanation:string(2000)},['id','label','answers']);
node('fill-blank',{title:short,description:string(2000),parts:array(ref('FillBlankPart'),1,50),blanks:array(ref('FillBlankEntry'),1,12)},['title','parts','blanks'],'learning');
// Original finite local sentence-builder; answers are public authored teaching data.
defs.SentenceToken=object({id:key,text:short},['id','text']);
node('sentence-builder',{title:short,prompt:string(2000),tokens:array(ref('SentenceToken'),1,30),answer:array(key,1,30),joiner:choice(' ',''),explanation:string(2000)},['title','tokens','answer'], 'learning');
// Finite supplied vocabulary; no generated meaning or remote lookup.
defs.VocabSense=object({id:key,meaning:string(2000,1),translation:string(1000),examples:array(string(2000,1),0,5)},['id','meaning']);
node('vocab-card',{term:short,languageLabel:short,pronunciation:string(500,1),partOfSpeech:short,senses:array(ref('VocabSense'),1,10)},['term','senses'],'learning');
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
// Bounded, supplied ledger views. No provider/account operations or implicit FX.
const ledgerAmount = {type:'number',minimum:0,maximum:1e12};
const ledgerCurrency = {type:'string',pattern:'^[A-Z]{3}$(?![\\s\\S])',minLength:3,maxLength:3};
defs.LedgerSource = object({label:short,url:string(2048,1)},['label','url']);
defs.LedgerAccount = object({id:key,name:short,amount:{anyOf:[ledgerAmount,{type:'null'}]},currency:ledgerCurrency,category:short,note:string(2000)},['id','name','amount','currency']);
defs.LedgerTransaction = object({id:key,date:{type:'string',pattern:'^[1-9]\\d{3}-\\d{2}-\\d{2}$'},description:string(1000,1),amount:ledgerAmount,currency:ledgerCurrency,direction:choice('debit','credit'),status:choice('pending','posted'),counterparty:short,note:string(2000)},['id','date','description','amount','currency','direction']);
const ledgerCommon = {label:short,description:string(2000),source:ref('LedgerSource')};
node('asset-distribution',{...ledgerCommon,observedAt:short,accounts:array(ref('LedgerAccount'),0,40)},['label','accounts'],'finance');
node('transaction-list',{...ledgerCommon,transactions:array(ref('LedgerTransaction'),0,100)},['label','transactions'],'finance');
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
