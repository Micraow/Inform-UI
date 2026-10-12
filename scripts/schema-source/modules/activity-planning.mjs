import {object,short,string,array,ref,choice,bool,suppliedKey,flightAt} from '../primitives.mjs';
/** Existing authored declarations; no change to supplied-data or local interaction semantics. */
export function install({defs,node}){
// Original supplied activity preference matrix and event agenda sidebar.
defs.ActivityParticipant=object({id:suppliedKey,label:short},['id','label']);
defs.ActivityAvailability=object({participantId:suppliedKey,status:choice('available','unavailable','unknown')},['participantId','status']);
defs.ActivityOption=object({id:suppliedKey,label:short,startsAt:flightAt,endsAt:flightAt,location:short,description:string(3000),availability:array(ref('ActivityAvailability'),0,12),source:ref('TravelEventSource')},['id','label','startsAt','endsAt','availability']);
node('shared-activity-planner',{label:short,description:string(2000),participants:array(ref('ActivityParticipant'),1,12),options:array(ref('ActivityOption'),0,20),disabled:bool},['label','participants','options']);
defs.EventAgendaEntry=object({id:suppliedKey,label:short,startsAt:flightAt,endsAt:flightAt,category:short,description:string(3000),speaker:short},['id','label','startsAt','endsAt','category']);
node('event-sidebar',{eventId:suppliedKey,label:short,organizer:short,location:short,startsAt:flightAt,endsAt:flightAt,description:string(5000),agenda:array(ref('EventAgendaEntry'),0,40),source:ref('TravelEventSource')},['eventId','label','startsAt','endsAt','agenda']);
}
