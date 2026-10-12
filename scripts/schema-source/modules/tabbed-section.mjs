import {object,short,string,bool,choice,array,ref,key} from '../primitives.mjs';
/** Existing authored declarations, moved without changing wire values. */
export function install({defs,node}) {
defs.SuppliedSectionTab=object({id:key,label:short,title:short,content:string(12000),disabled:bool},['id','label','title','content']);
node('tabbed-section',{label:short,tabs:array(ref('SuppliedSectionTab'),0,24),activeId:key,vertical:bool,disabled:bool,status:choice('pending','resolved','failed'),fallback:short},['label','tabs'],'base');
}
