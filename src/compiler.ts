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
  const csp=`default-src 'none'; script-src ${shared?"'self'":`'sha256-${hash(script)}'`}; style-src 'unsafe-inline'${shared?" 'self'":''}; img-src data: https: http:; font-src data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'`;
  const title=escape(result.document.title??'Intelligent UI');
  const html=`<!doctype html>\n<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${escape(csp)}"><meta name="referrer" content="no-referrer"><title>${title}</title>${shared?`<link rel="stylesheet" integrity="sha256-${hash(css)}" href="${base}${styleName}">`:`<style>${css}</style>`}</head><body class="iui-page" data-theme="${result.document.theme??'auto'}" style="margin:0"><main id="iui"><noscript>This interactive document requires JavaScript. ${title}</noscript></main><script id="iui-data" type="application/json">${serialized}</script>${shared?`<script defer integrity="sha256-${hash(script)}" src="${base}${runtimeName}"></script>`:`<script>${script}</script>`}</body></html>\n`;
  return {html,assets:Object.freeze(shared?{[`${base.slice(2)}${runtimeName}`]:script,[`${base.slice(2)}${styleName}`]:css}:{})};
}
export async function compileHtml(input:unknown,options:Omit<CompileOptions,'assets'> & {assets?:'inline'}={}):Promise<string>{
  if(options.assets&&options.assets!=='inline')throw new Error('Use compileArtifact for shared assets');
  return (await compileArtifact(input,options)).html;
}
