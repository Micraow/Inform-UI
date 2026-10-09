import type {Node} from '../dist/index.js';
import type {Node as BrowserNode} from '../dist/browser.js';
const assets:Node={type:'asset-distribution',label:'Supplied amounts',accounts:[{id:'cash',name:'Cash',amount:null,currency:'USD'}]};
const transactions:BrowserNode={type:'transaction-list',label:'Supplied transactions',transactions:[{id:'one',date:'2026-10-09',description:'Example',amount:0,currency:'USD',direction:'debit'}]};
// @ts-expect-error a null transaction amount is unsupported
const missingAmount:Node={type:'transaction-list',label:'Missing',transactions:[{id:'one',date:'2026-10-09',description:'Example',amount:null,currency:'USD',direction:'debit'}]};
// @ts-expect-error account amount is required, nullable rather than omitted
const omitted:Node={type:'asset-distribution',label:'Supplied',accounts:[{id:'one',name:'One',currency:'USD'}]};
// @ts-expect-error no state bindings
const bind:Node={type:'transaction-list',label:'Local',transactions:[],bind:'ledger'};
// @ts-expect-error no provider fetch
const endpoint:Node={type:'asset-distribution',label:'Local',accounts:[],endpoint:'https://example.org/accounts'};
// @ts-expect-error directions are explicit magnitudes, not inferred signs or transfers
const badDirection:Node={type:'transaction-list',label:'Local',transactions:[{id:'one',date:'2026-10-09',description:'Example',amount:1,currency:'USD',direction:'transfer'}]};
// @ts-expect-error label is literal
const reference:Node={type:'asset-distribution',label:{$:'name'},accounts:[]};
void [assets,transactions,missingAmount,omitted,bind,endpoint,badDirection,reference];
