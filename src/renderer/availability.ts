import type {RestaurantAvailabilityNode, RestaurantAvailabilitySlot} from '../schema/document.js';
import type {RendererContext} from './context.js';
import type {AvailabilityLabels} from './availability-labels.js';
import {sortAvailability} from '../core/availability.js';

/** Local intent only. This event neither requests nor confirms a reservation. */
export interface ReservationChoiceDetail {
  readonly componentId: string | null;
  readonly slotId: string;
  readonly date: string;
  readonly time: string;
  readonly partySize: number;
  readonly venue: string;
  readonly timeZoneLabel: string;
}
let serial = 0;
export function renderAvailability(c: RendererContext, n: RestaurantAvailabilityNode, labels: AvailabilityLabels): HTMLElement {
  const out = c.element('section', 'iui-availability');
  const base = `iui-availability-internal-${c.prefix}${++serial}`;
  const title = c.element('h2', 'iui-availability-title', n.title); title.id = `${base}-title`;
  out.setAttribute('aria-labelledby', title.id); out.append(title);
  if (n.description !== undefined) out.append(c.element('p', 'iui-availability-description', n.description));
  const facts = c.element('dl', 'iui-availability-facts');
  for (const [label, value, cls] of [[labels.venue,n.venue,'venue'],[labels.partySize,n.partySize,'party-size'],[labels.timeZone,n.timeZoneLabel,'time-zone']] as const) {
    const pair = c.element('div'); pair.append(c.element('dt','',label),c.element('dd',`iui-availability-${cls}`,value)); facts.append(pair);
  }
  out.append(facts);
  const note = c.element('p','iui-availability-note',labels.disclosure); note.id = `${base}-note`;
  out.append(note); out.setAttribute('aria-describedby',note.id);
  const toolbar = c.element('div','iui-availability-toolbar');
  const label = c.element('label','',labels.filter), select = c.element('select','iui-availability-filter');
  select.id = `${base}-filter`; label.htmlFor = select.id;
  const all = c.element('option','',labels.allDates); all.value = ''; select.append(all);
  const sorted = sortAvailability(n.slots), dates = [...new Set(sorted.map(slot=>slot.date))];
  for (const date of dates) { const option = c.element('option','',date); option.value = date; select.append(option); }
  select.disabled = dates.length === 0;
  const clear = c.element('button','iui-availability-clear',labels.clear); clear.type = 'button';
  toolbar.append(label,select,clear); out.append(toolbar);
  const counts = c.element('p','iui-availability-counts'), empty = c.element('p','iui-availability-empty');
  counts.setAttribute('role','status'); counts.setAttribute('aria-live','polite'); counts.setAttribute('aria-atomic','true');
  const selection = c.element('p','iui-availability-selection'), status = c.element('p','iui-availability-status');
  selection.id = `${base}-selection`; clear.setAttribute('aria-describedby',selection.id);
  status.setAttribute('role','status'); status.setAttribute('aria-live','polite'); status.setAttribute('aria-atomic','true');
  out.append(counts,selection,status,empty);
  const list = c.element('ul','iui-availability-slots'); out.append(list);
  let selected: RestaurantAvailabilitySlot | undefined, dateFilter = '', alive = true, dispatching = false;
  const mounted = sorted.map(slot => {
    const row = c.element('li','iui-availability-slot'); row.dataset.slotId = slot.id;
    const button = c.element('button','iui-availability-choice'); button.type = 'button'; button.disabled = !slot.available;
    button.setAttribute('aria-describedby',note.id);
    const date = c.element('time','iui-availability-date',slot.date); date.dateTime = slot.date; date.dir = 'ltr';
    const time = c.element('time','iui-availability-time',slot.time); time.dateTime = `${slot.date}T${slot.time}`; time.dir = 'ltr';
    button.append(date,c.doc.createTextNode(' '),time,c.element('span','iui-availability-slot-status',slot.available ? labels.available : labels.unavailable));
    row.append(button); list.append(row);
    c.on(button,'click',()=>{
      if (!alive || dispatching || !out.isConnected || !slot.available || button.matches(':disabled') || button.closest('[hidden]')) return;
      dispatching = true;
      try {
        const detail: ReservationChoiceDetail = Object.freeze({componentId:n.id??null,slotId:slot.id,date:slot.date,time:slot.time,partySize:n.partySize,venue:n.venue,timeZoneLabel:n.timeZoneLabel});
        const EventConstructor = c.doc.defaultView?.CustomEvent;
        let event: CustomEvent<ReservationChoiceDetail>;
        if (typeof EventConstructor === 'function') event = new EventConstructor('iui:reservation-choice',{detail,bubbles:true,cancelable:true,composed:false});
        else { event = c.doc.createEvent('CustomEvent'); event.initCustomEvent('iui:reservation-choice',true,true,detail); }
        // Even host-owned constructor/getter hooks may replace this tree.
        if (!alive || !out.isConnected) return;
        const accepted = out.dispatchEvent(event);
        // A host may synchronously replace/dispose this component during dispatch.
        if (!alive || !out.isConnected) return;
        if (accepted) { selected = slot; status.textContent = labels.localChoice; out.dataset.status = 'selected'; }
        else { status.textContent = labels.notAccepted; out.dataset.status = 'not-accepted'; }
        paint();
      } finally { dispatching = false; }
    });
    return {slot,row,button};
  });
  const paint = () => {
    for (const option of select.options) option.defaultSelected = option.value === dateFilter;
    select.value = dateFilter;
    let visible = 0, available = 0;
    for (const {slot,row,button} of mounted) {
      row.hidden = dateFilter !== '' && dateFilter !== slot.date;
      button.setAttribute('aria-pressed',String(selected?.id === slot.id));
      if (!row.hidden) { visible++; if (slot.available) available++; }
    }
    counts.textContent = labels.counts(visible,available,visible-available);
    empty.hidden = visible > 0; empty.textContent = sorted.length === 0 ? labels.empty : labels.noMatch;
    selection.textContent = labels.noSelection;
    if (selected) {
      const date = c.element('time','',selected.date); date.dateTime = selected.date; date.dir = 'ltr';
      const time = c.element('time','',selected.time); time.dateTime = `${selected.date}T${selected.time}`; time.dir = 'ltr';
      selection.replaceChildren(c.doc.createTextNode(`${labels.selected}: `),date,c.doc.createTextNode(' '),time,c.doc.createTextNode(` (${n.timeZoneLabel})`));
    }
    clear.setAttribute('aria-disabled',String(selected === undefined));
  };
  c.on(select,'change',()=>{
    if (!alive) return;
    if (dispatching || !out.isConnected || select.matches(':disabled') || select.closest('[hidden]') || select.selectedIndex < 0 || (select.value !== '' && !dates.includes(select.value))) { paint(); return; }
    dateFilter = select.value; paint();
  });
  c.on(clear,'click',()=>{
    if (!alive || dispatching || !out.isConnected || !selected || clear.matches(':disabled') || clear.closest('[hidden]')) return;
    selected = undefined; status.textContent = ''; out.dataset.status = 'idle'; paint();
  });
  if (n.source) {
    const source = c.element('p','iui-availability-source'); source.append(c.doc.createTextNode(`${labels.source}: `));
    if (n.source.url === undefined) source.append(c.element('span','',n.source.label));
    else {
      const link = c.element('a','',`${n.source.label} (${labels.opensNewTab})`); link.href = n.source.url;
      link.target = '_blank'; link.rel = 'noopener noreferrer'; link.referrerPolicy = 'no-referrer';
      source.append(link);
    }
    out.append(source);
  }
  c.cleanup(()=>{ alive = false; });
  out.dataset.status = 'idle'; paint(); return out;
}
