import type {ArtistUpcomingEventsNode} from '../schema/document.js';
import type {RendererContext} from './context.js';
import type {TravelEventsLabels} from './travel-events-labels.js';
import {travelLink,travelSource} from './travel-events-shared.js';

let serial = 0;
/** Supplied-order reader with an unbound, page-local month filter. */
export function renderArtistEvents(c: RendererContext, n: ArtistUpcomingEventsNode, t: TravelEventsLabels): HTMLElement {
  const root = c.element('section','iui-artist-events'), base = `iui-events-internal-${c.prefix}${++serial}`; root.dir = 'auto';
  const artist = c.element('h2','iui-events-artist',n.artist); artist.id = `${base}-artist`;
  const label = c.element('p','iui-events-label',n.label ?? t.eventsLabel); label.id = `${base}-label`;
  root.setAttribute('aria-labelledby',`${artist.id} ${label.id}`); root.append(artist,label);
  if (n.description !== undefined) root.append(c.element('p','iui-events-description',n.description));
  const disclosure = c.element('p','iui-travel-disclosure',t.eventsDisclosure); disclosure.id = `${base}-disclosure`; root.append(disclosure); root.setAttribute('aria-describedby',disclosure.id);
  const months = [...new Set(n.events.map(event=>event.date.slice(0,7)))];
  let select: HTMLSelectElement | undefined;
  if (months.length > 1) {
    const controls = c.element('div','iui-events-controls'), filterLabel = c.element('label','',t.filter); select=c.element('select','iui-events-filter');
    select.id = `${base}-filter`; filterLabel.htmlFor=select.id;
    const all = c.element('option','',t.allMonths); all.value=''; all.defaultSelected=true; select.append(all);
    for (const month of months) {const option=c.element('option','',month);option.value=month;select.append(option);}
    controls.append(filterLabel,select);root.append(controls);
  }
  const count = c.element('p','iui-events-count'); count.setAttribute('role','status');count.setAttribute('aria-live','polite');count.setAttribute('aria-atomic','true');
  const empty = c.element('p','iui-events-empty'), list = c.element('ul','iui-events-list'); list.setAttribute('role','list'); root.append(count,empty,list);
  const mounted = n.events.map(event=>{
    const item=c.element('li','iui-events-item'); item.dataset.eventId=event.id;
    item.append(c.element('h3','iui-events-title',event.title));
    const date=c.element('time','iui-events-date',event.date);date.dateTime=event.date;date.dir='ltr';
    const timing=c.element('p','iui-events-timing');timing.append(date);
    if (event.start !== undefined) {const time=c.element('time','iui-events-time',event.start);time.dateTime=event.start;time.dir='ltr';timing.append(c.doc.createTextNode(' · '),time);}
    item.append(timing,c.element('p','iui-events-venue',event.venue));
    if (event.timeZoneLabel !== undefined) item.append(c.element('p','iui-events-time-zone',`${t.timeZone}: ${event.timeZoneLabel}`));
    if (event.location !== undefined) item.append(c.element('p','iui-events-location',event.location));
    if (event.description !== undefined) {const details=c.element('details','iui-events-details');details.append(c.element('summary','',t.eventDetails),c.element('p','',event.description));item.append(details);}
    if (event.url !== undefined) item.append(travelLink(c,event.url,t.eventLink,t));
    list.append(item);return {item,month:event.date.slice(0,7)};
  });
  if (n.source) root.append(travelSource(c,n.source,t));
  let month='',alive=true,revision=0,resetRoot: EventTarget | undefined;
  function paint(): void {
    if (select) select.value=month;
    let visible=0;
    for (const entry of mounted) {entry.item.hidden=month!==''&&month!==entry.month;if (!entry.item.hidden) visible++;}
    count.textContent=t.count(visible,mounted.length);empty.hidden=visible>0;empty.textContent=mounted.length===0?t.empty:t.noMatch;
  }
  const blocked = () => !alive || !root.isConnected || !!select && (!select.isConnected || !root.contains(select)) || !!select?.matches(':disabled') || !!(select??root).closest('[hidden],[inert]');
  if (select) {
    const filter=select;
    c.on(filter,'change',()=>{
      if (!alive) return;
      if (blocked() || filter.selectedIndex<0 || (filter.value!==''&&!months.includes(filter.value))) {filter.value=month;return;}
      month=filter.value;revision++;paint();
    });
    // Native reset dispatch precedes its default action and later cancellation listeners.
    // Reconcile after that action, without cancelling an enclosing form's own reset.
    const reset = (event:Event) => {
      if (!alive || !root.isConnected || event.target!==filter.form) return;
      const form=filter.form, before=revision, allowed=!blocked();
      queueMicrotask(()=>{
        if (!alive || !root.isConnected || event.defaultPrevented || filter.form!==form || revision!==before) return;
        if (allowed && !blocked()) month='';paint();
      });
    };
    c.on(c.doc,'reset',reset);
    // A reset inside a shadow tree does not bubble to ownerDocument.
    c.bind(()=>{
      const tree=root.getRootNode();
      const next=tree!==c.doc && tree.nodeType===11 ? tree : undefined;
      if (next===resetRoot) return;
      resetRoot?.removeEventListener('reset',reset);resetRoot=next;resetRoot?.addEventListener('reset',reset);
    });
    c.cleanup(()=>{resetRoot?.removeEventListener('reset',reset);resetRoot=undefined;});
  }
  c.cleanup(()=>{alive=false;});paint();return root;
}
