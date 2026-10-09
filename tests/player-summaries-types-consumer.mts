import type {Node} from '../dist/index.js';
const basketball:Node={type:'nba-player-summary',label:'Supplied',player:'Example',records:[]};
const tennis:Node={type:'tennis-player-summary',label:'Supplied',player:'Example',records:[{id:'a',season:'2028',surface:'clay',matches:0,wins:0,losses:0,titles:0,rank:null}]};
// @ts-expect-error no live provider surface
const live:Node={...basketball,providerURL:'https://example.org'};
// @ts-expect-error rank is a supplied number or null, not free text
const rank:Node={...tennis,records:[{id:'a',season:'2028',surface:'clay',matches:0,wins:0,losses:0,titles:0,rank:'1'}]};
// @ts-expect-error per-game values require explicit null for missing values
const missing:Node={type:'nba-player-summary',label:'Supplied',player:'Example',records:[{id:'a',season:'S',team:null,scope:'unknown',games:null}]};
void[basketball,tennis,live,rank,missing];
