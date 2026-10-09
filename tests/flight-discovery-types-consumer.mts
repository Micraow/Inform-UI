import type {Node,FlightSearchDetail,FlightResultDetail} from '../dist/index.js';import type {FlightSearchDetail as BrowserDetail} from '../dist/browser.js';
const search:Node={type:'flight-search-form',label:'Local',airports:[{code:'AAA',label:'A'},{code:'BBB',label:'B'}]};const results:Node={type:'flight-results',label:'Supplied',results:[]};const detail:FlightSearchDetail={componentId:null,origin:'AAA',destination:'BBB',departureDate:'2028-02-29',returnDate:null,travelers:1};const browser:BrowserDetail=detail;const selected:FlightResultDetail={componentId:null,resultId:'r'};
// @ts-expect-error readonly detail
detail.travelers=2;
// @ts-expect-error no search service
const endpoint:Node={...search,endpoint:'https://example.org'};
// @ts-expect-error no booking provider
const booking:Node={...results,bookingUrl:'https://example.org'};
void[search,results,detail,browser,selected,endpoint,booking];
