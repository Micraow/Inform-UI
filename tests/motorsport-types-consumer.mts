import type {Node,MotorsportSessionDetail} from '../dist/index.js';
import type {MotorsportSessionDetail as BrowserSession} from '../dist/browser.js';
const races:Node={type:'f1-races',label:'Supplied',races:[]};
const standings:Node={type:'f1-standings',label:'Supplied',season:2028,standings:[{id:'a',label:'Example',kind:'driver',rank:null,points:0}]};
const detail:MotorsportSessionDetail={componentId:null,raceId:'a',sessionId:'b'};
const browser:BrowserSession=detail;
// @ts-expect-error immutable event payload
detail.sessionId='c';
// @ts-expect-error no live provider runtime
const provider:Node={...races,providerURL:'https://example.org'};
// @ts-expect-error points are supplied numeric values or null
const stringPoints:Node={...standings,standings:[{id:'a',label:'A',kind:'driver',rank:1,points:'25'}]};
void[races,standings,detail,browser,provider,stringPoints];
