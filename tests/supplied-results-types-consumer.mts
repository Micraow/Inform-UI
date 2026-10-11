import type {Node} from '../dist/index.js';
const tournament:Node={type:'basketball-tournament',label:'Supplied',teams:[],rounds:[]};
const election:Node={type:'election-results',label:'Supplied',contests:[]};
// @ts-expect-error no live provider or external endpoint
const provider:Node={...election,endpoint:'https://example.org'};
// @ts-expect-error outcomes are explicit source labels
const outcome:Node={...election,contests:[{id:'c',label:'C',status:'unknown',reportedPercent:null,totalVotes:null,candidates:[{id:'p',label:'P',votes:null,voteShare:null,outcome:'inferred'}]}]};
// @ts-expect-error winner is required as a supplied ID or explicit null
const missingWinner:Node={...tournament,rounds:[{id:'r',label:'R',matches:[{id:'m',label:'M',status:'unknown',participants:[{teamId:null,score:null},{teamId:null,score:null}]}]}]};
void[tournament,election,provider,outcome,missingWinner];
