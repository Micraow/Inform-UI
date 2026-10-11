import type {Node,TransactionDetailIntent} from '../dist/index.js';
type Detail = Extract<Node,{type:'ledger-transaction-detail'}>;
type Related = NonNullable<Detail['data']>['related'][number];
const node:Detail={type:'ledger-transaction-detail',label:'Supplied transaction',status:'pending',mobile:false};
const related:Related={id:'one',name:'Supplied',dateLabel:'Unknown',amountLabel:'0',maskedAmountLabel:'•••',actionLabel:'Inspect',pending:true,pendingLabel:'Pending'};
// @ts-expect-error Pending display requires its supplied label.
const missing:Related={id:'one',name:'Supplied',dateLabel:'Unknown',amountLabel:'0',maskedAmountLabel:'•••',actionLabel:'Inspect',pending:true};
// @ts-expect-error Executable fields do not belong to a supplied related record.
const unsafe:Related={...related,onClick:'alert(1)'};
// @ts-expect-error Mobile is a boolean selected by the host, not a CSS breakpoint expression.
const bad:Detail={...node,mobile:'small'};
const intent:TransactionDetailIntent={componentId:null,transactionId:'one'};
// @ts-expect-error Intent identity is readonly.
intent.transactionId='two';
void[node,related,missing,unsafe,bad,intent];
