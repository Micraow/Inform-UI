import type {Node,IUIDocument} from '../dist/index.js';
const supplied:Node={type:'entity-reviews',label:'Synthetic supplied reviews',items:[{id:'a',author:'Fictional Aster',body:'Synthetic review',rating:null},{id:'b',author:'Fictional Ember',body:'Synthetic review',rating:5,date:'0001-01-01',title:'Supplied title',url:'https://example.com'}],source:{label:'Synthetic collection'}};
const document:IUIDocument={version:'iui/1',body:[supplied,{type:'form',label:'Host form',children:[supplied]}]};
// @ts-expect-error rating must be explicit, even when absent
const missing:Node={type:'entity-reviews',label:'Reviews',items:[{id:'a',author:'Fictional A',body:'Synthetic'}]};
// @ts-expect-error there is no provider or implicit retrieval
const provider:Node={type:'entity-reviews',label:'Reviews',items:[],provider:'remote'};
// @ts-expect-error no shared rating binding
const bound:Node={type:'entity-reviews',label:'Reviews',items:[],bind:'rating'};
// @ts-expect-error body is literal text, never an expression
const body:Node={type:'entity-reviews',label:'Reviews',items:[{id:'a',author:'Fictional A',body:{$:'text'},rating:null}]};
// @ts-expect-error source label is required
const source:Node={type:'entity-reviews',label:'Reviews',items:[],source:{url:'https://example.com'}};
void [supplied,document,missing,provider,bound,body,source];
