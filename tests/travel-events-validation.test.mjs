import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import Ajv from 'ajv/dist/2020.js';
import {validateDocument,evaluateState} from '../dist/index.js';
import {validateDocument as browserValidate} from '../dist/browser.js';
import {leg,flight,event,events,spec} from './travel-events-harness.mjs';
const reject=(input,code,path)=>{for(const validate of [validateDocument,browserValidate]){const r=validate(input);assert.equal(r.ok,false,JSON.stringify(input));if(path)assert.ok(r.issues.some(i=>(!code||i.code===code)&&i.path===path),JSON.stringify(r.issues));}};
const good=input=>{for(const validate of [validateDocument,browserValidate])assert.equal(validate(input).ok,true,JSON.stringify(validate(input)));};
const linked=()=>[leg(),leg({id:'leg2',departure:{airport:'JFK',at:'2028-02-29T07:00-05:00'},arrival:{airport:'ORD',at:'2028-02-29T08:00-06:00'}})];

test('travel/events have one Base owner in full/document/node schemas with strict structural contracts',async()=>{
  const full=JSON.parse(await readFile('src/schema/iui.schema.json','utf8')),index=JSON.parse(await readFile('src/schema/fragments/index.json','utf8'));
  for(const [name,definition]of [['flight-option','FlightOptionNode'],['artist-upcoming-events','ArtistUpcomingEventsNode']]){assert.equal(index.nodeOwners[name],'base');assert.equal(full.$defs.Node.oneOf.filter(x=>x.$ref===`#/$defs/${definition}`).length,1);}
  for(const file of ['iui.schema.json','fragments/base.schema.json','fragments/nodes/base.schema.json']){
    const validate=new Ajv({strict:true}).compile(JSON.parse(await readFile(`src/schema/${file}`,'utf8'))),value=n=>file.includes('/nodes/')?n:spec(n);
    for(const node of [flight(),flight({label:'😀'.repeat(200),description:'😀'.repeat(2000),note:'😀'.repeat(2000),price:{amount:1e12,currency:'ZZZ'},legs:linked()}),events(),events({events:[]}),events({artist:'😀'.repeat(200),label:'😀'.repeat(200),description:'😀'.repeat(2000),events:Array.from({length:40},(_,i)=>event({id:`e${i}`}))})])assert.equal(validate(value(node)),true,JSON.stringify(validate.errors));
    for(const node of [flight({label:''}),flight({label:'😀'.repeat(201)}),flight({label:{$:'other'}}),flight({optionId:''}),flight({optionId:'bad\n'}),flight({legs:[]}),flight({legs:Array.from({length:9},(_,i)=>leg({id:`l${i}`}))}),flight({price:{amount:-1,currency:'USD'}}),flight({price:{amount:1e12+1,currency:'USD'}}),flight({price:{amount:2,currency:'usd'}}),flight({price:{amount:2,currency:'USD\n'}}),flight({price:{amount:'2',currency:'USD'}}),flight({source:{label:'Source'}}),flight({bind:'other'}),flight({initial:true}),flight({bookingUrl:'https://example.com'}),flight({provider:'x'}),events({artist:''}),events({events:Array.from({length:41},(_,i)=>event({id:`e${i}`}))}),events({source:{label:'Source'}}),events({initialMonth:'2028-02'}),events({bind:'other'}),events({fetchUrl:'https://example.com'}),events({events:[event({date:'0999-12-31'})]}),events({events:[event({start:'19:30\n'})]})]){assert.equal(validate(value(node)),false,JSON.stringify(node));reject(spec(node));}
  }
});

test('required fields, wrong types, overbounds and forbidden service/state fields reject',()=>{
  for(const name of ['label','optionId','legs']){const n=flight();delete n[name];reject(spec(n));reject(spec(flight({[name]:null})));}
  for(const name of ['id','carrier','number','departure','arrival']){const n=leg();delete n[name];reject(spec(flight({legs:[n]})));}
  for(const side of ['departure','arrival'])for(const name of ['airport','at']){const n=leg();delete n[side][name];reject(spec(flight({legs:[n]})));}
  for(const name of ['artist','events']){const n=events();delete n[name];reject(spec(n));reject(spec(events({[name]:null})));}
  for(const name of ['id','title','date','venue']){const n=event();delete n[name];reject(spec(events({events:[n]})));}
  for(const node of [flight({price:{amount:Infinity,currency:'USD'}}),flight({price:{amount:NaN,currency:'USD'}}),flight({note:'x'.repeat(2001)}),flight({source:{label:'s',url:''}}),events({label:null}),events({events:[event({venue:'x'.repeat(201)})]}),events({events:[event({date:'2028-02-29',url:null})]}),events({events:[event({start:'24:00'})]}),events({events:[event({start:'09:60'})]}),events({events:[event({start:'09:30Z'})]}),events({events:[event({date:'2028-02-29\n'})]})])reject(spec(node));
  for(const unknown of ['disabled','action','persist','ticketing','account']){reject(spec(flight({[unknown]:true})));reject(spec(events({[unknown]:true})));}
  for(const airport of ['lhr','AB','ABCD','LHR\n',' LHR','123','机场'])reject(spec(flight({legs:[leg({departure:{airport,at:'2028-02-29T09:00Z'}})]})));
  for(const id of ['','1bad','a'.repeat(81),'bad\n']){reject(spec(flight({legs:[leg({id})]})));reject(spec(events({events:[event({id})]})));}
});

