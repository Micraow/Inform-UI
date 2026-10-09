import './choice-gallery-types-consumer.mjs';
import './draft-review-types-consumer.mjs';
import './motion-types-consumer.mjs';
import "./news-types-consumer.mjs";
import "./button-types-consumer.mjs";
import {compileArtifact,compileHtml,mount,validateDocument,evaluateState} from '../dist/index.js';
import type {IUIDocument,Node,Value,Controller} from '../dist/index.js';
const value:Value={op:'add',args:[1,2]};
const node:Node={type:'metric',label:'Total',value};
const spec:IUIDocument={version:'iui/1',body:[node]};
const result=validateDocument(spec);
if(result.ok){const doc:IUIDocument=result.document;compileHtml(doc);compileArtifact(doc,{assets:'shared'});evaluateState(doc);}
declare const host:HTMLElement;
const controller:Controller=mount(host,spec);controller.setState({x:1});controller.dispose();
// @ts-expect-error raw HTML is not part of the node language
const invalid:Node={type:'html',value:'<b>x</b>'};
void invalid;
const rich:Node={type:'text',runs:[{value:{$:'count'},bold:true,code:true}]};
const table:Node={type:'table',columns:['Name','Value'],sections:[{kind:'body',rows:[[{value:'A',header:true},0]]}]};
const grid:Node={type:'grid',columns:2,children:[{type:'grid-item',colSpan:2,children:[rich]}]};
const quote:Node={type:'blockquote',children:[rich],attribution:'Original example'};
void [table,grid,quote];
// @ts-expect-error text requires either a value or runs
const missingText:Node={type:'text'};
// @ts-expect-error table requires rows or sections
const missingTable:Node={type:'table',columns:['A']};
void [missingText,missingTable];
const clock:Node={type:'clock',mode:'snapshot',timezone:'UTC',at:'2026-10-09T00:00:00Z'};
const stopwatch:Node={type:'stopwatch',elapsedMs:0,laps:true};
const timer:Node={type:'timer',durationMs:1000};
const tooltip:Node={type:'tooltip',label:'Help',value:'Inert text'};
const popover:Node={type:'popover',label:'Details',children:[tooltip,timer]};
void [clock,stopwatch,popover];
// @ts-expect-error snapshot mode requires an explicit instant
const missingInstant:Node={type:'clock',mode:'snapshot',timezone:'UTC'};
// @ts-expect-error a timer requires its duration
const missingDuration:Node={type:'timer'};
// @ts-expect-error tooltip contents are inert text, not child nodes
const interactiveTooltip:Node={type:'tooltip',label:'Help',value:'Text',children:[timer]};
void [missingInstant,missingDuration,interactiveTooltip];

const flow:Node={type:"flow",gap:"sm",children:[{type:"icon",name:"check",label:"Ready"},{type:"pulse-indicator",label:"Local example",status:"idle",animate:false}]};
void flow;
// @ts-expect-error icons have a fixed original vocabulary, not raw SVG or external URLs
const remoteIcon:Node={type:"icon",name:"downloaded-unknown",src:"https://example.com/icon.svg"};
// @ts-expect-error status is always explicit
const missingPulseStatus:Node={type:"pulse-indicator",label:"Local example"};
void [remoteIcon,missingPulseStatus];

const dateField:Node={type:'input',kind:'date',label:'Practice date',bind:'day',minDate:'0001-01-01',maxDate:'9999-12-31',required:true};
// @ts-expect-error a native date has date-only bounds, never numeric min
const numericDate:Node={type:'input',kind:'date',label:'Practice date',bind:'day',min:0};
// @ts-expect-error native date inputs do not support placeholder
const placeholderDate:Node={type:'input',kind:'date',label:'Practice date',bind:'day',placeholder:'YYYY-MM-DD'};
// @ts-expect-error native date inputs do not support text lengths
const lengthDate:Node={type:'input',kind:'date',label:'Practice date',bind:'day',maxLength:10};
// @ts-expect-error date-only bounds do not apply to text inputs
const datedText:Node={type:'input',kind:'text',label:'Text',bind:'text',minDate:'2024-01-01'};
// @ts-expect-error date-only bounds do not apply to numeric inputs
const datedNumber:Node={type:'input',kind:'number',label:'Number',bind:'n',maxDate:'2024-12-31'};
// @ts-expect-error date-only bounds do not apply to checkboxes
const datedCheckbox:Node={type:'input',kind:'checkbox',label:'Check',bind:'check',maxDate:'2024-12-31'};
void [dateField,numericDate,placeholderDate,lengthDate,datedText,datedNumber,datedCheckbox];

