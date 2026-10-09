import type {PackageTrackerNode,FlightTrackerNode} from '../schema/document.js';
import type {RendererContext} from './context.js';
import type {TrackerLabels} from './tracker-labels.js';
let serial=0;
/** Local filters and native reading affordances only; never polls or derives a current status. */
export function renderTracker(c:RendererContext,n:PackageTrackerNode|FlightTrackerNode,t:TrackerLabels):HTMLElement {
 const e=c.element,root=e('section',`iui-tracker iui-${n.type}`),base=`iui-tracker-internal-${c.prefix}${++serial}`,shipment=n.type==='package-tracker';root.dir='auto';
 const title=e('h2','iui-tracker-title',n.label);title.id=base+'-title';root.setAttribute('aria-labelledby',title.id);root.append(title);
 if(n.description!==undefined)root.append(e('p','iui-tracker-description',n.description));
 const note=e('p','iui-tracker-note',shipment?t.packageNote:t.flightNote);note.id=base+'-note';root.setAttribute('aria-describedby',note.id);root.append(note);
 const status=e('p','iui-tracker-status',(shipment?t.packageStatus:t.flightStatus)[n.status]);status.dataset.status=n.status;root.append(status);
 const time=(value:string)=>{const node=e('time','iui-tracker-time',value);node.dateTime=value;node.dir='ltr';return node;};
 const observation=e('p','iui-tracker-observed');observation.append(c.doc.createTextNode(t.observed+': '),time(n.observedAt));root.append(observation);
 const facts=e('dl','iui-tracker-facts');const fact=(label:string,value:string)=>{const row=e('div');row.append(e('dt','',label),e('dd','',value));facts.append(row);};
 fact(t.carrier,n.carrier);
 if(n.type==='package-tracker'){
  fact(t.tracking,n.trackingId);if(n.destination!==undefined)fact(t.destination,n.destination);if(n.expectedDelivery!==undefined)fact(t.expected,n.expectedDelivery);root.append(facts);
 }else{
  fact(t.flight,n.flightNumber);root.append(facts);const route=e('div','iui-tracker-route');
  for(const [label,endpoint] of [[t.departure,n.departure],[t.arrival,n.arrival]] as const){
   const card=e('section','iui-tracker-endpoint'),heading=e('h3','',label);heading.id=base+(label===t.departure?'-departure':'-arrival');card.setAttribute('aria-labelledby',heading.id);const airport=e('p','iui-tracker-airport',endpoint.airport);airport.dir='ltr';card.append(heading,airport);if(endpoint.name!==undefined)card.append(e('p','iui-tracker-airport-name',endpoint.name));
   const slots=e('dl','iui-tracker-slots');for(const [key,text] of [['scheduledAt',t.scheduled],['estimatedAt',t.estimated],['actualAt',t.actual]] as const){const row=e('div'),value=e('dd'),supplied=endpoint[key];row.append(e('dt','',text),value);value.append(supplied===undefined?e('span','iui-tracker-missing',t.notSupplied):time(supplied));slots.append(row);}card.append(slots);
   for(const [key,text] of [['terminal',t.terminal],['gate',t.gate]] as const)if(endpoint[key]!==undefined)card.append(e('p','iui-tracker-terminal',`${text}: ${endpoint[key]}`));route.append(card);
  }root.append(route);
 }
 const heading=e('h3','iui-tracker-records-title',shipment?t.milestones:t.updates);root.append(heading);
 const categories=shipment?t.milestoneState:t.updateKind,toolbar=e('div','iui-tracker-toolbar'),label=e('label','',t.filter),filter=e('select','iui-tracker-filter'),reset=e('button','iui-tracker-reset',t.reset);filter.id=base+'-filter';label.htmlFor=filter.id;reset.type='button';
 for(const [value,text] of [['',t.all],...Object.entries(categories)]){const option=e('option','',text);option.value=value;option.defaultSelected=value==='';filter.append(option);}toolbar.append(label,filter,reset);root.append(toolbar);
 const count=e('p','iui-tracker-count');count.setAttribute('role','status');count.setAttribute('aria-live','polite');count.setAttribute('aria-atomic','true');const empty=e('p','iui-tracker-empty'),list=e('ol','iui-tracker-timeline');list.setAttribute('role','list');root.append(count,empty,list);
 const records=n.type==='package-tracker'?n.milestones.map(x=>({id:x.id,label:x.label,category:x.state,at:x.occurredAt,location:x.location,description:x.description})):n.updates.map(x=>({id:x.id,label:x.message,category:x.kind,at:x.at,location:undefined,description:x.description}));
 const rows=records.map(record=>{const item=e('li','iui-tracker-record');item.dataset.recordId=record.id;item.dataset.category=record.category;const dot=e('span','iui-tracker-dot');dot.setAttribute('aria-hidden','true');const content=e('div','iui-tracker-record-body'),title=e('h4','',record.label);content.append(e('span','iui-tracker-record-kind',categories[record.category]),title);if(record.at!==undefined)content.append(time(record.at));if(record.location!==undefined)content.append(e('p','iui-tracker-location',record.location));if(record.description!==undefined){const details=e('details','iui-tracker-details');details.append(e('summary','',t.details),e('p','',record.description));content.append(details);}item.append(dot,content);list.append(item);return{item,category:record.category};});
 if(n.source){const source=e('p','iui-tracker-source'),link=e('a','',`${n.source.label} (${t.newTab})`);link.href=n.source.url;link.target='_blank';link.rel='noopener noreferrer';link.referrerPolicy='no-referrer';source.append(c.doc.createTextNode(t.source+': '),link);root.append(source);}
 let alive=true,value='',revision=0,resetRoot:EventTarget|undefined;
 const blocked=(control:HTMLElement=filter)=>!alive||!root.isConnected||!control.isConnected||!root.contains(control)||control.matches(':disabled')||!!control.closest('[hidden],[inert]');
 const paint=()=>{if(!alive)return;filter.value=value;let shown=0;for(const row of rows){row.item.hidden=value!==''&&row.category!==value;if(!row.item.hidden)shown++;}count.textContent=t.count(shown,rows.length);empty.hidden=shown>0;empty.textContent=rows.length?t.noMatch:t.empty;reset.setAttribute('aria-disabled',String(value===''));};
 c.on(filter,'change',()=>{if(!alive)return;if(blocked()||filter.selectedIndex<0||(filter.value!==''&&!Object.hasOwn(categories,filter.value))){paint();return;}value=filter.value;revision++;paint();});
 c.on(reset,'click',()=>{if(blocked(reset)||value==='')return;value='';revision++;paint();});
 const onReset=(event:Event)=>{if(!alive||event.target!==filter.form||!filter.form)return;const form=filter.form,before=revision,allowed=!blocked();queueMicrotask(()=>{if(!alive||!root.isConnected||filter.form!==form)return;if(!event.defaultPrevented&&allowed&&!blocked()&&before===revision){value='';revision++;}paint();});};
 c.doc.addEventListener('reset',onReset,true);c.bind(()=>{const tree=root.getRootNode(),next=tree!==c.doc&&tree.nodeType===11?tree:undefined;if(next===resetRoot)return;resetRoot?.removeEventListener('reset',onReset,true);resetRoot=next;resetRoot?.addEventListener('reset',onReset,true);});
 c.cleanup(()=>{alive=false;c.doc.removeEventListener('reset',onReset,true);resetRoot?.removeEventListener('reset',onReset,true);});paint();return root;
}
