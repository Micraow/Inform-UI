import type {RenderGeneration} from './generation.js';
/** Bounded adapter for the official YouTube IFrame API. No user data, query or arbitrary script URL. */
export interface YouTubePlayer {
 mute():void; playVideo():void; pauseVideo():void; stopVideo():void; destroy():void;
 getDuration():number; getIframe():HTMLIFrameElement;
}
export interface YouTubePlayerEvent {target:YouTubePlayer;data?:number;}
export interface YouTubeAPI {Player:new(frame:HTMLIFrameElement,options:{events:{onReady:(event:YouTubePlayerEvent)=>void;onStateChange:(event:YouTubePlayerEvent)=>void;onError:(event:YouTubePlayerEvent)=>void}})=>YouTubePlayer;}
type HostWindow=Window&{YT?:YouTubeAPI;onYouTubeIframeAPIReady?:()=>void};
type Client={active:()=>boolean;ready:(api:YouTubeAPI)=>void;failed:()=>void};
type Loader={clients:Set<Client>;script:HTMLScriptElement|null;timer:number|undefined;previous:(()=>void)|undefined;callback:()=>void;stop:()=>void;};
const loaders=new WeakMap<Window,Loader>();
export const YOUTUBE_API_SOURCE='https://www.youtube.com/iframe_api';
/** The caller owns this subscription. Late global readiness never revives a disposed preview. */
export function subscribeYouTubeAPI(life:RenderGeneration,doc:Document,active:()=>boolean,ready:(api:YouTubeAPI)=>void,failed:()=>void):()=>void {
 const win=doc.defaultView as HostWindow|null;if(!win||!active())return()=>{};
 let existing:YouTubeAPI|undefined;try{existing=win.YT;}catch{}if(!active())return()=>{};
 if(typeof existing?.Player==='function'){let subscribed=true;queueMicrotask(life.guard(()=>{if(subscribed&&active())ready(existing!);}));return()=>{subscribed=false;};}
 const client:Client={active,ready,failed};let loader=loaders.get(win);
 if(loader){loader.clients.add(client);return()=>{loader!.clients.delete(client);if(!loader!.clients.size)loader!.stop();};}
 const clients=new Set([client]);let stopped=false,script:HTMLScriptElement|null=null,timer:number|undefined,previous:(()=>void)|undefined;
 const stop=()=>{if(stopped)return;stopped=true;if(timer!==undefined)win.clearTimeout(timer);if(loaders.get(win)===loader)loaders.delete(win);try{if(win.onYouTubeIframeAPIReady===callback)win.onYouTubeIframeAPIReady=previous;}catch{}script?.remove();clients.clear();};
 const finish=(success:boolean)=>{if(stopped)return;let api:YouTubeAPI|undefined;try{api=win.YT;}catch{}const current=[...clients].filter(x=>x.active());stop();for(const item of current){if(!item.active())continue;if(success&&typeof api?.Player==='function')item.ready(api);else item.failed();}};
 const callback=()=>{try{previous?.call(win);}finally{finish(true);}};
 loader={clients,script,timer,previous,callback,stop};loaders.set(win,loader);
 try{
  previous=win.onYouTubeIframeAPIReady;if(!active()){stop();return()=>{};}win.onYouTubeIframeAPIReady=callback;
  if(!active()){stop();return()=>{};}script=doc.createElement('script');loader.script=script;if(!active()){stop();return()=>{};}
  script.async=true;script.referrerPolicy='strict-origin-when-cross-origin';script.addEventListener('error',()=>finish(false),{once:true});
  if(!active()){stop();return()=>{};}script.src=YOUTUBE_API_SOURCE;if(!active()){stop();return()=>{};}
  (doc.head??doc.documentElement).append(script);if(stopped||!active()){stop();return()=>{};}timer=life.acquire(()=>win.setTimeout(life.guard(()=>finish(false)),10000),id=>win.clearTimeout(id));loader.timer=timer;
 }catch{finish(false);}
 return()=>{clients.delete(client);if(!clients.size)stop();};
}
