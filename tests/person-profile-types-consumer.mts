import type {Node, IUIDocument} from '../dist/index.js';
const person: Extract<Node,{type:'person-profile'}> = {type:'person-profile',name:'Fictional person',role:'Reader',organization:'Example',location:'Example town',biography:'Synthetic.',expanded:false,facts:[{id:'topic',label:'Topic',value:'Books'}],links:[{id:'sample',label:'Sample',url:'https://example.com'}],source:{label:'Synthetic'}};
const document: IUIDocument = {version:'iui/1',body:[person]};
// @ts-expect-error Supplied names are literal strings, not expressions.
const bound: Node = {type:'person-profile',name:{$:'name'}};
// @ts-expect-error A name is required.
const unnamed: Node = {type:'person-profile'};
// @ts-expect-error No avatar or other remote media.
const avatar: Node = {type:'person-profile',name:'Fictional',avatar:'https://example.com/x.png'};
// @ts-expect-error No contact actions or host binding.
const contact: Node = {type:'person-profile',name:'Fictional',action:'contact'};
// @ts-expect-error Facts require a supplied literal value.
const fact: Node = {type:'person-profile',name:'Fictional',facts:[{id:'a',label:'Topic',value:{$:'topic'}}]};
void [document,bound,unnamed,avatar,contact,fact];
