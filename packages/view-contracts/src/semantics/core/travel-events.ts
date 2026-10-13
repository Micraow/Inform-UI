import type {FlightOptionNode, ArtistUpcomingEventsNode} from '../schema/document.js';
import type {Issue} from './index.js';

/** Gregorian civil fields, independent of parsing heuristics, locale or the system clock. */
export function validTravelDate(value: string): boolean {
  if (!/^[1-9]\d{3}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$(?![\s\S])/.test(value)) return false;
  const year = Number(value.slice(0,4)), month = Number(value.slice(5,7)), day = Number(value.slice(8,10));
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  return day <= [31,leap ? 29 : 28,31,30,31,30,31,31,30,31,30,31][month-1];
}

/** Strict supplied offset instant; Date.UTC is used only after civil-field validation. */
export function flightInstant(value: string): number {
  const match = /^([1-9]\d{3}-\d{2}-\d{2})T([01]\d|2[0-3]):([0-5]\d)(Z|([+-])((?:0\d|1[0-3])):([0-5]\d)|([+-])14:00)$(?![\s\S])/.exec(value);
  if (!match || !validTravelDate(match[1])) return NaN;
  const offset = match[4] === 'Z' ? 0 : (match[5] || match[8]) === '-' ? -1 : 1;
  const minutes = match[8] ? 14*60 : Number(match[6] ?? 0)*60+Number(match[7] ?? 0);
  return Date.UTC(Number(value.slice(0,4)),Number(value.slice(5,7))-1,Number(value.slice(8,10)),Number(match[2]),Number(match[3])) - offset*minutes*60_000;
}
const inspectURL = (url: string, path: string, add: (issue: Issue)=>void, safeURL:(url:string)=>boolean) => {
  if (!/^https?:\/\//i.test(url) || !safeURL(url)) add({code:'UNSAFE_URL',path,message:'Supplied links require allowed absolute HTTP(S) destinations.'});
};
export function inspectFlightOption(node: FlightOptionNode, path: string, add: (issue: Issue)=>void, safeURL:(url:string)=>boolean): void {
  const ids = new Set<string>(); let previousArrival = NaN;
  node.legs.forEach((leg,index)=>{
    const at = `${path}/legs/${index}`;
    if (ids.has(leg.id)) add({code:'DUPLICATE_ID',path:`${at}/id`,message:'Flight leg IDs must be unique within this option.'});
    ids.add(leg.id);
    const departure = flightInstant(leg.departure.at), arrival = flightInstant(leg.arrival.at);
    for (const [field,instant] of [['departure',departure],['arrival',arrival]] as const) if (!Number.isFinite(instant)) add({code:'FLIGHT_TIME',path:`${at}/${field}/at`,message:'Use a real Gregorian minute timestamp, years 1000–9999, with Z or an offset up to 14:00.'});
    if (Number.isFinite(departure) && Number.isFinite(arrival) && arrival <= departure) add({code:'FLIGHT_ORDER',path:`${at}/arrival/at`,message:'Arrival must be strictly after departure as an offset-adjusted instant.'});
    if (Number.isFinite(departure) && Number.isFinite(previousArrival) && departure < previousArrival) add({code:'FLIGHT_ORDER',path:`${at}/departure/at`,message:'The next departure must not precede the previous arrival instant.'});
    previousArrival = arrival;
  });
  if (node.source) inspectURL(node.source.url,`${path}/source/url`,add,safeURL);
}
export function inspectArtistEvents(node: ArtistUpcomingEventsNode, path: string, add: (issue: Issue)=>void, safeURL:(url:string)=>boolean): void {
  const ids = new Set<string>();
  node.events.forEach((event,index)=>{
    const at = `${path}/events/${index}`;
    if (ids.has(event.id)) add({code:'DUPLICATE_ID',path:`${at}/id`,message:'Artist event IDs must be unique within this collection.'});
    ids.add(event.id);
    if (!validTravelDate(event.date)) add({code:'ARTIST_EVENT_DATE',path:`${at}/date`,message:'Use a real Gregorian date in YYYY-MM-DD format, years 1000–9999.'});
    if (event.url !== undefined) inspectURL(event.url,`${at}/url`,add,safeURL);
  });
  if (node.source) inspectURL(node.source.url,`${path}/source/url`,add,safeURL);
}
