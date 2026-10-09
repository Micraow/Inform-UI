import type {Node} from '../dist/index.js';import type {Node as BrowserNode} from '../dist/browser.js';
const code:Node={type:'code-cite',label:'Supplied',fileName:'example.ts',startLine:20,lines:['literal'],citedStart:20,citedEnd:20};const file:Node={type:'file-cite',label:'Supplied',fileName:'report.pdf',pages:[{number:5,text:'Original excerpt'}]};const browser:BrowserNode=file;
// @ts-expect-error no code execution
const execution:Node={...code,execute:true};
// @ts-expect-error no filesystem loader
const loader:Node={...file,filePath:'/private'};
void[code,file,browser,execution,loader];
