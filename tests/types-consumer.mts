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
