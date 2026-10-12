import {object,short,bool,string} from '../primitives.mjs';
/** Existing authored declarations; preserve their historical wire values. */
export function install({defs,node}) {
defs.FinanceSource=object({label:short,synthetic:bool,url:string(2048)},['label','synthetic']);
}
