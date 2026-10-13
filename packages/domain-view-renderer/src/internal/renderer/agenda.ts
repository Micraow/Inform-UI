import type {AgendaNode} from '../schema/document.js';
import type {RendererContext} from './context.js';
import {groupAgendaEvents} from '../core/agenda.js';
import type {AgendaLabels} from './agenda-labels.js';

let serial = 0;
/** One mounted tree per agenda; the date filter changes visibility only. */
export function renderAgenda(c: RendererContext, node: AgendaNode, labels: AgendaLabels): HTMLElement {
  const out = c.element('section', 'iui-agenda');
  const base = `iui-agenda-internal-${c.prefix}${++serial}`;
  const title = c.element('h2', 'iui-agenda-label', node.label);
  title.id = `${base}-label`;
  out.setAttribute('aria-labelledby', title.id);
  out.append(title);
  const descriptions: string[] = [];
  if (node.description !== undefined) {
    const description = c.element('p', 'iui-agenda-description', node.description);
    description.id = `${base}-description`;
    out.append(description); descriptions.push(description.id);
  }
  const note = c.element('p', 'iui-agenda-note', labels.floatingNote);
  note.id = `${base}-note`; out.append(note); descriptions.push(note.id);
  out.setAttribute('aria-describedby', descriptions.join(' '));

  const groups = groupAgendaEvents(node.events);
  const toolbar = c.element('div', 'iui-agenda-toolbar');
  const label = c.element('label', 'iui-agenda-filter-label', labels.filter);
  const select = c.element('select', 'iui-agenda-filter');
  select.id = `${base}-filter`; label.htmlFor = select.id;
  const all = c.element('option', '', labels.allDates); all.value = ''; select.append(all);
  for (const {date} of groups) { const option = c.element('option', '', date); option.value = date; select.append(option); }
  select.disabled = groups.length === 0;
  toolbar.append(label, select); out.append(toolbar);

  const mounted = groups.map(({date, events}, index) => {
    const section = c.element('section', 'iui-agenda-date'); section.dataset.date = date;
    const heading = c.element('h3', 'iui-agenda-date-heading'); heading.id = `${base}-date-${index}`;
    const day = c.element('time', '', date); day.dateTime = date; day.dir = 'ltr'; heading.append(day);
    section.setAttribute('aria-labelledby', heading.id); section.append(heading);
    const list = c.element('ul', 'iui-agenda-events');
    for (const event of events) {
      const item = c.element('li', 'iui-agenda-event'); item.dataset.eventId = event.id; item.dataset.status = event.status ?? 'planned';
      const title = c.element('h4', 'iui-agenda-event-title', event.title);
      const timing = c.element('p', 'iui-agenda-time');
      if (event.start === undefined) timing.textContent = labels.noTime;
      else {
        const start = c.element('time', '', event.start); start.dateTime = `${date}T${event.start}`; start.dir = 'ltr'; timing.append(start);
        if (event.end !== undefined) {
          const end = c.element('time', '', event.end); end.dateTime = `${date}T${event.end}`; end.dir = 'ltr';
          timing.append(c.doc.createTextNode(' – '), end);
        }
      }
      item.append(title, timing);
      if (event.status === 'cancelled') item.append(c.element('p', 'iui-agenda-cancelled', labels.cancelled));
      if (event.description !== undefined || event.location !== undefined) {
        const details = c.element('details', 'iui-agenda-details'); details.append(c.element('summary', '', labels.details));
        if (event.location !== undefined) {
          const location = c.element('p', 'iui-agenda-location');
          location.append(c.element('span', 'iui-agenda-location-label', `${labels.location}: `), c.element('span', 'iui-agenda-location-value', event.location)); details.append(location);
        }
        if (event.description !== undefined) details.append(c.element('p', 'iui-agenda-event-description', event.description));
        item.append(details);
      }
      if (event.url !== undefined) {
        const link = c.element('a', 'iui-agenda-link', `${labels.eventLink} (${labels.opensNewTab})`);
        link.href = event.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.referrerPolicy = 'no-referrer'; item.append(link);
      }
      list.append(item);
    }
    section.append(list); out.append(section); return section;
  });
  if (!groups.length) out.append(c.element('p', 'iui-agenda-empty', labels.noEvents));
  let selected = '', disposed = false;
  const paint = () => {
    // An enclosing native form reset must not desynchronize this unbound local filter.
    for (const option of select.options) option.defaultSelected = option.value === selected;
    select.value = selected;
    mounted.forEach(group => { group.hidden = selected !== '' && group.dataset.date !== selected; });
  };
  c.on(select, 'change', () => {
    if (disposed) return;
    if (select.matches(':disabled') || (select.value !== '' && !groups.some(group => group.date === select.value))) { paint(); return; }
    selected = select.value; paint();
  });
  c.cleanup(() => { disposed = true; });
  paint(); return out;
}
