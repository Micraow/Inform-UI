import {object,short,string,array,ref,choice,suppliedKey,flightAt,condition} from '../primitives.mjs';
/** Existing authored declarations; no change to supplied-data or local interaction semantics. */
export function install({defs,node}){
defs.WeatherSidebarPlace=object({id:suppliedKey,label:short,timezone:short,observedAt:{anyOf:[flightAt,{type:'null'}]},temperature:{anyOf:[{type:'number',minimum:-1000000,maximum:1000000},{type:'null'}]},unit:choice('celsius','fahrenheit'),condition:{anyOf:[condition,{type:'null'}]},source:ref('TravelEventSource')},['id','label','timezone','observedAt','temperature','unit','condition']);
node('weather-sidebar-title',{label:short,description:string(2000),places:array(ref('WeatherSidebarPlace'),0,30),initialPlaceId:suppliedKey,unit:choice('celsius','fahrenheit')},['label','places','unit'],'weather');

}
