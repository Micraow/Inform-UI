import {object,short,string,array,ref,choice,integer,bool,suppliedKey,flightAt} from '../primitives.mjs';
/** Existing authored declarations; supplied facts and runtime semantics are unchanged. */
export function install({defs,node}){
// Supplied motorsport snapshots: no live providers or inferred scoring rules.
defs.MotorsportSession=object({id:suppliedKey,label:short,kind:choice('practice','qualifying','sprint','race','other'),status:choice('scheduled','complete','cancelled','postponed','unknown'),startsAt:{anyOf:[flightAt,{type:'null'}]},endsAt:flightAt,note:string(2000)},['id','label','kind','status','startsAt']);
defs.MotorsportRace=object({id:suppliedKey,label:short,season:integer(1900,9999),round:integer(1,1000),circuit:short,location:short,sessions:array(ref('MotorsportSession'),0,20),source:ref('TravelEventSource')},['id','label','season','round','circuit','location','sessions']);
node('f1-races',{label:short,description:string(3000),races:array(ref('MotorsportRace'),0,80),disabled:bool},['label','races'],'sports');
defs.MotorsportStanding=object({id:suppliedKey,label:short,kind:choice('driver','constructor'),team:short,rank:{anyOf:[integer(1,1000),{type:'null'}]},points:{anyOf:[{type:'number',minimum:-1000000,maximum:1000000},{type:'null'}]},wins:{anyOf:[integer(0,10000),{type:'null'}]},note:string(2000),source:ref('TravelEventSource')},['id','label','kind','rank','points']);
node('f1-standings',{label:short,description:string(3000),season:integer(1900,9999),observedAt:flightAt,standings:array(ref('MotorsportStanding'),0,100)},['label','season','standings'],'sports');
}
