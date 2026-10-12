import {short,string,bool,ref} from '../primitives.mjs';
/** Existing authored declarations; preserve their historical wire values. */
export function install({defs,node}) {
node('ledger-income-tracker',{label:short,subtitle:short,hasIncome:bool,estimatedMonthlyIncomeLabel:short,incomeSourcesLabel:short,nextPaycheck:{anyOf:[ref('LedgerIncomePaycheck'),{type:'null'}]},emptyLabel:string(2000),masked:bool,maskedLabel:short,estimatedLabel:short,nextPaycheckLabel:short,recurringIncomeLabel:short,noUpcomingLabel:string(2000),dateUnavailableLabel:short,source:ref('LedgerSource')},['label','hasIncome'],'finance');
}
