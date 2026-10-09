import type {Node,RecurringReviewDetail} from '../dist/index.js';import type {RecurringReviewDetail as BrowserReview} from '../dist/browser.js';
const accounts:Node={type:'ledger-accounts',label:'Supplied',accounts:[{id:'a',label:'Example',institution:'Example',kind:'cash',status:'unknown',balance:{amount:'-0.100000000000000001',currency:'USD'}}]};const recurring:Node={type:'ledger-recurring-transactions',label:'Supplied',records:[{id:'r',label:'Example',cadence:'unknown',status:'unknown',direction:'unknown'}]};const detail:RecurringReviewDetail={componentId:null,recordId:'r',reviewed:true};const browser:BrowserReview=detail;
// @ts-expect-error event detail readonly
detail.reviewed=false;
// @ts-expect-error numeric balance cannot silently lose precision
const numeric:Node={...accounts,accounts:[{id:'a',label:'A',institution:'I',kind:'cash',status:'active',balance:{amount:1.2,currency:'USD'}}]};
// @ts-expect-error no payment API
const charge:Node={...recurring,chargeUrl:'https://example.org'};
void[accounts,recurring,detail,browser,numeric,charge];
