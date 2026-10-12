import {readFileSync} from 'node:fs';
const definitions=JSON.parse(readFileSync(new URL('../../fee-interest-definitions.json',import.meta.url),'utf8'));
/** Existing maintained contract; source registration only. */
export function install({defs,node,registerDefinedNode}){
for(const[name,value]of Object.entries(definitions))defs[name]=structuredClone(value);registerDefinedNode('LedgerFeeInterestPaidNode','finance');
}
