import {object,short,string,array,ref,choice,integer,suppliedKey,travelDate,travelTime,flightAt} from '../primitives.mjs';
/** Existing authored travel and tracker declarations, moved without changing wire values. */
export function install({defs,node}){
// Original supplied travel/events contracts. Civil validity and instant ordering are semantic.
defs.TravelEventSource = object({label:short,url:string(2048,1)},['label','url']);
defs.FlightEndpoint = object({airport:{type:'string',pattern:'^[A-Z]{3}$(?![\\s\\S])'},at:flightAt,name:short},['airport','at']);
defs.FlightLeg = object({id:suppliedKey,carrier:short,number:short,departure:ref('FlightEndpoint'),arrival:ref('FlightEndpoint'),cabin:short},['id','carrier','number','departure','arrival']);
node('flight-option',{label:short,optionId:suppliedKey,legs:array(ref('FlightLeg'),1,8),description:string(2000),price:object({amount:{type:'number',minimum:0,maximum:1e12},currency:{type:'string',pattern:'^[A-Z]{3}$(?![\\s\\S])'}},['amount','currency']),note:string(2000),source:ref('TravelEventSource')},['label','optionId','legs']);
defs.ArtistEvent = object({id:suppliedKey,title:short,date:travelDate,venue:short,start:travelTime,timeZoneLabel:short,location:short,description:string(2000),url:string(2048,1)},['id','title','date','venue']);
node('artist-upcoming-events',{artist:short,label:short,events:array(ref('ArtistEvent'),0,40),description:string(2000),source:ref('TravelEventSource')},['artist','events']);
// Original supplied tracker snapshots; operational state is never inferred or fetched.
defs.TrackerSource=object({label:short,url:string(2048,1)},['label','url']);
defs.PackageMilestone=object({id:suppliedKey,label:short,state:choice('complete','current','pending'),occurredAt:flightAt,location:short,description:string(2000)},['id','label','state']);
node('package-tracker',{label:short,description:string(2000),carrier:short,trackingId:short,status:choice('pre-transit','in-transit','out-for-delivery','delivered','exception','unknown'),observedAt:flightAt,destination:short,expectedDelivery:short,milestones:array(ref('PackageMilestone'),0,40),source:ref('TrackerSource')},['label','carrier','trackingId','status','observedAt','milestones']);
defs.TrackedFlightEndpoint=object({airport:{type:'string',pattern:'^[A-Z]{3}$(?![\\s\\S])',minLength:3,maxLength:3},name:short,scheduledAt:flightAt,estimatedAt:flightAt,actualAt:flightAt,terminal:short,gate:short},['airport','scheduledAt']);
defs.FlightUpdate=object({id:suppliedKey,at:flightAt,message:short,kind:choice('information','change','disruption'),description:string(2000)},['id','at','message','kind']);
node('flight-tracker',{label:short,description:string(2000),carrier:short,flightNumber:short,status:choice('scheduled','boarding','departed','landed','cancelled','diverted','unknown'),observedAt:flightAt,departure:ref('TrackedFlightEndpoint'),arrival:ref('TrackedFlightEndpoint'),updates:array(ref('FlightUpdate'),0,40),source:ref('TrackerSource')},['label','carrier','flightNumber','status','observedAt','departure','arrival','updates']);
}
