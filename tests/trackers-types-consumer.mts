import type {Node} from '../dist/index.js';
import type {Node as BrowserNode} from '../dist/browser.js';
const packageNode:Node={type:'package-tracker',label:'Snapshot',carrier:'Example',trackingId:'X',status:'unknown',observedAt:'2028-02-29T10:00Z',milestones:[]};
const flightNode:BrowserNode={type:'flight-tracker',label:'Flight',carrier:'Example',flightNumber:'EX 1',status:'scheduled',observedAt:'2028-02-29T10:00Z',departure:{airport:'AAA',scheduledAt:'2028-02-29T10:00Z'},arrival:{airport:'BBB',scheduledAt:'2028-02-29T11:00Z'},updates:[]};
// @ts-expect-error no provider polling
const endpoint:Node={...packageNode,endpoint:'https://example.org/poll'};
// @ts-expect-error no host binding
const binding:Node={...flightNode,bind:'status'};
// @ts-expect-error estimated time cannot replace required scheduled time
const missing:Node={...flightNode,departure:{airport:'AAA',estimatedAt:'2028-02-29T10:00Z'}};
// @ts-expect-error status is bounded, never an arbitrary renderer action
const action:Node={...packageNode,status:'send-notification'};
void[packageNode,flightNode,endpoint,binding,missing,action];
