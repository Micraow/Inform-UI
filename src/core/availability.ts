import type {RestaurantAvailabilityNode, RestaurantAvailabilitySlot} from '../schema/document.js';
import type {Issue} from './index.js';
import {validInputDate} from './extensions.js';

/** Floating labels supplied by the caller; no instant, zone or current-time inference. */
export function inspectAvailability(node: RestaurantAvailabilityNode, path: string, add: (issue: Issue) => void, safeURL: (url: string) => boolean): void {
  const ids = new Set<string>(), times = new Set<string>();
  node.slots.forEach((slot, index) => {
    const at = `${path}/slots/${index}`;
    if (ids.has(slot.id)) add({code:'DUPLICATE_ID',path:`${at}/id`,message:'Slot IDs must be unique within their availability component.'});
    ids.add(slot.id);
    if (!validInputDate(slot.date)) add({code:'AVAILABILITY_DATE',path:`${at}/date`,message:'Use a real Gregorian date in YYYY-MM-DD format, years 0001–9999.'});
    const pair = `${slot.date}T${slot.time}`;
    if (times.has(pair)) add({code:'DUPLICATE_SLOT',path:`${at}/time`,message:'Each supplied date and time pair must be unique.'});
    times.add(pair);
  });
  if (node.source?.url !== undefined && (!/^https?:\/\//i.test(node.source.url) || !safeURL(node.source.url))) add({code:'UNSAFE_URL',path:`${path}/source/url`,message:'Source links require allowed absolute HTTP(S) destinations.'});
}

/** Stable chronological presentation never mutates the source array. */
export function sortAvailability(slots: readonly RestaurantAvailabilitySlot[]): RestaurantAvailabilitySlot[] {
  const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
  return slots.map((slot, index) => ({slot, index})).sort((a,b) => compare(a.slot.date,b.slot.date) || compare(a.slot.time,b.slot.time) || a.index-b.index).map(({slot}) => slot);
}
