import type {Node} from '../dist/index.js';import type {Node as BrowserNode} from '../dist/browser.js';
const business:Node={type:'local-business',name:'Supplied',category:'Cafe',address:'Supplied label',hours:[{day:'friday',status:'hours',periods:[{opens:'18:00',closes:'01:00',nextDay:true}]}]};
const reviews:Node={type:'restaurant-reviews',label:'Reviews',restaurantName:'Supplied',reviews:[{id:'r',author:'Supplied author',text:'Literal review',occasion:'lunch',food:4.5}]};
const browser:BrowserNode=business;
// @ts-expect-error no booking endpoint
const booking:Node={...business,endpoint:'https://example.org'};
// @ts-expect-error unknown rating dimension
const badReview:Node={...reviews,reviews:[{id:'r',author:'A',text:'Text',occasion:'lunch',cleanliness:5}]};
// @ts-expect-error no posting URL
const posting:Node={...reviews,postUrl:'https://example.org'};
void[business,reviews,browser,booking,badReview,posting];
