import {object,short,string,ref} from '../primitives.mjs';
export const ledgerCurrency = {type:'string',pattern:'^[A-Z]{3}$(?![\\s\\S])',minLength:3,maxLength:3};
export const ledgerCommon = {label:short,description:string(2000),source:ref('LedgerSource')};
/** Existing authored ledger source, installed at its historical definition position. */
export function install({defs}) {
defs.LedgerSource = object({label:short,url:string(2048,1)},['label','url']);
}
