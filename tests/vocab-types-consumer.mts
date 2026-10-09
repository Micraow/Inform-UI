import type {IUIDocument,Node} from '../dist/index.js';
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
