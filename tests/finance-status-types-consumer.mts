import type{Node}from'../dist/index.js';
const pending:Node={type:'ledger-finance-status-banner',label:'Supplied status',status:'pending'};
const noData:Node={type:'ledger-finance-status-banner',label:'Supplied status'};
const resolved:Node={type:'ledger-finance-status-banner',label:'Supplied status',data:{title:'Supplied notice',description:''}};
// @ts-expect-error pending cannot carry resolved data
const mixed:Node={type:'ledger-finance-status-banner',label:'Supplied status',status:'pending',data:{title:'No',description:'No'}};
// @ts-expect-error presentation does not accept a service handler
const service:Node={type:'ledger-finance-status-banner',label:'Supplied status',onClick:()=>{}};
// @ts-expect-error title must remain a literal string
const number:Node={type:'ledger-finance-status-banner',label:'Supplied status',data:{title:0,description:'No'}};
void[pending,noData,resolved,mixed,service,number];
