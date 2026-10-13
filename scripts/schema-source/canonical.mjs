import {createDocumentSchema} from './envelope.mjs';
import {createSchemaRegistry} from './registry.mjs';

/** Full assembly order for the maintained module registry; no legacy definitions remain here. */
export async function buildCanonicalSchema(){
const registry=createSchemaRegistry();
const {defs,owners,nodes}=registry;
registry.use('shared/value');
registry.use('foundations/text');
registry.use('content/supplied-records');
registry.use('choices/local');
registry.use('travel/snapshots');
registry.use('readers/supplied');
registry.use('decisions/supplied');
registry.use('travel/discovery');
registry.use('activities/supplied');
registry.use('vocabulary/supplied');
registry.use('citations/supplied');
registry.use('entities/facts');
registry.use('readers/discussion');
registry.use('foundations/content');
registry.use('foundations/layout');
registry.use('forms/fields');
registry.use('foundations/button');
registry.use('graphics/topology');
registry.use('charts/basic');
registry.use('time/controls');
registry.use('weather/snapshot');

registry.use('sports/motorsport');
registry.use('sports/model');
registry.use('learning/basic');
// Existing supplied financial and ledger source modules; historical order is retained.
registry.use('shared/finance-source');
registry.use('finance/snapshots');
registry.use('shared/ledger-source');
registry.use('finance/ledger-lists');
registry.use('shared/ledger-money');
registry.use('finance/ledger-records');
registry.use('sports/match-scores');
registry.use('results/supplied');
registry.use('sports/statistics');
registry.use('converters/local');
registry.use('graphics/vector');
registry.use('compatibility/native');
// Independent finite follow-up intents; no host-service execution.
registry.use('requests/follow-up-cards');
registry.use('finance/transaction-detail');
registry.use('requests/snapshot-cards');
// Existing supplied learning media keeps original JSON definition and node order.
registry.use('learning/practice-media');
registry.use('weather/sidebar');
registry.use('finance/ledger-correction');

registry.use('finance/net-worth');
registry.use('foundations/pressable');
registry.use('finance/fee-interest');
registry.use('content/html-view');
registry.use('media/readers');
registry.use('media/async-images');
registry.use('media/lottie');
// Exact supplied income labels; no estimation, account lookup or date prediction.
registry.use('shared/ledger-income-paycheck');
registry.use('content/tabbed-section');
registry.use('content/visual-cards');
registry.use('content/link-cards');
registry.use('finance/ledger-spend');
registry.use('finance/ledger-upcoming');
registry.use('media/image-grid');
registry.use('requests/action-bars');
registry.use('finance/ledger-income');
registry.use('media/async-video');

registry.use('automation/views');
registry.use('requests/scheduled-suggestion');

registry.use('entities/cards');

registry.use('requests/user');
registry.use('finance/category-views');
registry.use('voice/cards');
registry.use('onboarding/conversation');
registry.use('onboarding/cards');
registry.use('learning/study-demo');
registry.use('onboarding/lookup');
registry.use('learning/quiz-cards');
registry.use('onboarding/welcome');
registry.use('requests/location');
registry.use('reservations/pills');
registry.use('onboarding/search-capability');
registry.use('tasks/cards');
registry.use('finance/entry');
registry.use('context/actions');
registry.use('finance/equity-watch');
registry.use('launchers/cards');
registry.use('discovery/cards');
registry.use('finance/credit-display');
registry.use('interactions/local');
registry.use('learning/visualization');
registry.use('care/providers');
registry.use('media/inline-host');
registry.use('calculators/corrected-age');
registry.use('calculators/gcs');
registry.use('calculators/rox');
registry.use('calculators/qsofa');
registry.use('forms/questionnaire');

registry.use('content/rating-summary');
registry.finalize();
const schema = createDocumentSchema({...defs});
return {schema,owners,nodes};
}
