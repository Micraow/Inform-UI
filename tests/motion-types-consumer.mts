import type {Node} from '../dist/index.js';
const animate: Node = {type:'animate',label:'Preview',children:[],effect:'rise',duration:1000,disabled:false};
const celebration: Node = {type:'celebration',label:'Message',message:'Supplied',duration:1800,disabled:true};
// @ts-expect-error required children cannot be omitted
const missingChildren: Node = {type:'animate',label:'Preview'};
// @ts-expect-error message is required literal content
const missingMessage: Node = {type:'celebration',label:'Message'};
// @ts-expect-error no arbitrary animation name
const arbitrary: Node = {type:'animate',label:'Preview',children:[],effect:'bounce'};
// @ts-expect-error disabled is literal, not state-bound
const binding: Node = {type:'celebration',label:'Message',message:'Supplied',disabled:{$:'locked'}};
// @ts-expect-error no automatic playback
const autoplay: Node = {type:'animate',label:'Preview',children:[],autoplay:true};
// @ts-expect-error celebration cannot contain interactive children
const children: Node = {type:'celebration',label:'Message',message:'Supplied',children:[]};
void [animate,celebration,missingChildren,missingMessage,arbitrary,binding,autoplay,children];
