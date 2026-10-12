import {recommendationCardSchema} from '../../recommendation-card-schema.mjs';
import {promptChecklistSchema} from '../../prompt-checklist-schema.mjs';
import {financeStatusSchema} from '../../finance-status-schema.mjs';
/** Existing maintained contract; source registration only. */
export function install({defs,node,registerDefinedNode}){
defs.RecommendationCardNode={...recommendationCardSchema(),type:'object',properties:{type:{const:'recommendation-card'}},required:['type']};registerDefinedNode('RecommendationCardNode','base');
defs.PromptChecklistNode={...promptChecklistSchema(),type:'object',properties:{type:{const:'prompt-checklist'}},required:['type']};registerDefinedNode('PromptChecklistNode','base');
defs.LedgerFinanceStatusBannerNode={...financeStatusSchema(),type:'object',properties:{type:{const:'ledger-finance-status-banner'}},required:['type']};registerDefinedNode('LedgerFinanceStatusBannerNode','finance');

}
