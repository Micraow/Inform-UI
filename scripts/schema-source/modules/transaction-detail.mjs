import {installTransactionDetail} from '../../transaction-detail-schema.mjs';
/** Existing maintained contract; source registration only. */
export function install({defs,node,registerDefinedNode}){
installTransactionDetail({defs,node});
}
