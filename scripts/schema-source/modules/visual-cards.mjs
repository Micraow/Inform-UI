import {object,short,string,bool,integer,choice,array,ref,key} from '../primitives.mjs';
/** Existing authored declarations, moved without changing wire values. */
export function install({defs,node}) {
defs.VisualEntityRequest=object({id:short,kind:short},['id','kind']);
defs.VisualCardItem=object({id:key,label:short,title:short,query:short,caption:short,subtitle:short,source:short,metadata:short,reason:string(1200,1),summary:string(2000,1),image:ref('SearchImageRecord'),imageLoading:bool,imageIndex:integer(0,23),url:string(2048,1),entity:ref('VisualEntityRequest'),disabled:bool},['id','label']);
node('visual-card-carousel',{title:short,items:array(ref('VisualCardItem'),0,24),viewerImages:array(ref('SearchImageRecord'),0,24),viewer:choice('local','intent'),mobile:bool,disabled:bool,status:choice('pending','resolved','failed'),fallback:short},['title','items'],'base');
}
