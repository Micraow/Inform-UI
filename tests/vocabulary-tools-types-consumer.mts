import type {Node,WordMarkDetail,WordsCopyDetail} from '../dist/index.js';import type {WordsCopyDetail as BrowserCopy} from '../dist/browser.js';
const word:Node={type:'word-card',wordId:'w',term:'Word',definition:'Supplied meaning'};const copy:Node={type:'copy-words',label:'Local',words:[{id:'w',text:'Word'}]};const mark:WordMarkDetail={componentId:null,wordId:'w',mark:'review'};const detail:WordsCopyDetail={componentId:null,wordIds:['w'],separator:'lines',text:'Word'};const browser:BrowserCopy=detail;
// @ts-expect-error frozen word selection
detail.wordIds.push('other');
// @ts-expect-error no upload endpoint
const upload:Node={...copy,upload:'https://example.org'};
// @ts-expect-error no dictionary service
const lookup:Node={...word,endpoint:'https://example.org'};
void[word,copy,mark,detail,browser,upload,lookup];
