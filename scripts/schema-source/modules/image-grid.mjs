import {object,short,string,bool,integer,choice,array,ref,key} from '../primitives.mjs';
/** Existing authored declarations, moved without changing wire values. */
export function install({defs,node}) {
defs.ImageGridItem=object({id:key,src:string(16000,1),alt:short,caption:string(500)},['id','src','alt']);
defs.ImageGridTile=object({imageId:key,aspectRatio:{type:'number',minimum:.1,maximum:20},flexGrow:{type:'number',minimum:.1,maximum:20}},['imageId']);
defs.ImageGridRow=object({aspectRatio:{type:'number',minimum:.1,maximum:20},tiles:array(ref('ImageGridTile'),1,24)},['tiles']);
defs.ImageGridPlaceholderTile=object({aspectRatio:{type:'number',minimum:.1,maximum:20},flexGrow:{type:'number',minimum:.1,maximum:20}});
defs.ImageGridPlaceholderRow=object({aspectRatio:{type:'number',minimum:.1,maximum:20},tiles:array(ref('ImageGridPlaceholderTile'),1,24)},['tiles']);
defs.ImageGridRecommendation=object({id:key,label:short,query:string(2000,1),thumbnailSrc:string(16000,1)},['id','label','query','thumbnailSrc']);
node('image-grid',{label:short,images:array(ref('ImageGridItem'),0,24),columns:integer(1,4),fit:choice('contain','cover'),disabled:bool,presentation:choice('grid','mosaic','live'),rows:array(ref('ImageGridRow'),0,24),recommendations:array(ref('ImageGridRecommendation'),0,24),recommendationsExpanded:bool,status:choice('pending','resolved','failed'),fallback:string(2000),loading:bool,placeholderRows:array(ref('ImageGridPlaceholderRow'),0,8),viewer:choice('intent','local')},['images']);
}
