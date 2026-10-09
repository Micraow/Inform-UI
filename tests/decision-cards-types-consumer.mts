import type {Node,JobShortlistDetail,ProductChoiceDetail} from '../dist/index.js';import type {ProductChoiceDetail as BrowserProduct} from '../dist/browser.js';
const jobs:Node={type:'jobs',label:'Supplied',jobs:[]};const product:Node={type:'product-card',productId:'p',name:'Supplied',availability:'unknown'};
const shortlist:JobShortlistDetail={componentId:null,jobId:'j',shortlisted:true};const detail:ProductChoiceDetail={componentId:null,productId:'p',variantId:null,quantity:1,availability:'unknown',unitPrice:null,itemSubtotal:null};const browser:BrowserProduct=detail;
// @ts-expect-error no checkout endpoint
const checkout:Node={...product,checkout:'https://example.org/pay'};
// @ts-expect-error no application provider
const apply:Node={...jobs,endpoint:'https://example.org/jobs'};
// @ts-expect-error local event detail is readonly
browser.quantity=2;
// @ts-expect-error literal availability only
const bound:Node={...product,availability:{$:'stock'}};
void[jobs,product,shortlist,detail,browser,checkout,apply,bound];
