import {travelDate,travelTime,flightAt} from './primitives.mjs';
import {suppliedKey} from './primitives.mjs';
import {agendaDate,agendaTime} from './primitives.mjs';
import {nullableNumber,probability,condition,timestamp,date} from './primitives.mjs';
import {suppliedLinkProps} from './modules/layout.mjs';
import {readFile} from 'node:fs/promises';
import {createDocumentSchema} from './envelope.mjs';
import {installSearchOnboardingSchema} from '../search-onboarding-schema.mjs';
import {promptChecklistSchema} from '../prompt-checklist-schema.mjs';
import {financeStatusSchema} from '../finance-status-schema.mjs';
import {recommendationCardSchema} from '../recommendation-card-schema.mjs';
import {installTransactionDetail} from '../transaction-detail-schema.mjs';
import {createSchemaRegistry} from './registry.mjs';
import {string,short,number,bool,integer,choice,array,object,ref,key,color,weight,align,children,scalar} from './primitives.mjs';

/** Legacy domains remain here until migrated; full order is preserved. */
export async function buildCanonicalSchema(){
const registry=createSchemaRegistry();
const {defs,node,owners,nodes}=registry;
registry.use('shared/value');
registry.use('foundations/text');
registry.use('content/supplied-records');
registry.use('choices/local');
registry.use('travel/snapshots');
registry.use('readers/supplied');
registry.use('decisions/supplied');
// Original local flight search intent and supplied result exploration.
const discoveryAirport={type:'string',pattern:'^[A-Z]{3}$(?![\\s\\S])',minLength:3,maxLength:3};
defs.DiscoveryAirport=object({code:discoveryAirport,label:short},['code','label']);
node('flight-search-form',{label:short,description:string(2000),airports:array(ref('DiscoveryAirport'),2,80),initialOrigin:discoveryAirport,initialDestination:discoveryAirport,initialDepartureDate:travelDate,initialReturnDate:travelDate,initialTravelers:integer(1,9),disabled:bool},['label','airports']);
defs.DiscoveryFlightResult=object({id:suppliedKey,label:short,legs:array(ref('FlightLeg'),1,8),price:ref('SuppliedPrice'),note:string(2000),source:ref('TravelEventSource')},['id','label','legs']);
node('flight-results',{label:short,description:string(2000),results:array(ref('DiscoveryFlightResult'),0,40),source:ref('TravelEventSource')},['label','results']);
// Original supplied activity preference matrix and event agenda sidebar.
defs.ActivityParticipant=object({id:suppliedKey,label:short},['id','label']);
defs.ActivityAvailability=object({participantId:suppliedKey,status:choice('available','unavailable','unknown')},['participantId','status']);
defs.ActivityOption=object({id:suppliedKey,label:short,startsAt:flightAt,endsAt:flightAt,location:short,description:string(3000),availability:array(ref('ActivityAvailability'),0,12),source:ref('TravelEventSource')},['id','label','startsAt','endsAt','availability']);
node('shared-activity-planner',{label:short,description:string(2000),participants:array(ref('ActivityParticipant'),1,12),options:array(ref('ActivityOption'),0,20),disabled:bool},['label','participants','options']);
defs.EventAgendaEntry=object({id:suppliedKey,label:short,startsAt:flightAt,endsAt:flightAt,category:short,description:string(3000),speaker:short},['id','label','startsAt','endsAt','category']);
node('event-sidebar',{eventId:suppliedKey,label:short,organizer:short,location:short,startsAt:flightAt,endsAt:flightAt,description:string(5000),agenda:array(ref('EventAgendaEntry'),0,40),source:ref('TravelEventSource')},['eventId','label','startsAt','endsAt','agenda']);
// Original supplied vocabulary and explicit local clipboard workflow.
defs.WordExample=object({text:string(1000,1),translation:string(1000)},['text']);
node('word-card',{wordId:suppliedKey,term:string(200,1),definition:string(5000,1),pronunciation:short,partOfSpeech:short,translation:string(2000),examples:array(ref('WordExample'),0,8),initiallyRevealed:bool,disabled:bool,source:ref('TravelEventSource')},['wordId','term','definition']);
defs.CopyWord=object({id:suppliedKey,text:string(200,1),note:string(1000)},['id','text']);
node('copy-words',{label:short,description:string(2000),words:array(ref('CopyWord'),0,80),initialSelectedIds:array(suppliedKey,0,80),separator:choice('lines','comma','space'),disabled:bool},['label','words']);
// Original supplied code-line and document-page citation readers.
node('code-cite',{label:short,fileName:short,language:short,startLine:integer(1,10000000),lines:array(string(2000),1,120),citedStart:integer(1,10000000),citedEnd:integer(1,10000000),source:ref('TravelEventSource')},['label','fileName','startLine','lines']);
defs.CitedFilePage=object({number:integer(1,10000000),label:short,text:string(6000,1),source:ref('TravelEventSource')},['number','text']);
node('file-cite',{label:short,fileName:short,mediaType:short,totalPages:integer(1,10000000),pages:array(ref('CitedFilePage'),1,30),initialPage:integer(1,10000000),source:ref('TravelEventSource')},['label','fileName','pages']);
// Original supplied attributed facts and local entity-thumbnail detail selection.
defs.SidebarFact=object({id:suppliedKey,label:short,value:{anyOf:[string(2000),{type:'null'}]},unit:short,group:short,note:string(3000),observedAt:flightAt,source:ref('TravelEventSource')},['id','label','value']);
node('sidebar-fact-table',{label:short,description:string(2000),facts:array(ref('SidebarFact'),0,80),source:ref('TravelEventSource')},['label','facts']);
defs.EntityThumbnailField=object({label:short,value:string(2000)},['label','value']);
defs.EntityThumbnailRecord=object({id:suppliedKey,label:short,category:short,description:string(3000),fields:array(ref('EntityThumbnailField'),0,8),image:object({src:string(140000,1),alt:string(2000,1)},['src','alt']),source:ref('TravelEventSource')},['id','label','category']);
node('entity-thumbnail-list',{label:short,description:string(2000),entities:array(ref('EntityThumbnailRecord'),0,24),initialSelectedId:suppliedKey,disabled:bool},['label','entities']);
// Original bounded reader for supplied discussion content; no provider integration.
const threadScore = { anyOf: [integer(-1000000000, 1000000000), { type:'null' }] };
defs.ThreadComment = object({ id:key, author:short, body:string(4000,1), score:threadScore, replies:array(ref('ThreadComment'),0,20) }, ['id','author','body']);
node('reddit-thread-card', { title:string(300,1), author:short, body:string(6000), source:object({label:short,url:string(2048,1)},['label']), comments:array(ref('ThreadComment'),0,50), community:short, score:threadScore, expanded:bool }, ['title','author','body','source','comments']);
registry.use('foundations/content');
registry.use('foundations/layout');
registry.use('forms/fields');
registry.use('foundations/button');
registry.use('graphics/topology');
registry.use('charts/basic');
registry.use('time/controls');
registry.use('weather/snapshot');

registry.use('sports/motorsport');
registry.use('sports/model');
registry.use('learning/basic');
// Existing supplied financial and ledger source modules; historical order is retained.
registry.use('shared/finance-source');
registry.use('finance/snapshots');
registry.use('shared/ledger-source');
registry.use('finance/ledger-lists');
registry.use('shared/ledger-money');
registry.use('finance/ledger-records');
registry.use('sports/match-scores');
registry.use('results/supplied');
registry.use('sports/statistics');
// Local conversion controls use factual unit definitions and caller-supplied exchange snapshots.
const unitRegistry=JSON.parse(await readFile(new URL('../../src/data/units.json',import.meta.url),'utf8'));
const unitCode={enum:[...new Set(Object.values(unitRegistry).flatMap(category=>category.units.map(unit=>unit.id)))],description:Object.entries(unitRegistry).map(([name,category])=>name+': '+category.units.map(unit=>unit.id).join(', ')).join('; ')};
node('unit-converter',{title:short,category:choice('length','mass','temperature','speed','area','volume','time','pressure','data'),amount:number,from:unitCode,to:unitCode,precision:{...integer(1,12),description:'Maximum significant digits, default 8; raw values are retained.'},temperatureMode:{...choice('absolute','difference'),description:'Temperature only. Absolute includes scale offsets and must be >= 0 K; difference converts signed intervals without offsets.'}},['category','amount','from','to'], 'converters');
const currencyCode={type:'string',pattern:'^[A-Z]{3}$'};
node('currency-converter',{title:short,source:ref('FinanceSource'),asOf:timestamp,base:currencyCode,rates:array(object({currency:currencyCode,rate:{anyOf:[{type:'number',exclusiveMinimum:0},{type:'null'}],description:'Units of this currency per one base-currency unit; null means unavailable.'}},['currency','rate']),0,200),amount:number,from:currencyCode,to:currencyCode,precision:integer(1,12),status:choice('ready','loading','error'),message:string()},['source','asOf','base','rates','amount'], 'converters');
node('svg', { viewBox: { type: 'string', pattern: '^\\d+\\s+\\d+\\s+\\d+\\s+\\d+$' }, shapes: array(object({ tag: choice('rect', 'line', 'circle', 'path', 'text', 'polyline', 'polygon'), attrs: { type: 'object', maxProperties: 24, additionalProperties: { anyOf: [string(), number] } }, text: string() }, ['tag', 'attrs']), 1, 150), label: string() }, ['viewBox', 'shapes'], 'graphics');
node('native', { name: choice('box', 'row', 'col', 'grid', 'grid-item', 'card', 'text', 'title', 'caption', 'badge', 'divider', 'code', 'blockquote', 'bold', 'italic', 'underline', 'strikethrough', 'spacer', 'list', 'list-item', 'table', 'table-row', 'table-cell', 'flow', 'flow-item'), props: { ...object({ gap: integer(0, 16), padding: integer(0, 16), columns: integer(1, 6), radius: choice('none', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', 'full'), border: bool, color, size: choice('xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'), weight, align: choice('start', 'center', 'end', 'stretch'), justify: choice('start', 'center', 'end', 'between', 'around'), width: { anyOf: [integer(20, 1400), choice('100%', 'auto')] }, height: integer(0, 1400), maxWidth: integer(20, 1400), minWidth: integer(0, 1400), background: choice('surface', 'surface-secondary', 'surface-tertiary', 'none'), marker: choice('bullet', 'number', 'none'), variant: choice('soft', 'solid', 'outline', 'ghost'), pill: bool, textAlign: align }), maxProperties: 18 }, children }, ['name', 'children'], 'compatibility');
// Independent finite follow-up intents; no host-service execution.
defs.FollowUpCardIntent = {oneOf:[object({kind:{const:'url'},url:string(2048,1)},['kind','url']),object({kind:{const:'query'},query:string(4000,1)},['kind','query']),object({kind:{const:'prefill'},surface:{const:'work'},query:string(4000,1)},['kind','surface','query'])]};
defs.FollowUpCardItem=object({id:key,label:short,description:string(1000,1),emoji:string(32,1),iconData:string(100000,1),disabled:bool,intent:ref('FollowUpCardIntent')},['id','label','intent']);
node('follow-up-card-group',{label:short,items:array(ref('FollowUpCardItem'),0,40),status:choice('ready','loading','error'),message:string(2000,1)},['label','items']);
installTransactionDetail({defs,node});
registry.nodeDefinition('recommendation-card',{...recommendationCardSchema(),type:'object',properties:{type:{const:'recommendation-card'}},required:['type']},'base');
registry.nodeDefinition('prompt-checklist',{...promptChecklistSchema(),type:'object',properties:{type:{const:'prompt-checklist'}},required:['type']},'base');
registry.nodeDefinition('ledger-finance-status-banner',{...financeStatusSchema(),type:'object',properties:{type:{const:'ledger-finance-status-banner'}},required:['type']},'finance');
// Restored project139 schema definitions; exact node/dependency objects are retained.
const learningMediaDefinitions=JSON.parse(await readFile(new URL('../learning-media-definitions.json',import.meta.url),'utf8'));
for(const [name,definition]of Object.entries(learningMediaDefinitions)){
  if(defs[name])throw new Error('Duplicate restored learning definition: '+name);
  defs[name]=definition;
  if(name.endsWith('Node')){nodes.push(ref(name));owners[definition.properties.type.const]='learning';}
}
defs.WeatherSidebarPlace=object({id:suppliedKey,label:short,timezone:short,observedAt:{anyOf:[flightAt,{type:'null'}]},temperature:{anyOf:[{type:'number',minimum:-1000000,maximum:1000000},{type:'null'}]},unit:choice('celsius','fahrenheit'),condition:{anyOf:[condition,{type:'null'}]},source:ref('TravelEventSource')},['id','label','timezone','observedAt','temperature','unit','condition']);
node('weather-sidebar-title',{label:short,description:string(2000),places:array(ref('WeatherSidebarPlace'),0,30),initialPlaceId:suppliedKey,unit:choice('celsius','fahrenheit')},['label','places','unit'],'weather');

registry.use('finance/ledger-correction');

const netWorthDefinitions=JSON.parse(await readFile(new URL('../net-worth-definitions.json',import.meta.url),'utf8'));
Object.assign(defs,netWorthDefinitions);nodes.push(ref('LedgerNetWorthNode'));owners['ledger-net-worth']='finance';
registry.importLegacyDefinitions(JSON.parse(await readFile(new URL('../pressable-definitions.json',import.meta.url),'utf8')));nodes.push(ref('PressableNode'));owners.pressable='base';
registry.importLegacyDefinitions(JSON.parse(await readFile(new URL('../fee-interest-definitions.json',import.meta.url),'utf8')));nodes.push(ref('LedgerFeeInterestPaidNode'));owners['ledger-fee-interest-paid']='finance';
registry.importLegacyDefinitions(JSON.parse(await readFile(new URL('../html-view-definitions.json',import.meta.url),'utf8')));nodes.push(ref('HtmlViewNode'));owners['html-view']='base';
registry.use('media/readers');
registry.importLegacyDefinitions(JSON.parse(await readFile(new URL('../async-image-definitions.json',import.meta.url),'utf8')));nodes.push(ref('AsyncImageNode'),ref('AsyncImageGroupNode'));owners['async-image']='base';owners['async-image-group']='base';
registry.use('media/lottie');
// Exact supplied income labels; no estimation, account lookup or date prediction.
registry.use('shared/ledger-income-paycheck');
defs.SuppliedSectionTab=object({id:key,label:short,title:short,content:string(12000),disabled:bool},['id','label','title','content']);
node('tabbed-section',{label:short,tabs:array(ref('SuppliedSectionTab'),0,24),activeId:key,vertical:bool,disabled:bool,status:choice('pending','resolved','failed'),fallback:short},['label','tabs'],'base');
defs.VisualEntityRequest=object({id:short,kind:short},['id','kind']);
defs.VisualCardItem=object({id:key,label:short,title:short,query:short,caption:short,subtitle:short,source:short,metadata:short,reason:string(1200,1),summary:string(2000,1),image:ref('SearchImageRecord'),imageLoading:bool,imageIndex:integer(0,23),url:string(2048,1),entity:ref('VisualEntityRequest'),disabled:bool},['id','label']);
node('visual-card-carousel',{title:short,items:array(ref('VisualCardItem'),0,24),viewerImages:array(ref('SearchImageRecord'),0,24),viewer:choice('local','intent'),mobile:bool,disabled:bool,status:choice('pending','resolved','failed'),fallback:short},['title','items'],'base');
node('link-card',suppliedLinkProps,[],'base');
node('recommendation-link-card',suppliedLinkProps,[],'base');
registry.use('finance/ledger-spend');
registry.use('finance/ledger-upcoming');
defs.ImageGridItem=object({id:key,src:string(16000,1),alt:short,caption:string(500)},['id','src','alt']);
defs.ImageGridTile=object({imageId:key,aspectRatio:{type:'number',minimum:.1,maximum:20},flexGrow:{type:'number',minimum:.1,maximum:20}},['imageId']);
defs.ImageGridRow=object({aspectRatio:{type:'number',minimum:.1,maximum:20},tiles:array(ref('ImageGridTile'),1,24)},['tiles']);
defs.ImageGridPlaceholderTile=object({aspectRatio:{type:'number',minimum:.1,maximum:20},flexGrow:{type:'number',minimum:.1,maximum:20}});
defs.ImageGridPlaceholderRow=object({aspectRatio:{type:'number',minimum:.1,maximum:20},tiles:array(ref('ImageGridPlaceholderTile'),1,24)},['tiles']);
defs.ImageGridRecommendation=object({id:key,label:short,query:string(2000,1),thumbnailSrc:string(16000,1)},['id','label','query','thumbnailSrc']);
node('image-grid',{label:short,images:array(ref('ImageGridItem'),0,24),columns:integer(1,4),fit:choice('contain','cover'),disabled:bool,presentation:choice('grid','mosaic','live'),rows:array(ref('ImageGridRow'),0,24),recommendations:array(ref('ImageGridRecommendation'),0,24),recommendationsExpanded:bool,status:choice('pending','resolved','failed'),fallback:string(2000),loading:bool,placeholderRows:array(ref('ImageGridPlaceholderRow'),0,8),viewer:choice('intent','local')},['images']);
defs.ConversationSuggestion=object({id:key,label:short,prompt:string(2000,1),intent:choice('new-turn','start-voice'),iconSrc:string(16000,1),disabled:bool},['id','label','prompt']);
node('conversation-suggestions',{label:short,suggestions:array(ref('ConversationSuggestion'),0,12),disabled:bool,status:choice('pending','resolved','failed'),fallback:string(2000)},['suggestions']);
defs.FollowUpAction=object({id:key,label:short,query:{type:'string',maxLength:2000},intent:{enum:['new-turn','start-voice','open-image-composer']},iconSrc:{type:'string',maxLength:16000},disabled:bool},['id','label']);
node('follow-up-action-bar',{label:short,actions:array(ref('FollowUpAction'),0,12),disabled:bool,presentation:{enum:['flat','footer','wrapped_pills']},status:{enum:['pending','resolved','failed']},fallback:{type:'string',maxLength:2000}},['actions']);
registry.use('finance/ledger-income');
registry.importLegacyDefinitions(JSON.parse(await readFile(new URL('../async-video-definitions.json',import.meta.url),'utf8')));nodes.push(ref('AsyncVideoCarouselNode'));owners['async-video-carousel']='base';

registry.use('automation/views');
node('scheduled-task-suggestion',{label:short,action:choice('new-turn','task-opt-in-accept'),creationGuidelines:string(12000,1),originSurface:choice('chat','work'),submitted:bool,disabled:bool,status:choice('pending','resolved','failed'),fallback:string(2000,1)},['label']);

registry.use('entities/cards');

registry.use('requests/user');
registry.use('finance/category-views');
registry.use('voice/cards');
registry.use('onboarding/conversation');
registry.use('onboarding/cards');
registry.use('learning/study-demo');
installSearchOnboardingSchema({node,defs});
registry.use('learning/quiz-cards');
registry.use('onboarding/welcome');
registry.use('requests/location');
registry.use('reservations/pills');
registry.use('onboarding/search-capability');
registry.use('tasks/cards');
registry.use('finance/entry');
registry.use('context/actions');
registry.use('finance/equity-watch');
registry.use('launchers/cards');
registry.use('discovery/cards');
registry.use('finance/credit-display');
registry.use('interactions/local');
registry.use('learning/visualization');
registry.use('care/providers');
registry.use('media/inline-host');
registry.use('calculators/corrected-age');
registry.use('calculators/gcs');
registry.use('calculators/rox');
registry.use('calculators/qsofa');
registry.use('forms/questionnaire');

registry.finalize();
const schema = createDocumentSchema({...defs});
return {schema,owners,nodes};
}
