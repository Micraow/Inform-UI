import type {Node,EntityThumbnailDetail} from '../dist/index.js';import type {EntityThumbnailDetail as BrowserDetail} from '../dist/browser.js';
const facts:Node={type:'sidebar-fact-table',label:'Supplied',facts:[{id:'f',label:'Field',value:null}]};const entities:Node={type:'entity-thumbnail-list',label:'Supplied',entities:[{id:'e',label:'Entity',category:'Example'}]};const detail:EntityThumbnailDetail={componentId:null,entityId:null};const browser:BrowserDetail=detail;
// @ts-expect-error local detail readonly
detail.entityId='e';
// @ts-expect-error no remote recognition
const recognition:Node={...entities,recognize:true};
// @ts-expect-error numeric values must be supplied literal text
const numeric:Node={...facts,facts:[{id:'f',label:'Field',value:3}]};
void[facts,entities,detail,browser,recognition,numeric];
