import type {IUIDocument,Node,FlightChoiceDetail} from '../dist/index.js';
import type {FlightChoiceDetail as BrowserFlightChoiceDetail} from '../dist/browser.js';
const flight:Extract<Node,{type:'flight-option'}>={type:'flight-option',optionId:'flight1',label:'Supplied flight',legs:[{id:'leg1',carrier:'Example Air',number:'EX101',departure:{airport:'AAA',at:'2028-02-29T09:00Z'},arrival:{airport:'BBB',at:'2028-02-29T12:00Z'},cabin:'Supplied cabin'}],price:{amount:0,currency:'ZZZ'},source:{label:'Source',url:'https://example.com'}};
const events:Extract<Node,{type:'artist-upcoming-events'}>={type:'artist-upcoming-events',artist:'Example artist',events:[{id:'event1',title:'Event',date:'2028-02-29',venue:'Example hall',start:'19:30',timeZoneLabel:'Literal label',url:'https://example.com'}]};
const document:IUIDocument={version:'iui/1',body:[flight,events]};
const selected:FlightChoiceDetail={id:null,optionId:'flight1'},cleared:BrowserFlightChoiceDetail={id:'node',optionId:null};
// @ts-expect-error Public detail is readonly.
selected.optionId='other';
// @ts-expect-error Supplied prices use numeric amounts.
const wrongAmount:Extract<Node,{type:'flight-option'}>={...flight,price:{amount:'100',currency:'USD'}};
// @ts-expect-error Binding is unsupported.
const boundFlight:Extract<Node,{type:'flight-option'}>={...flight,bind:'flight'};
// @ts-expect-error No booking integration is implied.
const booking:Extract<Node,{type:'flight-option'}>={...flight,bookingUrl:'https://example.com'};
// @ts-expect-error Source URL is required when source is supplied.
const missingSource:Extract<Node,{type:'artist-upcoming-events'}>={...events,source:{label:'Source'}};
// @ts-expect-error Events are required even for an empty collection.
const missingEvents:Extract<Node,{type:'artist-upcoming-events'}>={type:'artist-upcoming-events',artist:'Artist'};
// @ts-expect-error No network provider or ticket integration.
const provider:Extract<Node,{type:'artist-upcoming-events'}>={...events,provider:'tickets'};
// @ts-expect-error No host binding.
const boundEvents:Extract<Node,{type:'artist-upcoming-events'}>={...events,bind:'month'};
void [document,selected,cleared,wrongAmount,boundFlight,booking,missingSource,missingEvents,provider,boundEvents];
