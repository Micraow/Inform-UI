export interface LedgerLabels {
  assetNote:string; transactionNote:string; subtotalNote:string; precisionNote:string; observed:string;
  source:string; opensNewTab:string; currencyFilter:string; allCurrencies:string; amount:string; currency:string;
  account:string; category:string; knownSubtotal:string; notSupplied:string; subtotalUnavailable:string;
  zeroShares:string; unknownShares:string; accountsEmpty:string; transactionsEmpty:string; noMatch:string;
  directionFilter:string; monthFilter:string; allDirections:string; allMonths:string; reset:string;
  date:string; description:string; direction:string; status:string; debit:string; credit:string;
  pending:string; posted:string; statusUnknown:string; counterparty:string; note:string; details:string;
  accountCounts:(count:number,unknown:number)=>string; visibleCounts:(visible:number,total:number)=>string;
  accountTable:(currency:string)=>string;
}
export const ledgerEnglish: Readonly<LedgerLabels> = Object.freeze({
  assetNote:'Supplied account amounts, grouped by currency. No account connection or currency conversion.',
  transactionNote:'Supplied transactions in their original order. Filters are local; no balance, settlement or payment is inferred.',
  subtotalNote:'Known subtotal includes only supplied known amounts, not a complete balance or net worth.',
  precisionNote:'Numeric values are shown as supplied, without inferred currency precision. Subtotals are for display, not accounting reconciliation.',
  observed:'Supplied observation label',source:'Source',opensNewTab:'Opens in a new tab',currencyFilter:'Filter by currency',allCurrencies:'All currencies',
  amount:'Amount',currency:'Currency',account:'Account',category:'Category',knownSubtotal:'Known subtotal',notSupplied:'Amount not supplied',subtotalUnavailable:'Unavailable: no known amounts',
  zeroShares:'All known amounts are zero; distribution shares are undefined.',unknownShares:'Unknown amounts have no distribution share.',
  accountsEmpty:'No account amounts supplied.',transactionsEmpty:'No transactions supplied.',noMatch:'No supplied transactions match these filters.',
  directionFilter:'Filter by direction',monthFilter:'Filter by month',allDirections:'All directions',allMonths:'All months',reset:'Reset filters',
  date:'Date',description:'Description',direction:'Direction',status:'Supplied status',debit:'Debit',credit:'Credit',pending:'Pending',posted:'Posted',statusUnknown:'Status not supplied',
  counterparty:'Counterparty',note:'Note',details:'Details',
  accountCounts:(count:number,unknown:number)=>`${count} supplied accounts; ${unknown} amounts unknown.`,
  visibleCounts:(visible:number,total:number)=>`Showing ${visible} of ${total} supplied records.`,
  accountTable:(currency:string)=>`Supplied account amounts (${currency})`,
});
export const ledgerChinese: Readonly<LedgerLabels> = Object.freeze({
  assetNote:'按币种分别显示提供的账户金额，不连接账户，不进行汇率换算。',
  transactionNote:'按原始顺序显示提供的交易。筛选仅在本地进行，不推算余额、结算或付款结果。',
  subtotalNote:'已知金额小计仅包含提供的已知金额，不代表完整余额或净资产。',
  precisionNote:'按提供的数值显示，不推断币种精度。小计仅供展示，不用于财务对账。',
  observed:'提供的观察时间标签',source:'来源',opensNewTab:'在新标签页中打开',currencyFilter:'按币种筛选',allCurrencies:'所有币种',
  amount:'金额',currency:'币种',account:'账户',category:'类别',knownSubtotal:'已知金额小计',notSupplied:'未提供金额',subtotalUnavailable:'无法计算：没有已知金额',
  zeroShares:'所有已知金额均为零，无法定义分布占比。',unknownShares:'未知金额不分配占比。',
  accountsEmpty:'未提供账户金额。',transactionsEmpty:'未提供交易。',noMatch:'没有符合筛选条件的已提供交易。',
  directionFilter:'按方向筛选',monthFilter:'按月份筛选',allDirections:'所有方向',allMonths:'所有月份',reset:'重置筛选',
  date:'日期',description:'描述',direction:'方向',status:'提供的状态',debit:'支出',credit:'收入',pending:'待处理',posted:'已入账',statusUnknown:'未提供状态',
  counterparty:'交易对方',note:'备注',details:'详情',
  accountCounts:(count:number,unknown:number)=>`提供 ${count} 个账户，其中 ${unknown} 个金额未知。`,
  visibleCounts:(visible:number,total:number)=>`显示 ${total} 条已提供记录中的 ${visible} 条。`,
  accountTable:(currency:string)=>`提供的账户金额（${currency}）`,
});
