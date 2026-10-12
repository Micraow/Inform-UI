import {object,short,string,array,ref,integer,bool,suppliedKey,travelDate} from '../primitives.mjs';
/** Existing authored declarations; no change to supplied-data or local interaction semantics. */
export function install({defs,node}){
// Original local flight search intent and supplied result exploration.
const discoveryAirport={type:'string',pattern:'^[A-Z]{3}$(?![\\s\\S])',minLength:3,maxLength:3};
defs.DiscoveryAirport=object({code:discoveryAirport,label:short},['code','label']);
node('flight-search-form',{label:short,description:string(2000),airports:array(ref('DiscoveryAirport'),2,80),initialOrigin:discoveryAirport,initialDestination:discoveryAirport,initialDepartureDate:travelDate,initialReturnDate:travelDate,initialTravelers:integer(1,9),disabled:bool},['label','airports']);
defs.DiscoveryFlightResult=object({id:suppliedKey,label:short,legs:array(ref('FlightLeg'),1,8),price:ref('SuppliedPrice'),note:string(2000),source:ref('TravelEventSource')},['id','label','legs']);
node('flight-results',{label:short,description:string(2000),results:array(ref('DiscoveryFlightResult'),0,40),source:ref('TravelEventSource')},['label','results']);
}
