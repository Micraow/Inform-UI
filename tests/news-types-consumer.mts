import type {Node,IUIDocument} from '../dist/index.js';
const minimal:Node={type:'news-article',headline:'Supplied article',source:{label:'Supplied source'}};
const full:Node={type:'news-article',headline:'Article',source:{label:'Source',url:'https://example.com'},author:'Author',published:'2024-02-29',summary:'Summary',paragraphs:['One','Two'],expanded:true,tags:['Demo']};
const doc:IUIDocument={version:'iui/1',body:[{type:'form',label:'Read while completing form',children:[minimal,full]}]};
// @ts-expect-error a news article requires provenance
const noSource:Node={type:'news-article',headline:'Missing source'};
// @ts-expect-error article headline is literal text
const bound:Node={type:'news-article',headline:{$:'title'},source:{label:'Source'}};
// @ts-expect-error source URL is literal text
const boundSource:Node={type:'news-article',headline:'Title',source:{label:'Source',url:{$:'url'}}};
// @ts-expect-error paragraphs are strings rather than renderer children
const children:Node={type:'news-article',headline:'Title',source:{label:'Source'},paragraphs:[{type:'text',value:'No'}]};
// @ts-expect-error no live provider mode
const live:Node={type:'news-article',headline:'Title',source:{label:'Source'},live:true};
// @ts-expect-error no binding or form data
const bind:Node={type:'news-article',headline:'Title',source:{label:'Source'},bind:'article'};
// @ts-expect-error expanded is a literal boolean
const expanded:Node={type:'news-article',headline:'Title',source:{label:'Source'},expanded:{$:'open'}};
void[minimal,full,doc,noSource,bound,boundSource,children,live,bind,expanded];