const fillBlank:Node={type:'fill-blank',title:'Practice',parts:['Use ',{blank:'verb'},'.'],blanks:[{id:'verb',label:'Verb',answers:['read']}]};
void fillBlank;
// @ts-expect-error blank references have only a blank id, never arbitrary executable content
const fillBlankRaw:Node={type:'fill-blank',title:'Practice',parts:[{blank:'verb',html:'<input>'}],blanks:[{id:'verb',label:'Verb',answers:['read']}]};
// @ts-expect-error a finite practice node requires supplied blank definitions
const fillBlankMissing:Node={type:'fill-blank',title:'Practice',parts:['A sentence']};
void [fillBlankRaw,fillBlankMissing];


// Sentence-builder: finite authored token identities, optional literal joiner.
const sentenceBuilder: IUIDocument = {version:'iui/1',body:[{type:'sentence-builder',title:'Original practice',tokens:[{id:'one',text:'一'}],answer:['one'],joiner:''}]};
void sentenceBuilder;
// @ts-expect-error Sentence-builder cannot bind local practice state to host state.
const sentenceBuilderBound: IUIDocument = {version:'iui/1',body:[{type:'sentence-builder',title:'Invalid',tokens:[{id:'one',text:'一'}],answer:['one'],bind:'shared'}]};
void sentenceBuilderBound;
// @ts-expect-error Joiner only accepts explicit space or empty string.
const sentenceBuilderJoiner: IUIDocument = {version:'iui/1',body:[{type:'sentence-builder',title:'Invalid',tokens:[{id:'one',text:'一'}],answer:['one'],joiner:'-'}]};
void sentenceBuilderJoiner;
const controlledChecklist:Node={type:'checklist',label:'Steps',items:[{id:'one',label:'First',bind:'done'}],disabled:{$:'locked'}};
void controlledChecklist;
// @ts-expect-error filters use the finite native local visibility choices, not arbitrary protocol strings
const checklistFilter:Node={type:'checklist',label:'Steps',items:[],filter:'all'};
// @ts-expect-error each checklist item requires an explicit declared boolean binding
const checklistUnbound:Node={type:'checklist',label:'Steps',items:[{id:'one',label:'First'}]};
void [checklistFilter,checklistUnbound];


const rating:Node={type:'rating',label:'Clarity',bind:'clarity',max:5,clearable:true,disabled:{$:'locked'},hint:'Local only'};
// @ts-expect-error ratings require a controlled binding
const unboundRating:Node={type:'rating',label:'Clarity'};
// @ts-expect-error max is a number, never a string
const stringRatingMax:Node={type:'rating',label:'Clarity',bind:'clarity',max:'5'};
// @ts-expect-error no fractional step or arbitrary glyph protocol
const steppedRating:Node={type:'rating',label:'Clarity',bind:'clarity',step:0.5};
// @ts-expect-error readOnly is not a second rating protocol
const readonlyRating:Node={type:'rating',label:'Clarity',bind:'clarity',readOnly:true};
void [rating,unboundRating,stringRatingMax,steppedRating,readonlyRating];

{
const node:Extract<Node,{type:'vocab-card'}>={type:'vocab-card',term:'resolve',languageLabel:'English',pronunciation:'/rɪˈzɒlv/',partOfSpeech:'verb',senses:[{id:'settle',meaning:'To find a solution.',translation:'解决',examples:['We resolved the issue.']}]};
const document:IUIDocument={version:'iui/1',body:[node]};
void document;
// @ts-expect-error A supplied meaning is literal content, not a state expression.
const expression:Extract<Node,{type:'vocab-card'}>={type:'vocab-card',term:'x',senses:[{id:'s',meaning:{$:'answer'}}]};
// @ts-expect-error Network dictionary retrieval is outside this finite node.
const online:Extract<Node,{type:'vocab-card'}>={type:'vocab-card',term:'x',senses:[{id:'s',meaning:'Meaning'}],dictionaryUrl:'https://example.com'};
// @ts-expect-error Senses are required.
const incomplete:Extract<Node,{type:'vocab-card'}>={type:'vocab-card',term:'x'};
void expression;void online;void incomplete;

}
const suppliedFavicon:Node={type:'favicon',label:'Site icon',fallback:'UI',size:'md'};
// @ts-expect-error favicon never looks up a site or accepts arbitrary domain fields
const lookupFavicon:Node={type:'favicon',label:'Site icon',domain:'example.com'};
// @ts-expect-error callers must provide an accessible label
const unnamedFavicon:Node={type:'favicon',src:'https://example.com/icon.png'};
void [suppliedFavicon,lookupFavicon,unnamedFavicon];


