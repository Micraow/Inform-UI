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
