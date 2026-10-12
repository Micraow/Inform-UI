import {object,short,string,bool,choice,array,ref,key} from '../primitives.mjs';
/** Existing authored declarations; preserve their historical wire values. */
export function install({defs,node}) {
defs.UpcomingActivity=object({id:key,title:short,amountLabel:{anyOf:[short,{type:'null'}]},dateLabel:{anyOf:[short,{type:'null'}]},kind:choice('income','expense','other'),accountLabel:short,amountUnknown:bool,detailEnabled:bool,iconSrc:string(16000,1)},['id','title','amountLabel','dateLabel']);
defs.UpcomingFlow=object({top:ref('UpcomingActivity'),items:array(ref('UpcomingActivity'),0,60),expandedItems:array(ref('UpcomingActivity'),0,60)},['items']);
defs.UpcomingFlows=object({incoming:ref('UpcomingFlow'),outgoing:ref('UpcomingFlow')},['incoming','outgoing']);
node('ledger-upcoming-activity',{label:short,activities:array(ref('UpcomingActivity'),0,60),emptyLabel:short,masked:bool,maskedLabel:short,disabled:bool,flows:ref('UpcomingFlows'),activeFlow:choice('incoming','outgoing'),expanded:bool,showFlowTabs:bool,status:choice('pending','resolved','failed'),fallback:string(2000),hasConnectedAccounts:bool,noAccountsLabel:short,incomingLabel:short,outgoingLabel:short,moreLabel:short,lessLabel:short},['label','activities'],'finance');
}
