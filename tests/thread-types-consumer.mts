import type {IUIDocument,Node} from '../dist/index.js';
type Thread = Extract<Node,{type:'reddit-thread-card'}>;
const thread:Thread={type:'reddit-thread-card',title:'Synthetic',author:'Fictional Mira',body:'',source:{label:'Synthetic'},comments:[{id:'a',author:'Fictional Rowan',body:'Literal',score:null,replies:[{id:'b',author:'Fictional Lee',body:'Reply',score:-1}]}],score:0,expanded:true};
const document:IUIDocument={version:'iui/1',body:[thread]};
// @ts-expect-error source label is required
const missing:Thread={type:'reddit-thread-card',title:'Title',author:'A',body:'',source:{url:'https://example.invalid'},comments:[]};
// @ts-expect-error comments are required
const noComments:Thread={type:'reddit-thread-card',title:'Title',author:'A',body:'',source:{label:'Synthetic'}};
// @ts-expect-error body cannot be a reference
const body:Thread={...thread,body:{$:'text'}};
// @ts-expect-error recursive comments require literal bodies
const reply:Thread={...thread,comments:[{id:'a',author:'A',body:'Text',replies:[{id:'b',author:'B',body:{$:'text'}}]}]};
// @ts-expect-error no provider actions
const vote:Thread={...thread,onVote:'save'};
// @ts-expect-error score is nullable numeric, not a string
const score:Thread={...thread,score:'0'};
void [document,missing,noComments,body,reply,vote,score];
