import type {DomainContext} from './types.js';
const raster=/^data:image\/(?:png|jpeg|gif|webp|avif);base64,[A-Za-z0-9+/]+={0,2}$/i;
const video=/^data:video\/(?:mp4|webm|ogg);base64,[A-Za-z0-9+/]+={0,2}$/i;
const audio=/^data:audio\/(?:mpeg|mp4|ogg|wav|webm|aac);base64,[A-Za-z0-9+/]+={0,2}$/i;
const track=/^data:text\/vtt(?:(?:;charset=utf-8)?,[\x20-\x7e]*|;base64,[A-Za-z0-9+/]+={0,2})$/i;
function descriptor(node:object,key:string):PropertyDescriptor|undefined {for(let proto=Object.getPrototypeOf(node);proto;proto=Object.getPrototypeOf(proto)){const found=Object.getOwnPropertyDescriptor(proto,key);if(found)return found;}return undefined;}
function safeLink(value:string){if(!value||/[\u0000-\u0020\u007f\\]/.test(value))return false;if(/^#[A-Za-z0-9_.:-]+$/.test(value))return true;try{const url=new URL(value);return !url.username&&!url.password&&(['https:','http:'].includes(url.protocol)||url.protocol==='mailto:'&&!/%0[ad]/i.test(value)||url.protocol==='tel:'&&/^tel:\+?[0-9().-]+$/i.test(value));}catch{return false;}}
/** Guard both reflected property setters and attribute writes before resource assignment. */
export function applyDomainResourcePolicy(node:HTMLElement,context:Pick<DomainContext,'allowImageURL'>):void {
 const tag=node.tagName.toLowerCase();if(!['a','img','audio','video','source','track','iframe'].includes(tag))return;
 const permitted=(key:string,value:string)=>{
  if(key==='href')return safeLink(value);
  if(key==='srcset')return value===''; // No implicit responsive-image fetches.
  if(key==='srcdoc')return false;
  if(key==='poster')return raster.test(value)||(safeLink(value)&&/^https:\/\//i.test(value)&&context.allowImageURL?.(value)===true);
  if(key!=='src')return true;
  if(tag==='img')return raster.test(value)||(safeLink(value)&&/^https:\/\//i.test(value)&&context.allowImageURL?.(value)===true);
  if(tag==='video')return video.test(value);
  if(tag==='audio')return audio.test(value);
  if(tag==='source')return video.test(value)||audio.test(value)||raster.test(value);
  if(tag==='track')return track.test(value);
  return false;
 };
 const keys=tag==='a'?['href']:['src','srcset','poster','srcdoc'];
 const blocked=(key:string)=>{node.dataset[key==='href'?'blockedLink':'blockedResource']='true';};
 for(const key of keys){const native=descriptor(node,key);if(native?.set&&native.get)Object.defineProperty(node,key,{configurable:true,get(){return native.get!.call(node);},set(value){const text=String(value);if(!permitted(key,text)){blocked(key);return;}native.set!.call(node,text);}});}
 const set=node.setAttribute.bind(node);node.setAttribute=(name:string,value:string)=>{const key=name.toLowerCase();if(keys.includes(key)&&!permitted(key,String(value))){blocked(key);return;}set(name,value);};
 const setNS=node.setAttributeNS.bind(node);node.setAttributeNS=(namespace:string|null,name:string,value:string)=>{const key=name.toLowerCase().replace(/^.*:/,'');if(keys.includes(key)&&!permitted(key,String(value))){blocked(key);return;}setNS(namespace,name,value);};
}
