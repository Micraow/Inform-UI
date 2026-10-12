import {object} from '../primitives.mjs';
import {ledgerCurrency} from './ledger-source.mjs';
/** Existing authored declarations; preserve their historical wire values. */
export function install({defs,node}) {
defs.LedgerExactMoney=object({amount:{anyOf:[{type:'string',pattern:'^-?(?:0|[1-9][0-9]{0,17})(?:\\.[0-9]{1,18})?$(?![\\s\\S])',minLength:1,maxLength:40},{type:'null'}]},currency:ledgerCurrency},['amount','currency']);
}