test('strict explicit Gregorian civil validation rejects normalization with exact endpoint/event paths',()=>{
  for(const date of ['1000-01-01','1900-02-28','2000-02-29','2028-02-29','9999-12-31']){
    good(spec(flight({legs:[leg({departure:{airport:'AAA',at:`${date}T00:00Z`},arrival:{airport:'BBB',at:`${date}T00:01Z`}})]})));good(spec(events({events:[event({date})]})));
  }
  for(const date of ['1900-02-29','2001-02-29','2028-02-30','2028-04-31']){
    reject(spec(flight({legs:[leg({departure:{airport:'AAA',at:`${date}T00:00Z`}})]})),'FLIGHT_TIME','/body/0/legs/0/departure/at');
    reject(spec(flight({legs:[leg({arrival:{airport:'BBB',at:`${date}T12:00Z`}})]})),'FLIGHT_TIME','/body/0/legs/0/arrival/at');
    reject(spec(events({events:[event({date})]})),'ARTIST_EVENT_DATE','/body/0/events/0/date');
  }
  for(const at of ['0999-12-31T23:59Z','0000-01-01T00:00Z','10000-01-01T00:00Z','2028-02-29T24:00Z','2028-02-29T09:60Z','2028-02-29T09:00','2028-02-29T09:00z','2028-02-29T09:00:00Z','2028-02-29T09:00:00.123Z','2028-02-29T09:00+14:01','2028-02-29T09:00-14:59','2028-02-29T09:00+15:00','2028-02-29T09:00+01:60','2028-02-29T09:00+1400','2028-02-29T09:00Z\n',' 2028-02-29T09:00Z'])reject(spec(flight({legs:[leg({departure:{airport:'AAA',at}})]})),undefined,'/body/0/legs/0/departure/at');
});

test('instant chronology uses offsets, preserves caller order, and permits exact connection boundaries',()=>{
  good(spec(flight({legs:linked()})));
  good(spec(flight({legs:[leg({departure:{airport:'AAA',at:'2028-02-29T23:59+14:00'},arrival:{airport:'BBB',at:'2028-02-29T00:00-14:00'}})]})));
  good(spec(flight({legs:[leg({departure:{airport:'AAA',at:'2028-02-29T00:00-00:00'},arrival:{airport:'BBB',at:'2028-02-29T00:01+00:00'}})]})));
  for(const at of ['2028-02-29T12:00+03:00','2028-02-29T11:59+03:00'])reject(spec(flight({legs:[leg({arrival:{airport:'BBB',at}})]})),'FLIGHT_ORDER','/body/0/legs/0/arrival/at');
  const n=linked();n[1].departure.at='2028-02-29T07:59-04:00';reject(spec(flight({legs:n})),'FLIGHT_ORDER','/body/0/legs/1/departure/at');
  const reverse=linked().reverse();reject(spec(flight({legs:reverse})),'FLIGHT_ORDER','/body/0/legs/1/departure/at');
  const duplicate=linked();duplicate[1].id='leg1';reject(spec(flight({legs:duplicate})),'DUPLICATE_ID','/body/0/legs/1/id');
  reject(spec(events({events:[event(),event()]})),'DUPLICATE_ID','/body/0/events/1/id');
  good(spec(events({events:[event(),event({id:'second'})]}))); // Repeated supplied dates/venues are legal.
});

test('supplied HTTP(S) links reuse safe core URL rules and exact negative paths',()=>{
  for(const url of ['https://example.com/details?q=1#event','HTTP://example.com:8080/path']){good(spec(flight({source:{label:'Source',url}})));good(spec(events({source:{label:'Source',url},events:[event({url})]})));}
  for(const url of ['javascript:alert(1)','//example.com','/relative','#fragment','mailto:a@example.com','tel:+123','https://u:p@example.com','https://example.com/ path','https://example.com\\escape',' https://example.com','data:text/html,x','https://example.com/\n']){
    reject(spec(flight({source:{label:'Source',url}})),'UNSAFE_URL','/body/0/source/url');reject(spec(events({source:{label:'Source',url}})),'UNSAFE_URL','/body/0/source/url');reject(spec(events({events:[event({url})]})),'UNSAFE_URL','/body/0/events/0/url');
  }
  reject(spec({type:'section',children:[events({events:[event({date:'2001-02-29'})]})]}),'ARTIST_EVENT_DATE','/body/0/children/0/events/0/date');
});

test('validation is immutable, has no host bindings, and evaluates unrelated state safely',()=>{
  const input=spec(),original=JSON.stringify(input);const freeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}};freeze(input);
  const result=validateDocument(input);assert.equal(result.ok,true);assert.equal(Object.isFrozen(result.document.body[0].legs),true);assert.equal(JSON.stringify(input),original);assert.equal(evaluateState(input,{other:1}).ok,true);
});

test('all eight supplied legs and maximum Unicode text remain valid without implicit route sorting',()=>{
  const legs=Array.from({length:8},(_,i)=>leg({id:`leg${i}`,carrier:'😀'.repeat(200),number:'😀'.repeat(200),cabin:'😀'.repeat(200),departure:{airport:'AAA',at:`2028-02-29T${String(i).padStart(2,'0')}:00+14:00`,name:'😀'.repeat(200)},arrival:{airport:'BBB',at:`2028-02-29T${String(i+1).padStart(2,'0')}:00+14:00`,name:'😀'.repeat(200)}}));
  good(spec(flight({legs})));good(spec(events({events:[event({id:'max',title:'😀'.repeat(200),venue:'😀'.repeat(200),timeZoneLabel:'😀'.repeat(200),location:'😀'.repeat(200),description:'😀'.repeat(2000)})]})));
  reject(spec(events({events:[event({description:'😀'.repeat(2001)})]})));
});
