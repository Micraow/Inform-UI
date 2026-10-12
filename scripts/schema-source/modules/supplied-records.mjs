import {object,key,short,string,array,ref,choice,bool,integer,agendaDate,agendaTime} from '../primitives.mjs';
/** Original authored supplied-record definitions, moved from the canonical source. */
export function install({defs,node}){
// Finite supplied agenda labels; semantic validation checks real dates and time ordering.
defs.AgendaEvent = object({ id:key, date:agendaDate, title:short, start:agendaTime, end:agendaTime, location:string(500), description:string(2000), status:choice('planned','cancelled'), url:string(2048,1) }, ['id','date','title']);
defs.AgendaEvent.oneOf = [
  object(defs.AgendaEvent.properties, ['start']),
  object({ ...defs.AgendaEvent.properties, start:false, end:false })
];
node('agenda', { label:short, description:string(2000), events:array(ref('AgendaEvent'),0,100) }, ['label','events']);
// Supplied, literal person information only; semantic checks own IDs and URL policy.
defs.PersonFact = object({ id:key, label:short, value:string(2000,1) }, ['id','label','value']);
defs.PersonLink = object({ id:key, label:short, url:string(2048,1) }, ['id','label','url']);
defs.PersonSource = object({ label:short, url:string(2048,1) }, ['label']);
node('person-profile', { name:short, role:short, organization:short, location:short, biography:string(6000), expanded:bool, facts:array(ref('PersonFact'),0,12), links:array(ref('PersonLink'),0,8), source:ref('PersonSource') }, ['name']);
// Original finite article supplied by the author; no ingestion, verification or runtime state.
node('news-article', { headline:string(300,1), source:object({label:short,url:string(2048,1)},['label']), summary:string(4000), author:short, published:agendaDate, paragraphs:array(string(4000,1),0,30), expanded:bool, tags:array(string(40,1),0,8) }, ['headline','source']);
// A finite supplied collection, with explicit nullable ratings and strict calendar labels.
defs.ReviewRecord = object({ id:{...key,pattern:'^[A-Za-z_][A-Za-z0-9_.-]{0,79}$(?![\\s\\S])'}, author:short, body:string(4000,1), rating:{anyOf:[integer(1,5),{type:'null'}]}, date:{...agendaDate,minLength:10,maxLength:10}, title:short, url:string(2048,1) }, ['id','author','body','rating']);
defs.ReviewSource = object({label:short,url:string(2048,1)}, ['label']);
node('entity-reviews', {label:short,description:string(2000),source:ref('ReviewSource'),items:array(ref('ReviewRecord'),0,50)}, ['label','items']);
}
