import type {FlightOptionNode} from '../schema/document.js';
import {flightInstant} from '../core/travel-events.js';
import type {RendererContext} from './context.js';
import type {TravelEventsLabels} from './travel-events-labels.js';
import {travelSource} from './travel-events-shared.js';

/** Explicit local choice or clear. This is never a booking or provider request. */
export interface FlightChoiceDetail { readonly id: string | null; readonly optionId: string | null }
let serial = 0;
export function renderFlightOption(c: RendererContext, n: FlightOptionNode, t: TravelEventsLabels): HTMLElement {
  const root = c.element('section','iui-flight-option'), base = `iui-flight-internal-${c.prefix}${++serial}`;
  root.dir = 'auto';
  const title = c.element('h2','iui-flight-title',n.label); title.id = `${base}-title`; root.setAttribute('aria-labelledby',title.id); root.append(title);
  if (n.description !== undefined) root.append(c.element('p','iui-flight-description',n.description));
  const disclosure = c.element('p','iui-travel-disclosure',t.flightDisclosure); disclosure.id = `${base}-disclosure`; root.setAttribute('aria-describedby',disclosure.id); root.append(disclosure);
  if (n.price) {const price = c.element('p','iui-flight-price'); price.append(c.doc.createTextNode(`${t.suppliedPrice}: `),c.element('bdi','',`${n.price.amount} ${n.price.currency}`)); root.append(price);}
  const list = c.element('ol','iui-flight-legs'); list.setAttribute('role','list'); root.append(list);
  for (const leg of n.legs) {
    const item = c.element('li','iui-flight-leg'); item.dataset.legId = leg.id;
    item.append(c.element('h3','iui-flight-carrier',`${leg.carrier} ${leg.number}`));
    const route = c.element('p','iui-flight-route',`${leg.departure.airport} → ${leg.arrival.airport}`); route.dir = 'ltr'; item.append(route);
    const details = c.element('details','iui-flight-details'); details.append(c.element('summary','',t.legDetails));
    const facts = c.element('dl','iui-flight-facts');
    for (const [label,endpoint] of [[t.departure,leg.departure],[t.arrival,leg.arrival]] as const) {
      const time = c.element('time','iui-flight-time',endpoint.at); time.dateTime = endpoint.at; time.dir = 'ltr';
      // The full supplied timestamp, including Z or ±HH:mm, is always visible outside disclosure.
      const row = c.element('p','iui-flight-endpoint'); row.append(c.doc.createTextNode(`${label}: `),time); item.append(row);
      const pair = c.element('div'); pair.append(c.element('dt','',label),c.element('dd','',endpoint.name === undefined ? endpoint.airport : `${endpoint.airport} · ${endpoint.name}`)); facts.append(pair);
    }
    if (leg.cabin !== undefined) {const pair = c.element('div');pair.append(c.element('dt','',t.cabin),c.element('dd','',leg.cabin));facts.append(pair);}
    item.append(c.element('p','iui-flight-duration',t.duration((flightInstant(leg.arrival.at)-flightInstant(leg.departure.at))/60_000)));
    details.append(facts); item.append(details); list.append(item);
  }
  if (n.note !== undefined) root.append(c.element('p','iui-flight-note',n.note));
  const controls = c.element('div','iui-flight-controls'), select = c.element('button','iui-flight-select',t.select), clear = c.element('button','iui-flight-clear',t.clear);
  select.type = clear.type = 'button';
  const selection = c.element('p','iui-flight-selection',t.noSelection); selection.id = `${base}-selection`;
  const status = c.element('p','iui-flight-status'); status.setAttribute('role','status'); status.setAttribute('aria-live','polite'); status.setAttribute('aria-atomic','true');
  for (const button of [select,clear]) button.setAttribute('aria-describedby',`${disclosure.id} ${selection.id}`);
  controls.append(select,clear); root.append(controls,selection,status);
  if (n.source) root.append(travelSource(c,n.source,t));
  let selected = false, alive = true, dispatching = false;
  c.cleanup(()=>{alive=false;});
  const blocked = (button:HTMLButtonElement) => !alive || !root.isConnected || button.matches(':disabled') || !!button.closest('[hidden],[inert]');
  const paint = () => {
    select.setAttribute('aria-pressed',String(selected)); select.setAttribute('aria-disabled',String(selected)); clear.setAttribute('aria-disabled',String(!selected));
    selection.textContent = selected ? t.selected : t.noSelection; root.dataset.selected = String(selected);
  };
  function choose(next:boolean, button:HTMLButtonElement): void {
    if (dispatching || blocked(button) || selected === next) return;
    dispatching = true;
    try {
      const detail: FlightChoiceDetail = Object.freeze({id:n.id ?? null,optionId:next ? n.optionId : null});
      const EventConstructor = c.doc.defaultView?.CustomEvent;
      if (blocked(button)) return;
      let event: CustomEvent<FlightChoiceDetail>;
      if (typeof EventConstructor === 'function') event = new EventConstructor('iui:flight-choice',{detail,bubbles:true,cancelable:true,composed:false});
      else {event=c.doc.createEvent('CustomEvent');event.initCustomEvent('iui:flight-choice',true,true,detail);}
      if (blocked(button)) return;
      const accepted = root.dispatchEvent(event);
      if (blocked(button)) return;
      if (accepted) selected = next;
      status.textContent = accepted ? next ? t.selected : t.cleared : t.rejected;
      paint();
    } finally {dispatching=false;}
  }
  c.on(select,'click',()=>choose(true,select)); c.on(clear,'click',()=>choose(false,clear));
  paint(); return root;
}
