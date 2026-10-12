import {object,short,string,array,ref,bool,suppliedKey,flightAt} from '../primitives.mjs';
/** Existing authored declarations; no change to supplied-data or local interaction semantics. */
export function install({defs,node}){
// Original supplied attributed facts and local entity-thumbnail detail selection.
defs.SidebarFact=object({id:suppliedKey,label:short,value:{anyOf:[string(2000),{type:'null'}]},unit:short,group:short,note:string(3000),observedAt:flightAt,source:ref('TravelEventSource')},['id','label','value']);
node('sidebar-fact-table',{label:short,description:string(2000),facts:array(ref('SidebarFact'),0,80),source:ref('TravelEventSource')},['label','facts']);
defs.EntityThumbnailField=object({label:short,value:string(2000)},['label','value']);
defs.EntityThumbnailRecord=object({id:suppliedKey,label:short,category:short,description:string(3000),fields:array(ref('EntityThumbnailField'),0,8),image:object({src:string(140000,1),alt:string(2000,1)},['src','alt']),source:ref('TravelEventSource')},['id','label','category']);
node('entity-thumbnail-list',{label:short,description:string(2000),entities:array(ref('EntityThumbnailRecord'),0,24),initialSelectedId:suppliedKey,disabled:bool},['label','entities']);
}
