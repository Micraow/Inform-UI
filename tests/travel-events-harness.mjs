import {JSDOM} from 'jsdom';
import {mount} from '../dist/index.js';
export const leg=(patch={})=>({id:'leg1',carrier:'Example Air',number:'EX 101',departure:{airport:'LHR',at:'2028-02-29T09:00Z',name:'Supplied departure'},arrival:{airport:'JFK',at:'2028-02-29T07:00-05:00',name:'Supplied arrival'},cabin:'Economy as supplied',...patch});
export const flight=(patch={})=>({type:'flight-option',label:'Supplied flight option',optionId:'flight1',legs:[leg()],...patch});
export const event=(patch={})=>({id:'event1',title:'Supplied performance',date:'2028-02-29',venue:'Example hall',start:'19:30',timeZoneLabel:'Literal venue time',description:'Supplied event description',...patch});
export const events=(patch={})=>({type:'artist-upcoming-events',artist:'Example artist',events:[event({id:'march',date:'2028-03-10'}),event(),event({id:'repeat'})],...patch});
export const spec=(nodes=[flight({id:'flight'}),events()],patch={})=>({version:'iui/1',state:{other:0},body:Array.isArray(nodes)?nodes:[nodes],...patch});
export function setup(input=spec(),options={},shell='<div id="host"></div><button id="outside">Outside</button>',lang='en',mountFn=mount){
  const dom=new JSDOM(`<html lang="${lang}"><body>${shell}</body></html>`),doc=dom.window.document,host=doc.getElementById('host'),controller=mountFn(host,input,options);
  return {dom,doc,host,controller,flight:host.querySelector('.iui-flight-option'),events:host.querySelector('.iui-artist-events'),select:host.querySelector('.iui-flight-select'),clear:host.querySelector('.iui-flight-clear'),filter:host.querySelector('.iui-events-filter')};
}
export const change=(x,value)=>{x.filter.value=value;x.filter.dispatchEvent(new x.dom.window.Event('change',{bubbles:true}));};
export const click=(x,el)=>el.dispatchEvent(new x.dom.window.MouseEvent('click',{bubbles:true,cancelable:true}));
export const visible=x=>[...x.host.querySelectorAll('.iui-events-item:not([hidden])')].map(el=>el.dataset.eventId);
