import type {WeatherSidebarTitleNode} from '../schema/document.js';
import type {Issue} from './index.js';
import {validTimezone} from './extensions.js';
import {flightInstant} from './travel-events.js';
export function inspectWeatherSidebar(node:WeatherSidebarTitleNode,path:string,add:(issue:Issue)=>void,safeURL:(url:string)=>boolean):void {
  const seen=new Set<string>();
  node.places.forEach((place,i)=>{
    const at=`${path}/places/${i}`,issue=(code:string,key:string,message:string)=>add({code,path:at+'/'+key,message});
    if(seen.has(place.id))issue('DUPLICATE_ID','id','Place IDs must be unique.');seen.add(place.id);
    if(!validTimezone(place.timezone))issue('TIMEZONE','timezone','Use a supported IANA timezone.');
    if(place.observedAt!==null&&!Number.isFinite(flightInstant(place.observedAt)))issue('WEATHER_TIME','observedAt','Use a real Gregorian timestamp with an explicit offset.');
    if(place.source&&(!/^https?:\/\//i.test(place.source.url)||!safeURL(place.source.url)))issue('UNSAFE_URL','source/url','Use a safe absolute HTTP(S) source.');
  });
  if(node.initialPlaceId!==undefined&&!seen.has(node.initialPlaceId))add({code:'WEATHER_PLACE',path:path+'/initialPlaceId',message:'Reference a supplied place.'});
}