const agenda:Node={type:'agenda',label:'Supplied dates',events:[{id:'one',date:'2024-02-29',title:'Reading',start:'09:00',end:'10:00',status:'cancelled'}]};
const untimedAgenda:Node={type:'agenda',label:'No supplied time',events:[{id:'one',date:'0001-01-01',title:'Note'}]};
// @ts-expect-error agenda labels are literal strings
const boundAgenda:Node={type:'agenda',label:{$:'day'},events:[]};
// @ts-expect-error agenda end requires supplied start
const missingAgendaStart:Node={type:'agenda',label:'Bad',events:[{id:'one',date:'2024-02-29',title:'Reading',end:'10:00'}]};
// @ts-expect-error agenda controls are local and cannot bind form values
const boundAgendaFilter:Node={type:'agenda',label:'Bad',events:[],bind:'day'};
void [agenda,untimedAgenda,boundAgenda,missingAgendaStart,boundAgendaFilter];


import type {SuggestionDetail} from '../dist/index.js';
import type {SuggestionDetail as BrowserSuggestionDetail} from '../dist/browser.js';
const suggestions:Node={type:'prompt-suggestions',label:'Ideas',items:[{id:'one',text:'Literal supplied text'}],initialVisible:1};
const suggestionDetail:SuggestionDetail={componentId:null,suggestionId:'one',text:'Exact supplied text'};
const browserSuggestionDetail:BrowserSuggestionDetail=suggestionDetail;
// @ts-expect-error event detail is readonly
suggestionDetail.text='mutated';
// @ts-expect-error label is required
const missingSuggestionLabel:Node={type:'prompt-suggestions',items:[{id:'one',text:'Text'}]};
// @ts-expect-error arbitrary host callbacks are not part of the authored node
const automaticSuggestion:Node={type:'prompt-suggestions',label:'Ideas',items:[{id:'one',text:'Text'}],onSelect:()=>{}};
// @ts-expect-error no alternate conversation alias
const conversationSuggestion:Node={type:'conversation-suggestions',label:'Ideas',items:[{id:'one',text:'Text'}]};
void [suggestions,browserSuggestionDetail,missingSuggestionLabel,automaticSuggestion,conversationSuggestion];

import './label-types-consumer.mjs';


const writing:Node={type:'writing-block',label:'Local draft',value:'Literal text',editable:true,note:'Optional plain text'};
void writing;
// @ts-expect-error writing-block requires an explicit label
const writingMissingLabel:Node={type:'writing-block',value:'Text'};
// @ts-expect-error local writing values cannot bind to host state
const writingBinding:Node={type:'writing-block',label:'Draft',value:{$:'draft'}};
// @ts-expect-error no recipient, send or persistence action exists
const writingSend:Node={type:'writing-block',label:'Draft',value:'Text',send:true};
// @ts-expect-error editable is a literal boolean, not a state expression
const writingEditable:Node={type:'writing-block',label:'Draft',value:'Text',editable:{$:'enabled'}};
void [writingMissingLabel,writingBinding,writingSend,writingEditable];

import './person-profile-types-consumer.mjs';
import './types-menu.mjs';

import './entity-reviews-types-consumer.mjs';


import "./availability-types-consumer.mjs";

import './thread-types-consumer.mjs';

import './onboarding-types-consumer.mjs';
import "./finance-lists-types-consumer.mjs";

import './travel-events-types-consumer.mjs';

import './trackers-types-consumer.mjs';

import './poll-types-consumer.mjs';

import './mail-files-types-consumer.mjs';

import './decision-cards-types-consumer.mjs';

import './local-places-types-consumer.mjs';

import './flight-discovery-types-consumer.mjs';

import './activity-planning-types-consumer.mjs';

import './vocabulary-tools-types-consumer.mjs';

import './source-citations-types-consumer.mjs';

import './entity-facts-types-consumer.mjs';

import './ledger-records-types-consumer.mjs';

import './motorsport-types-consumer.mjs';

import './player-summaries-types-consumer.mjs';
