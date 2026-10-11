import {lottieHTTPOrigin,lottieBitmapURL} from './core/lottie.js';
import {htmlViewScriptHashes} from './html-view-policy.js';
import {HTML_VIEW_SCRIPT_ORIGINS,HTML_VIEW_STYLE_ORIGINS,HTML_VIEW_FONT_ORIGINS,HTML_VIEW_CONNECT_ORIGINS} from './core/html-view.js';
import type {Node as IuiNode} from './schema/document.js';
import {audioHTTPSource} from './core/learning-media.js';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {validateDocument} from './core/index.js';
import {InvalidDocumentError} from './renderer/index.js';
export interface CompileOptions {backend?:'portable';assets?:'inline'|'shared';assetBase?:string;lang?:string}
export interface Artifact {html:string;assets:Readonly<Record<string,string>>}
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const hash=(s:string)=>createHash('sha256').update(s).digest('base64');
/** Compile validated JSON to deterministic offline HTML and optional shared files. */
export async function compileArtifact(input:unknown,options:CompileOptions={}):Promise<Artifact>{
  if(options.backend&&options.backend!=='portable')throw new Error('Only the portable backend is supported');
  if(options.assets&&!['inline','shared'].includes(options.assets))throw new Error('assets must be inline or shared');
  const result=validateDocument(input);if(!result.ok)throw new InvalidDocumentError(result.issues);
  const [raw,css]=await Promise.all([readFile(new URL('./standalone.js',import.meta.url),'utf8'),readFile(new URL('./style.css',import.meta.url),'utf8')]);
  const script=raw.replace(/<\/script/gi,'<\\/script');
  const serialized=JSON.stringify(result.document).replace(/[<>&\u2028\u2029]/g,c=>`\\u${c.charCodeAt(0).toString(16).padStart(4,'0')}`);
  const shared=options.assets==='shared';const base=options.assetBase??'./iui-assets/';
  if(!/^\.\/[A-Za-z0-9_/-]+\/$/.test(base)||base.includes('..'))throw new Error('assetBase must be a safe relative directory such as ./iui-assets/');
  const lang=options.lang??'en';if(!/^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$/.test(lang))throw new Error('lang must be a language tag');
  const runtimeName=`runtime-${createHash('sha256').update(script).digest('hex').slice(0,16)}.js`;
  const styleName=`style-${createHash('sha256').update(css).digest('hex').slice(0,16)}.css`;
  const audioSources=new Set<string>(),htmlScripts=new Set<string>(),htmlHandlers=new Set<string>(),lottieConnections=new Set<string>();let htmlView=false,youtube=false,videoAPI=false;
  const collectAudio=(node:IuiNode):void=>{
    if(node.type==='lottie'&&typeof node.source==='string'&&/^https?:/i.test(node.source)&&!lottieBitmapURL(node.source)){const origin=lottieHTTPOrigin(node.source);if(origin)lottieConnections.add(origin);}
    if(node.type==='youtube')youtube=true;
    if(node.type==='async-video-carousel'&&node.items?.some(item=>item.provider==='youtube')){youtube=true;videoAPI=true;}
    if(node.type==='html-view'){htmlView=true;const hashes=htmlViewScriptHashes(node.html);hashes.scripts.forEach(hash=>htmlScripts.add(hash));hashes.handlers.forEach(hash=>htmlHandlers.add(hash));}
    if(node.type==='learning-audio-label-card'){
      const source=/^data:/i.test(node.audio.src)?'data:':audioHTTPSource(node.audio.src);
      if(source)audioSources.add(source);
    }
    if('children' in node)node.children?.forEach(collectAudio);
    if(node.type==='list')for(const item of node.items)if(typeof item==='object'&&item!==null&&'type' in item)collectAudio(item as IuiNode);
  };
  result.document.body.forEach(collectAudio);
  if(htmlView){audioSources.add('data:');audioSources.add('blob:');audioSources.add('https:');}
  const mediaPolicy=audioSources.size?' media-src '+[...audioSources].sort().join(' ')+';':'';
  const htmlScriptPolicy=htmlView?' '+[...htmlScripts].sort().join(' ')+' '+HTML_VIEW_SCRIPT_ORIGINS.join(' '):'';
  const handlerPolicy=htmlHandlers.size?` script-src-attr 'unsafe-hashes' ${[...htmlHandlers].sort().join(' ')};`:htmlView?" script-src-attr 'none';":'';
  const connectionPolicy=[...new Set([...(htmlView?HTML_VIEW_CONNECT_ORIGINS:[]),...[...lottieConnections].sort()])].join(' ')||"'none'";
  const csp=`default-src 'none'; script-src ${shared?"'self'":`'sha256-${hash(script)}'`}${htmlScriptPolicy}${videoAPI?" https://www.youtube.com/iframe_api https://www.youtube.com/s/player/":""};${handlerPolicy} style-src 'unsafe-inline'${shared?" 'self'":''}${htmlView?' '+HTML_VIEW_STYLE_ORIGINS.join(' '):''}; img-src data: https: http:${htmlView?' blob:':''}; font-src data:${htmlView?' '+HTML_VIEW_FONT_ORIGINS.join(' '):''};${youtube?' frame-src https://www.youtube-nocookie.com;':''}${mediaPolicy} connect-src ${connectionPolicy};${htmlView?' worker-src blob:;':''} object-src 'none'; base-uri 'none'; form-action 'none'`;
  const title=escape(result.document.title??'Inform UI');
  const html=`<!doctype html>\n<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${escape(csp)}"><meta name="referrer" content="no-referrer"><title>${title}</title>${shared?`<link rel="stylesheet" integrity="sha256-${hash(css)}" href="${base}${styleName}">`:`<style>${css}</style>`}</head><body class="iui-page" data-theme="${result.document.theme??'auto'}" style="margin:0"><main id="iui"><noscript>This interactive document requires JavaScript. ${title}</noscript></main><script id="iui-data" type="application/json">${serialized}</script>${shared?`<script defer integrity="sha256-${hash(script)}" src="${base}${runtimeName}"></script>`:`<script>${script}</script>`}</body></html>\n`;
  return {html,assets:Object.freeze(shared?{[`${base.slice(2)}${runtimeName}`]:script,[`${base.slice(2)}${styleName}`]:css}:{})};
}
export async function compileHtml(input:unknown,options:Omit<CompileOptions,'assets'> & {assets?:'inline'}={}):Promise<string>{
  if(options.assets&&options.assets!=='inline')throw new Error('Use compileArtifact for shared assets');
  return (await compileArtifact(input,options)).html;
}
