// Extracted public pure domain inspections with an evaluated-data adapter.
import {inspectQuestionnaire} from './core/questionnaire.js';
import {inspectQsofa} from './core/qsofa.js';
import {inspectRox} from './core/rox.js';
import {inspectGcs,inspectGcsPresentation} from './core/gcs.js';
import {inspectCorrectedAge} from './core/corrected-age.js';
import {inspectInlineHostMedia} from './core/inline-host-media.js';
import {inspectCareProvider} from './core/care-providers.js';
import {inspectLearningViz} from './core/learning-viz.js';
import {inspectSuppliedInteraction} from './core/supplied-interactions.js';
import {inspectSuppliedCredit} from './core/credit-score.js';
import {inspectSuppliedDiscovery} from './core/supplied-discovery.js';
import {inspectSuppliedLauncher} from './core/supplied-launchers.js';
import {inspectEquityWatch} from './core/equity-watchlist.js';
import {inspectContextAction} from './core/context-actions.js';
import {inspectFinanceEntry} from './core/finance-entry.js';
import {inspectTaskCard} from './core/task-cards.js';
import {inspectCapabilitySearch} from './core/capability-search.js';
import {inspectReservationPillsCarousel} from './core/reservation-pills.js';
import {inspectAskLocation} from './core/ask-location.js';
import {inspectCapabilityWelcome} from './core/capability-welcome.js';
import {inspectQuizCards} from './core/quiz-cards.js';
import {inspectSearchOnboarding} from './core/search-onboarding.js';
import {inspectWeatherSupplied} from './core/weather-supplied.js';
import {inspectStudyOnboarding} from './core/study-onboarding.js';
import {inspectOnboardingCards} from './core/onboarding-cards.js';
import {inspectConversationalOnboarding} from './core/conversational-onboarding.js';
import {inspectVoiceCards} from './core/voice-cards.js';
import {inspectLedgerCategory} from './core/ledger-category.js';
import {inspectAskUser} from './core/ask-user.js';
import {inspectEntity} from './core/entity.js';
import {inspectScheduledSuggestion} from './core/scheduled-suggestion.js';
import {inspectAutomation} from './core/automation.js';
import{inspectTabbedVisual}from'./core/tabbed-visual.js';
import{inspectSuppliedLink}from'./core/supplied-links.js';
import {inspectSpendMonth} from './core/spend-month.js';
import {inspectUpcomingActivity} from './core/upcoming-activity.js';
import {inspectImageGrid} from './core/image-grid.js';
import {inspectConversationSuggestions} from './core/conversation-suggestions.js';
import {inspectFollowUpActionBar} from './core/follow-up-action-bar.js';
import {inspectAsyncVideo,checkAsyncVideoStatus} from './core/async-video.js';
import {inspectIncomeTracker} from './core/income-tracker.js';
import {inspectLottie,checkLottieTimes} from './core/lottie.js';
import {inspectAsyncImages,checkAsyncImageStatus} from './core/async-image.js';
import {inspectSearchImage} from './core/search-image.js';
import {inspectYouTube} from './core/youtube.js';
import {inspectFeeInterest} from './core/fee-interest.js';
import {inspectPressable} from './core/pressable.js';
import {inspectNetWorth} from './core/net-worth.js';
import {inspectWeatherSidebar} from './core/weather-sidebar.js';
import {inspectCategoryCorrection} from './core/category-correction.js';
import {inspectLearningMedia,isLearningMedia} from './core/learning-media.js';
import {inspectMatchScores} from './core/match-scores.js';
import {inspectSuppliedResults} from './core/supplied-results.js';
import {inspectBoxscore} from './core/boxscores.js';
import {inspectMotorsport} from './core/motorsport.js';
import {inspectPlayerSummary} from './core/player-summaries.js';
import {inspectLedgerRecords} from './core/ledger-records.js';
import {inspectPromptChecklist} from './core/prompt-checklist.js';
import {inspectFinanceStatus} from './core/finance-status.js';
import {inspectRecommendationCard} from './core/recommendation-card.js';
import {inspectTransactionDetail} from './core/transaction-detail.js';
import {inspectFollowUpCardGroup} from './core/follow-up-card-group.js';
import {inspectRelatedQuestions} from './core/related-questions.js';
import {inspectEntityFacts} from './core/entity-facts.js';
import {inspectSourceCitation} from './core/source-citations.js';
import {inspectVocabulary} from './core/vocabulary.js';
import {inspectActivityPlanning} from './core/activity-planning.js';
import {inspectFlightDiscovery} from './core/flight-discovery.js';
import {inspectLocalPlace} from './core/local-places.js';
import {inspectDecisionCard} from './core/decision-cards.js';
import {inspectMailFiles} from './core/mail-files.js';
import {inspectPoll} from './core/poll.js';
import {inspectTracker} from './core/trackers.js';
import {inspectOnboarding} from './core/onboarding.js';
import {inspectFlightOption,inspectArtistEvents} from './core/travel-events.js';
import {inspectLocationChoice,inspectBusinessGallery} from './core/choice-gallery.js';
import {inspectLedger} from './core/ledger.js';
import {inspectAvailability} from './core/availability.js';
import {inspectThread} from './core/thread.js';
import {inspectNewsArticle} from './core/news.js';
import {inspectEntityReviews} from './core/entity-reviews.js';
import {inspectPersonProfile} from './core/person-profile.js';
import {inspectAgenda} from './core/agenda.js';
import {ratingValueIssue} from './core/rating.js';
import {inspectRatingSummary} from './core/rating-summary.js';
import {inspectVocabCard} from './core/vocab.js';
import {inspectConverters} from './core/converters.js';
import {inspectClock} from './core/time.js';
import {tableLayout, isTableCellObject, TableLayoutError} from './core/table.js';
import {inspectHeatmap} from './core/heatmap.js';
import {isFinance,inspectFinance} from './core/finance.js';
import {inspectMenu} from './core/menu.js';
import {inspectSuggestions} from './core/suggestions.js';
import {inspectChecklist} from './core/checklist.js';
import {inspectFillBlank} from './core/fill-blank.js';
import {inspectSentenceBuilder} from './core/sentence-builder.js';
import {isLearning,inspectLearning} from './core/learning.js';
import {isSports,inspectSports} from './core/sports.js';
import {inspectExtension,timestamp,chartXDomain,chartYDomain,isField,fieldTypeIssue} from './core/extensions.js';
import {isSafeURL} from './core/index';
import type {Issue} from './core/index';
import type {Budget} from '@inform/component-contract';
import type {ViewSpec} from '../index';
const pointer=(path:string,key:string|number)=>path+'/'+String(key).replace(/~/g,'~0').replace(/\//g,'~1');
const issue=(code:string,path:string,message:string):Issue=>({code,path,message});
const svgNumeric = new Set(['x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height', 'stroke-width', 'opacity', 'fill-opacity', 'stroke-opacity', 'font-size', 'dx', 'dy']);
const svgAttributes = new Set([...svgNumeric, 'fill', 'stroke', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'd', 'points', 'text-anchor', 'dominant-baseline', 'font-weight', 'transform']);
const paint = /^(?:none|currentColor|transparent|black|white|red|green|blue|gray|grey|orange|purple|#[\da-f]{3,4}|#[\da-f]{6}|#[\da-f]{8}|(?:rgb|rgba|hsl|hsla)\([\d.%,\s+-]+\))$/i;
const numericText = /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?$/i;
function inspectSvg(node: any, path: string, add: (issue: Issue) => void) {
  const box = node.viewBox.split(/\s+/).map(Number);
  if (box.some((v:number) => !Number.isFinite(v)) || box[2] <= 0 || box[3] <= 0 || !Number.isFinite(box[2] * box[3])) add(issue('SVG_VIEWBOX', pointer(path, 'viewBox'), 'SVG width and height must be positive finite values.'));
  node.shapes.forEach((shape:any, i:number) => {
    const base = `${path}/shapes/${i}/attrs`;
    for (const [key, value] of Object.entries(shape.attrs)) {
      const at = pointer(base, key), str = String(value);
      if (['d', 'points', 'stroke-dasharray', 'transform'].includes(key)) {
        const numericTokens = str.match(/[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?/gi) ?? [];
        if (numericTokens.some((token) => !Number.isFinite(Number(token)))) add(issue('SVG_NUMBER', at, 'SVG numeric lists must contain finite numbers.'));
      }
      if (!svgAttributes.has(key)) { add(issue('SVG_ATTRIBUTE', at, `Unsupported SVG attribute: ${key}.`)); continue; }
      if ((key === 'fill' || key === 'stroke') && !paint.test(str)) add(issue('SVG_PAINT', at, 'SVG paint must be a safe literal color.'));
      if (svgNumeric.has(key)) {
        const n = Number(value);
        if (!numericText.test(str) || !Number.isFinite(n)) add(issue('SVG_NUMBER', at, 'SVG numeric attributes must be finite unitless numbers.'));
        else if ((['r', 'rx', 'ry', 'width', 'height', 'stroke-width', 'font-size'].includes(key) && n < 0) || (key.endsWith('opacity') && (n < 0 || n > 1))) add(issue('SVG_NUMBER', at, 'SVG dimension or opacity is outside its valid range.'));
      }
      if (key === 'd' && !/^[MmZzLlHhVvCcSsQqTtAa\d\s.,eE+-]*$/.test(str)) add(issue('SVG_PATH', at, 'SVG path contains unsupported characters.'));
      if ((key === 'points' || key === 'stroke-dasharray') && !(key === 'stroke-dasharray' && str === 'none') && !/^[-+\d.eE,\s]+$/.test(str)) add(issue('SVG_NUMBER', at, 'Expected a numeric SVG list.'));
      if (key === 'transform' && !/^(?:(?:translate|scale|rotate|matrix|skewX|skewY)\(\s*[-+\d.eE,\s]+\)\s*)+$/.test(str)) add(issue('SVG_TRANSFORM', at, 'Only numeric SVG transforms are supported.'));
      const enums: Record<string, string[]> = { 'stroke-linecap': ['butt', 'round', 'square'], 'stroke-linejoin': ['miter', 'round', 'bevel'], 'text-anchor': ['start', 'middle', 'end'], 'dominant-baseline': ['auto', 'middle', 'central', 'hanging', 'text-before-edge', 'text-after-edge', 'alphabetic'], 'font-weight': ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'] };
      if (enums[key] && !enums[key].includes(str)) add(issue('SVG_ATTRIBUTE', at, `Invalid ${key} value.`));
    }
  });
}

const baseTypes:Record<string,string>={Text:'text',Heading:'title',Badge:'badge',Divider:'divider',Alert:'callout',Table:'table',Stack:'col',Row:'row',Grid:'grid',Card:'card',Button:'button',Input:'input',Textarea:'textarea',Select:'select',RadioGroup:'radio',Checkbox:'toggle',Switch:'toggle',Slider:'slider',Image:'image',Icon:'icon'};
function descriptor(element:any,all:readonly ViewSpec[]):any {
 const spec=all.find(x=>x.name===element.typeName);const props=element.props??{};
 const node:any=spec?{type:spec.oldType,...props.data}:{type:baseTypes[element.typeName]??element.typeName,...props};
 if(props.content!==undefined)node.value=props.content;
 if(Array.isArray(props.children))node.children=props.children.map((x:any)=>descriptor(x,all));
 return node;
}
export function validateDomainSemantics(spec:ViewSpec,props:Readonly<Record<string,unknown>>,all:readonly ViewSpec[],budget:Budget):readonly Issue[]{
 const issues:Issue[]=[];const add=(value:Issue)=>{budget.consume();if(issues.length<40)issues.push(value);};const path='/data';
 const node:any={type:spec.oldType,...props.data as Record<string,unknown>};const state:Record<string,any>={};
 for(const key of Object.keys(spec.slots))node[key]=(props[key] as any[]??[]).map(x=>descriptor(x,all));
 if(spec.oldType==='checklist'){node.items=node.items.map((x:any,i:number)=>({...x,bind:'item'+i}));node.items.forEach((x:any,i:number)=>state[x.bind]=((props.data as any).items[i].checked??false));}
 if(spec.oldType==='conversational-onboarding-search'){if(node.weather)node.weather={...node.weather,snapshot:{...node.weather.snapshot,type:'weather'}};if(node.stock)node.stock={...node.stock,snapshot:{...node.stock.snapshot,type:'finance-chart'}};}
 if(spec.oldType==='whats-new-capability-search'&&node.locationWidget)node.locationWidget={...node.locationWidget,type:'ask-user-location'};
 try {
 budget.consume();
    if(node.type!=='segmented')inspectExtension(node,path,state,add);
    if(node.type==='weather')inspectWeatherSupplied(node,path,add);
    if(isSports(node))inspectSports(node,path,add,isSafeURL);
    if(isLearning(node))inspectLearning(node,path,add);
    if(node.type==='vocab-card')inspectVocabCard(node,path,add);
    if(node.type==='restaurant-menu')inspectMenu(node,path,add,isSafeURL);
    if(node.type==='prompt-suggestions')inspectSuggestions(node,path,add);
    if(node.type==='fill-blank')inspectFillBlank(node,path,add);
    if(node.type==='checklist')inspectChecklist(node,path,state,add);
    if(node.type==='sentence-builder')inspectSentenceBuilder(node,path,add);
    if(isFinance(node))inspectFinance(node,path,add,isSafeURL);
    if(node.type==='asset-distribution'||node.type==='transaction-list')inspectLedger(node,path,add,isSafeURL);
    if(node.type==='finance-heatmap')inspectHeatmap(node,path,add,isSafeURL);
    if(node.type==='unit-converter'||node.type==='currency-converter')inspectConverters(node,path,add,isSafeURL);
    if(node.type==='clock')inspectClock(node,path,add);
    if(node.type==='person-profile')inspectPersonProfile(node,path,add,isSafeURL);
    if(node.type==='news-article')inspectNewsArticle(node,path,add,isSafeURL);
    if(node.type==='entity-reviews')inspectEntityReviews(node,path,add,isSafeURL);
    if(node.type==='package-tracker'||node.type==='flight-tracker')inspectTracker(node,path,add,isSafeURL);
    if(node.type==='ledger-fee-interest-paid')inspectFeeInterest(node,path,add,isSafeURL);
    if(node.type==='search-image')inspectSearchImage(node,path,add,isSafeURL);
    if(node.type==='youtube')inspectYouTube(node,path,add);
    if(node.type==='async-image'||node.type==='async-image-group')inspectAsyncImages(node,path,add,isSafeURL);
    if(node.type==='lottie')inspectLottie(node,path,add);
    if(node.type==='tabbed-section'||node.type==='visual-card-carousel')inspectTabbedVisual(node,path,add,isSafeURL);
    if((node.type==='link'&&node.href===undefined)||node.type==='link-card'||node.type==='recommendation-link-card')inspectSuppliedLink(node,path,add,isSafeURL);
    if(node.type==='ledger-spend-so-far-this-month')inspectSpendMonth(node,path,add);
    if(node.type==='ledger-upcoming-activity')inspectUpcomingActivity(node,path,add,isSafeURL);
    if(node.type==='image-grid')inspectImageGrid(node,path,add,isSafeURL);
    if(node.type==='conversation-suggestions')inspectConversationSuggestions(node,path,add,isSafeURL);
    if(node.type==='follow-up-action-bar')inspectFollowUpActionBar(node,path,add,isSafeURL);
    if(node.type==='async-video-carousel')inspectAsyncVideo(node,path,add,isSafeURL);
    if(node.type==='ledger-income-tracker')inspectIncomeTracker(node,path,add,isSafeURL);
    if(node.type==='pressable')inspectPressable(node,path,add);
    if(node.type==='ledger-net-worth')inspectNetWorth(node,path,add,isSafeURL);
    if(node.type==='weather-sidebar-title')inspectWeatherSidebar(node,path,add,isSafeURL);
    if(node.type==='ledger-low-confidence-category-correction')inspectCategoryCorrection(node,path,add,isSafeURL);
    if(isLearningMedia(node))inspectLearningMedia(node,path,add,isSafeURL);
    if(node.type==='nba-scores'||node.type==='soccer-games'||node.type==='american-football-games')inspectMatchScores(node,path,add,isSafeURL);
    if(node.type==='basketball-tournament'||node.type==='election-results')inspectSuppliedResults(node,path,add,isSafeURL);
    if(node.type==='nba-game-boxscore'||node.type==='cricket-match-boxscore')inspectBoxscore(node,path,add,isSafeURL);
    if(node.type==='f1-races'||node.type==='f1-standings')inspectMotorsport(node,path,add,isSafeURL);
    if(node.type==='nba-player-summary'||node.type==='tennis-player-summary')inspectPlayerSummary(node,path,add,isSafeURL);
    if(node.type==='ledger-accounts'||node.type==='ledger-recurring-transactions')inspectLedgerRecords(node,path,add,isSafeURL);
    if(node.type==='display-automation'||node.type==='list-automations'||node.type==='automation-plan-summary')inspectAutomation(node,path,add,isSafeURL);
    if(node.type==='scheduled-task-suggestion')inspectScheduledSuggestion(node,path,add);
    if(node.type==='entity-card'||node.type==='entity-overview')inspectEntity(node,path,add,isSafeURL);
    if(node.type==='conversational-onboarding-study')inspectStudyOnboarding(node,path,add);
    if(node.type==='conversational-onboarding-search')inspectSearchOnboarding(node,path,add,isSafeURL);
    if(node.type==='follow-up-quiz'||node.type==='multiple-choice-block-v2'||node.type==='personality-quiz')inspectQuizCards(node,path,add,isSafeURL);
    if(node.type==='reservation-time-pills-ref-carousel')inspectReservationPillsCarousel(node,path,add,isSafeURL);
    if(node.type==='whats-new-capability-search')inspectCapabilitySearch(node,path,add,isSafeURL);
    if(node.type==='calculator-rox-index-for-high-flow-nasal-cannula')inspectRox(node,path,add);
    if(node.type==='calculator-qsofa-score')inspectQsofa(node,path,add);
    if(node.type==='questionnaire')inspectQuestionnaire(node,path,add);
    if(node.type==='calculator-glasgow-coma-scale-gcs'){inspectGcs(node,path,add);inspectGcsPresentation(node,path,add);}
    if(node.type==='calculator-corrected-adjusted-age-of-preterm-infants')inspectCorrectedAge(node,path,add);
    if(node.type==='entity'||node.type==='gen-image'||node.type==='speech-synthesizer')inspectInlineHostMedia(node,path,add,isSafeURL);
    if(node.type==='care-provider-results'||node.type==='care-provider-sidebar')inspectCareProvider(node,path,add,isSafeURL);
    if(node.type==='learning-viz-dil')inspectLearningViz(node,path,add);
    if(node.type==='ledger-low-confidence-category-correction-legacy'||node.type==='superbowl-riddle')inspectSuppliedInteraction(node,path,add,isSafeURL);
    if(node.type==='ledger-credit-score'||node.type==='ledger-credit-score-detail')inspectSuppliedCredit(node,path,add,isSafeURL);
    if(node.type==='bento'||node.type==='open-detail'||node.type==='openai')inspectSuppliedDiscovery(node,path,add,isSafeURL);
    if(node.type==='homework-helper-v2'||node.type==='image-gen'||node.type==='internal-partner-app')inspectSuppliedLauncher(node,path,add,isSafeURL);
    if(node.type==='ledger-equity-updates'||node.type==='ledger-watchlist')inspectEquityWatch(node,path,add);
    if(node.type==='places-metadata-bar'||node.type==='plugin-followup'||node.type==='instant-suggestions')inspectContextAction(node,path,add,isSafeURL);
    if(node.type==='ledger-finance-onboarding'||node.type==='ledger-repair-bank-connection'||node.type==='finance-onboarding-suggestions')inspectFinanceEntry(node,path,add,isSafeURL);
    if(node.type==='push-drip-series-intro'||node.type==='stop-push-drip-series'||node.type==='task-autopause-card')inspectTaskCard(node,path,add);
    if(node.type==='ask-user-location')inspectAskLocation(node,path,add,isSafeURL);
    if(node.type==='whats-new-capability-welcome')inspectCapabilityWelcome(node,path,add,isSafeURL);
    if(node.type==='onboarding-feature-card'||node.type==='onboarding-plugin-suggestions'||node.type==='onboarding-starter-tasks')inspectOnboardingCards(node,path,add,isSafeURL);
    if(node.type==='conversational-onboarding-advice'||node.type==='conversational-onboarding-writing')inspectConversationalOnboarding(node,path,add,isSafeURL);
    if(node.type==='learning-speak-card'||node.type==='learning-voice-mode-launcher-card'||node.type==='offer-voice-conversation')inspectVoiceCards(node,path,add,isSafeURL);
    if(node.type==='ledger-spend-by-category'||node.type==='ledger-spend-by-category-detail'||node.type==='ledger-spend-by-category-recent-transactions')inspectLedgerCategory(node,path,add,isSafeURL);
    if(node.type==='ask-user-details'||node.type==='ask-user-files')inspectAskUser(node,path,add);
    if(node.type==='prompt-checklist')inspectPromptChecklist(node,path,add,isSafeURL);
    if(node.type==='ledger-finance-status-banner')inspectFinanceStatus(node,path,add);
    if(node.type==='recommendation-card')inspectRecommendationCard(node,path,add,isSafeURL);
    if(node.type==='ledger-transaction-detail')inspectTransactionDetail(node,path,add,isSafeURL);
    if(node.type==='follow-up-card-group')inspectFollowUpCardGroup(node,path,add,isSafeURL);
    if(node.type==='sidebar-people-also-ask')inspectRelatedQuestions(node,path,add,isSafeURL);
    if(node.type==='sidebar-fact-table'||node.type==='entity-thumbnail-list')inspectEntityFacts(node,path,add,isSafeURL,url=>isSafeURL(url,'image'));
    if(node.type==='code-cite'||node.type==='file-cite')inspectSourceCitation(node,path,add,isSafeURL);
    if(node.type==='word-card'||node.type==='copy-words')inspectVocabulary(node,path,add,isSafeURL);
    if(node.type==='shared-activity-planner'||node.type==='event-sidebar')inspectActivityPlanning(node,path,add,isSafeURL);
    if(node.type==='flight-search-form'||node.type==='flight-results')inspectFlightDiscovery(node,path,add,isSafeURL);
    if(node.type==='local-business'||node.type==='restaurant-reviews')inspectLocalPlace(node,path,add,isSafeURL);
    if(node.type==='jobs'||node.type==='product-card')inspectDecisionCard(node,path,add,isSafeURL,url=>isSafeURL(url,'image'));
    if(node.type==='email-preview'||node.type==='file-nav-list')inspectMailFiles(node,path,add,isSafeURL);
    if(node.type==='create-interactive-poll')inspectPoll(node,path,add);
    if(node.type==='onboarding-selection')inspectOnboarding(node,path,add);
    if(node.type==='location-choice-request')inspectLocationChoice(node,path,add,isSafeURL);
    if(node.type==='business-gallery')inspectBusinessGallery(node,path,add,url=>isSafeURL(url,'image'));
    if(node.type==='flight-option')inspectFlightOption(node,path,add,isSafeURL);
    if(node.type==='artist-upcoming-events')inspectArtistEvents(node,path,add,isSafeURL);
    if(node.type==='restaurant-availability')inspectAvailability(node,path,add,isSafeURL);
    if(node.type==='reddit-thread-card')inspectThread(node,path,add,isSafeURL);
    if(node.type==='agenda')inspectAgenda(node,path,add,isSafeURL);
    if(node.type==='weather'&&node.source.url&&!isSafeURL(node.source.url))add(issue('UNSAFE_URL',`${path}/source/url`,'Weather source URL is outside the allowed policy.'));

 if(node.type==='rating-summary')inspectRatingSummary(node,path,add,isSafeURL);
 if(node.type==='svg')inspectSvg(node,path,add);
 if(node.type==='favicon'&&node.src!==undefined&&!isSafeURL(node.src,'image'))add(issue('UNSAFE_URL',path+'/src','Favicon URL is outside the allowed policy.'));
 if(node.type==='blockquote'&&node.cite&&!isSafeURL(node.cite))add(issue('UNSAFE_URL',path+'/cite','Quote source URL is outside the allowed policy.'));
 if(node.type==='link'&&node.href!==undefined&&!isSafeURL(node.href))add(issue('UNSAFE_URL',path+'/href','Link URL is outside the allowed policy.'));
 if(node.type==='citation'||node.type==='web-link-cards'){const links=node.type==='citation'?[node]:node.items;for(const x of links)if(!/^https?:\/\//i.test(x.url)||!isSafeURL(x.url))add(issue('UNSAFE_URL',path,'Source links require safe absolute HTTP(S) URLs.'));}
 if(node.type==='rating'){const e=ratingValueIssue({...node,bind:'value'},props.value as any,'/value');if(e)add(e);}
 if(node.type==='segmented'){const seen=new Set();for(const option of node.options){if(seen.has(option.value))add(issue('DUPLICATE_OPTION',path+'/options','Choice values must be unique.'));seen.add(option.value);if(typeof option.value!==typeof props.value)add(issue('INPUT_TYPE','/value','Choice value type must match its options.'));}if(!seen.has(props.value))add(issue('INPUT_OPTION','/value','Choice must name a supplied option.'));}
 if(node.type==='tab-group'){const children=node.children??[],initial=node.initialIndex??0;if(initial>=children.length||children[initial]?.disabled)add(issue('TAB_SELECTION','/data/initialIndex','Initial index must select an enabled child panel.'));if(!children.some((x:any)=>!x.disabled))add(issue('TAB_SELECTION','/children','A tab group needs an enabled panel.'));}
 if(node.type==='topology'){const ids=new Set();for(const x of node.nodes){if(ids.has(x.id))add(issue('DUPLICATE_ID',path+'/nodes','Topology IDs must be unique.'));ids.add(x.id);}for(const link of node.links){if(!ids.has(link.from)||!ids.has(link.to))add(issue('TOPOLOGY_ENDPOINT',path+'/links','Topology endpoints must name supplied nodes.'));if(link.load!==undefined&&(typeof link.load!=='number'||link.load<0))add(issue('TOPOLOGY_LOAD',path+'/links','Link load must be a nonnegative finite number.'));}}
 if(node.type==='loading'&&node.progress!==undefined&&(typeof node.progress!=='number'||node.progress<0||node.progress>100))add(issue('LOADING_PROGRESS',path+'/progress','Progress must be a number from 0 to 100.'));
 if(node.type==='lottie')checkLottieTimes(node,path,x=>x as any,add);
 if(node.type==='async-video-carousel')checkAsyncVideoStatus(node,path,x=>x as any,add);
 if(node.type==='async-image'||node.type==='async-image-group')checkAsyncImageStatus(node,path,x=>x as any,add);
 if(node.disabled!==undefined&&typeof node.disabled!=='boolean')add(issue('INPUT_TYPE',path+'/disabled','Disabled must be an evaluated boolean.'));
 if(node.error!==undefined&&typeof node.error!=='string')add(issue('INPUT_TYPE',path+'/error','Error must be evaluated text.'));
 }catch(cause){add(issue('DOMAIN_SEMANTIC',path,cause instanceof Error?cause.message:'Domain validation failed.'));}
 return issues;
}
