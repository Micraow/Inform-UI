import type {AgendaNode, AgendaEvent} from '../schema/document.js';
import type {Issue} from './index.js';
import {validInputDate} from './extensions.js';

/** Floating, supplied labels only: never consult the current date or convert zones. */
export function inspectAgenda(node: AgendaNode, path: string, add: (issue: Issue) => void, safeURL: (url: string) => boolean): void {
  const ids = new Set<string>();
  node.events.forEach((event, index) => {
    const at = `${path}/events/${index}`;
    if (ids.has(event.id)) add({code:'DUPLICATE_ID',path:`${at}/id`,message:'Agenda event IDs must be unique within their agenda.'});
    ids.add(event.id);
    if (!validInputDate(event.date)) add({code:'AGENDA_DATE',path:`${at}/date`,message:'Use a real Gregorian date in YYYY-MM-DD format, years 0001–9999.'});
    if (event.end !== undefined && (event.start === undefined || event.end <= event.start)) add({code:'AGENDA_TIME',path:`${at}/end`,message:'End time must be strictly after the supplied start time on the same date.'});
    if (event.url !== undefined && (!/^https?:\/\//i.test(event.url) || !safeURL(event.url))) add({code:'UNSAFE_URL',path:`${at}/url`,message:'Agenda links require allowed absolute HTTP(S) destinations.'});
  });
}

export interface AgendaDateGroup { date: string; events: AgendaEvent[] }
/** Keep equal keys in caller order; sorting never changes the supplied array. */
export function groupAgendaEvents(events: readonly AgendaEvent[]): AgendaDateGroup[] {
  const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
  const sorted = events.map((event, index) => ({event, index})).sort((a, b) => compare(a.event.date, b.event.date) || compare(a.event.start ?? '', b.event.start ?? '') || a.index - b.index);
  const groups: AgendaDateGroup[] = [];
  for (const {event} of sorted) {
    const previous = groups.at(-1);
    if (previous?.date === event.date) previous.events.push(event);
    else groups.push({date:event.date, events:[event]});
  }
  return groups;
}
