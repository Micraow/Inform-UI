import type {Node,LocationChoiceDetail} from '../dist/index.js';
import type {Node as BrowserNode,LocationChoiceDetail as BrowserChoice} from '../dist/browser.js';
const location:Node={type:'location-choice-request',label:'Supplied places',options:[{id:'one',label:'Example courtyard',address:'1 Example Lane'}],source:{label:'Supplied notes'}};
const gallery:BrowserNode={type:'business-gallery',label:'Supplied photos',images:[{id:'one',src:'https://example.invalid/photo.png',alt:'Supplied photograph',caption:'Supplied caption'}]};
const detail:LocationChoiceDetail={componentId:null,optionId:'one',label:'Example courtyard',address:null};
const browserDetail:BrowserChoice=detail;
// @ts-expect-error event payload is readonly
browserDetail.optionId='two';
// @ts-expect-error required choice label
const missing:Node={type:'location-choice-request',options:[]};
// @ts-expect-error literal strings only
const dynamic:Node={type:'location-choice-request',label:{$:'name'},options:[]};
// @ts-expect-error no geolocation request
const device:Node={type:'location-choice-request',label:'Places',options:[],currentLocation:true};
// @ts-expect-error no coordinates or inferred distance
const coordinates:Node={type:'location-choice-request',label:'Places',options:[{id:'one',label:'Place',latitude:0}]};
// @ts-expect-error no form binding
const bind:Node={type:'location-choice-request',label:'Places',options:[],bind:'place'};
// @ts-expect-error gallery requires alt text
const missingAlt:Node={type:'business-gallery',label:'Photos',images:[{id:'one',src:'https://example.invalid/photo.png'}]};
// @ts-expect-error captions are literal text
const caption:Node={type:'business-gallery',label:'Photos',images:[{id:'one',src:'https://example.invalid/photo.png',alt:'Photo',caption:{$:'text'}}]};
// @ts-expect-error no search/provider/upload
const provider:Node={type:'business-gallery',label:'Photos',images:[],provider:'maps'};
// @ts-expect-error no per-gallery consent bypass
const preload:Node={type:'business-gallery',label:'Photos',images:[],preload:true};
// @ts-expect-error event detail contains no location result
const latitude=detail.latitude;
// @ts-expect-error address is required even when null
const incomplete:LocationChoiceDetail={componentId:null,optionId:'one',label:'Place'};
void [location,gallery,detail,browserDetail,missing,dynamic,device,coordinates,bind,missingAlt,caption,provider,preload,latitude,incomplete];
