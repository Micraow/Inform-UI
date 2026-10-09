import type {Node,ReservationChoiceDetail} from '../dist/index.js';
import type {Node as BrowserNode,ReservationChoiceDetail as BrowserChoice} from '../dist/browser.js';
const available:Node={type:'restaurant-availability',title:'Dinner',venue:'Example kitchen',partySize:2,timeZoneLabel:'Authored wall time',source:{label:'Supplied list'},slots:[{id:'one',date:'2024-02-29',time:'18:00',available:true}]};
const empty:BrowserNode={type:'restaurant-availability',title:'Empty',venue:'Kitchen',partySize:1,timeZoneLabel:'UTC as supplied',slots:[]};
const detail:ReservationChoiceDetail={componentId:null,slotId:'one',date:'2024-02-29',time:'18:00',partySize:2,venue:'Example kitchen',timeZoneLabel:'Authored wall time'};
const browserDetail:BrowserChoice=detail;
// @ts-expect-error event detail is readonly
browserDetail.slotId='replacement';
// @ts-expect-error availability requires a party size
const missing:Node={type:'restaurant-availability',title:'Dinner',venue:'Kitchen',timeZoneLabel:'Supplied',slots:[]};
// @ts-expect-error availability is literal, without state references
const reference:Node={type:'restaurant-availability',title:{$:'title'},venue:'Kitchen',partySize:2,timeZoneLabel:'Supplied',slots:[]};
// @ts-expect-error slot availability is a strict boolean
const boolean:Node={type:'restaurant-availability',title:'Dinner',venue:'Kitchen',partySize:2,timeZoneLabel:'Supplied',slots:[{id:'one',date:'2024-02-29',time:'18:00',available:'true'}]};
// @ts-expect-error explicit wall time is required
const noTime:Node={type:'restaurant-availability',title:'Dinner',venue:'Kitchen',partySize:2,timeZoneLabel:'Supplied',slots:[{id:'one',date:'2024-02-29',available:true}]};
// @ts-expect-error there is no form binding
const bind:Node={type:'restaurant-availability',title:'Dinner',venue:'Kitchen',partySize:2,timeZoneLabel:'Supplied',slots:[],bind:'selection'};
// @ts-expect-error there is no booking callback/action
const booking:Node={type:'restaurant-availability',title:'Dinner',venue:'Kitchen',partySize:2,timeZoneLabel:'Supplied',slots:[],action:'book'};
// @ts-expect-error no omitted required detail values
const missingDetail:ReservationChoiceDetail={slotId:'one',date:'2024-02-29',time:'18:00',partySize:2,venue:'Kitchen',timeZoneLabel:'Supplied'};
// @ts-expect-error detail does not expose a booking result
const result=detail.confirmationNumber;
void [available,empty,detail,browserDetail,missing,reference,boolean,noTime,bind,booking,missingDetail,result];
