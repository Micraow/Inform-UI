import type {Node} from '../dist/index.js';
const nba:Node={type:'nba-game-boxscore',label:'Supplied',status:'unknown',teams:[{id:'a',label:'A',score:null,players:[]},{id:'b',label:'B',score:0,players:[]}],periods:[]};
const cricket:Node={type:'cricket-match-boxscore',label:'Supplied',status:'unknown',teams:[{id:'a',label:'A'},{id:'b',label:'B'}],innings:[]};
// @ts-expect-error no live provider runtime
const provider:Node={...nba,providerURL:'https://example.org'};
// @ts-expect-error totals are supplied numeric values or null
const textScore:Node={...nba,teams:[{id:'a',label:'A',score:'99',players:[]}]};
// @ts-expect-error unknown status is explicit, not omitted
const missing:Node={type:'cricket-match-boxscore',label:'Supplied',teams:[],innings:[]};
void[nba,cricket,provider,textScore,missing];
