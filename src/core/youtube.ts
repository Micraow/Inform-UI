import type {YoutubeNode} from '../schema/document.js';
import type {Issue} from './index.js';
/** Only a supplied ID is accepted; no URL discovery, metadata fetch or provider SDK. */
export function inspectYouTube(node:YoutubeNode,path:string,add:(issue:Issue)=>void):void {
 if(!node.label.trim())add({code:'YOUTUBE_LABEL',path:path+'/label',message:'A nonblank supplied video label is required.'});
}
export function youtubeEmbedURL(node:YoutubeNode):string {
 const query=new URLSearchParams({autoplay:'0',controls:'1',enablejsapi:'0',playsinline:'1',fs:node.fullscreen===false?'0':'1'});
 if(node.startSeconds!==undefined)query.set('start',String(node.startSeconds));
 return `https://www.youtube-nocookie.com/embed/${node.videoId}?${query}`;
}
