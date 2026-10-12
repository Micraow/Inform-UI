// Test-only candidate registrations exercise source closure before central integration.
import {install as financeSource} from '../../scripts/schema-source/modules/finance-source.mjs';
import {install as financeSnapshots} from '../../scripts/schema-source/modules/finance-snapshots.mjs';
import {install as ledgerSource} from '../../scripts/schema-source/modules/ledger-source.mjs';
import {install as ledgerLists} from '../../scripts/schema-source/modules/ledger-lists.mjs';
import {install as ledgerMoney} from '../../scripts/schema-source/modules/ledger-money.mjs';
import {install as ledgerRecords} from '../../scripts/schema-source/modules/ledger-records.mjs';
import {install as ledgerCorrection} from '../../scripts/schema-source/modules/ledger-correction.mjs';
import {install as ledgerIncomePaycheck} from '../../scripts/schema-source/modules/ledger-income-paycheck.mjs';
import {install as ledgerIncome} from '../../scripts/schema-source/modules/ledger-income.mjs';
import {install as ledgerSpend} from '../../scripts/schema-source/modules/ledger-spend.mjs';
import {install as ledgerUpcoming} from '../../scripts/schema-source/modules/ledger-upcoming.mjs';
const module=(id,install,provides,nodeTypes,dependsOn)=>({id,install,provides,nodeTypes,dependsOn});
export const financeModules=[
  module('shared/finance-source',financeSource,['FinanceSource'],[],[]),
  module('finance/snapshots',financeSnapshots,['FinanceInstrument','FinanceRange','FinanceQuoteNode','FinanceChartNode','FinanceComparisonNode','FinanceHeatmapNode'],['finance-quote','finance-chart','finance-comparison','finance-heatmap'],['shared/value','shared/finance-source']),
  module('shared/ledger-source',ledgerSource,['LedgerSource'],[],[]),
  module('finance/ledger-lists',ledgerLists,['LedgerAccount','LedgerTransaction','AssetDistributionNode','TransactionListNode'],['asset-distribution','transaction-list'],['shared/value','shared/ledger-source']),
  module('shared/ledger-money',ledgerMoney,['LedgerExactMoney'],[],[]),
  module('finance/ledger-records',ledgerRecords,['LedgerAccountSnapshot','LedgerAccountsNode','LedgerRecurringRecord','LedgerRecurringTransactionsNode'],['ledger-accounts','ledger-recurring-transactions'],['shared/value','shared/ledger-source','shared/ledger-money']),
  module('finance/ledger-correction',ledgerCorrection,['LedgerCorrectionCategory','LedgerCorrectionTransaction','LedgerLowConfidenceCategoryCorrectionNode'],['ledger-low-confidence-category-correction'],['shared/value','shared/ledger-source','shared/ledger-money']),
  module('shared/ledger-income-paycheck',ledgerIncomePaycheck,['LedgerIncomePaycheck'],[],[]),
  module('finance/ledger-spend',ledgerSpend,['SpendTrendPoint','SpendTrendSeries','SpendCategory','LedgerSpendSoFarThisMonthNode'],['ledger-spend-so-far-this-month'],['shared/value']),
  module('finance/ledger-upcoming',ledgerUpcoming,['UpcomingActivity','UpcomingFlow','UpcomingFlows','LedgerUpcomingActivityNode'],['ledger-upcoming-activity'],['shared/value']),
  module('finance/ledger-income',ledgerIncome,['LedgerIncomeTrackerNode'],['ledger-income-tracker'],['shared/value','shared/ledger-source','shared/ledger-income-paycheck'])
];
