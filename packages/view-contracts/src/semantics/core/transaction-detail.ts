import type {LedgerTransactionDetailNode} from '../schema/document.js';
import type {Issue} from './index.js';

/** Supplied display labels are never interpreted as money or account identifiers. */
export function inspectTransactionDetail(node:LedgerTransactionDetailNode,path:string,add:(issue:Issue)=>void,safeURL:(value:string,kind?:'link'|'image')=>boolean):void {
  if(!node.label.trim())add({code:'TRANSACTION_DETAIL_LABEL',path:path+'/label',message:'Supply a nonblank accessible label.'});
  if(!node.data)return;
  const data=node.data,ids=new Set<string>();
  const image=(logo:{src:string;alt:string}|undefined,at:string)=>{
    if(logo&&!safeURL(logo.src,'image'))add({code:'UNSAFE_URL',path:at+'/src',message:'Supply an allowed HTTP(S) or inline raster image.'});
  };
  image(data.logo,path+'/data/logo');
  data.related.forEach((item,index)=>{
    const at=path+'/data/related/'+index;
    if(ids.has(item.id))add({code:'DUPLICATE_ID',path:at+'/id',message:'Related transaction IDs must be unique.'});
    ids.add(item.id);image(item.logo,at+'/logo');
    if(!item.actionLabel.trim())add({code:'TRANSACTION_DETAIL_LABEL',path:at+'/actionLabel',message:'Supply a nonblank action label.'});
  });
}
