import {JSDOM} from 'jsdom';
import {mount} from '../dist/index.js';
export const vocab = (extra={}) => ({type:'vocab-card',term:'resolve',languageLabel:'English',pronunciation:'/rɪˈzɒlv/',partOfSpeech:'verb',senses:[{id:'settle',meaning:'To find a solution to a problem.',translation:'解决',examples:['We resolved the issue together.','A clear test can resolve uncertainty.']},{id:'decide',meaning:'To decide firmly on a course of action.',examples:['They resolved to return.']}],...extra});
export const documentOf = (node=vocab()) => ({version:'iui/1',state:{unrelated:1},body:[node]});
export function setup(input=documentOf(),lang='en',dom=new JSDOM(`<!doctype html><html lang="${lang}"><body><div id="host"></div></body></html>`,{url:'https://local.invalid/'})) {
  const host=dom.window.document.getElementById('host'),controller=mount(host,input);
  return {dom,host,controller,root:host.querySelector('.iui-vocab-card')};
}
export const action=(root,name)=>root.querySelector(`[data-vocab-action="${name}"]`);
export const region=root=>root.querySelector('.iui-vocab-details');
