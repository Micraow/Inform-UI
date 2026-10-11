import {renderInlineHostMedia} from './inline-host-media.js';
import inlineHostMediaStyles from './inline-host-media.css';
import {renderCareProvider} from './care-providers.js';
import careProviderStyles from './care-providers.css';
import {renderLearningViz} from './learning-viz.js';
import learningVizStyles from './learning-viz.css';
import {renderSuppliedInteraction} from './supplied-interactions.js';
import suppliedInteractionStyles from './supplied-interactions.css';
import {renderSuppliedCredit} from './credit-score.js';
import suppliedCreditStyles from './credit-score.css';
import {renderSuppliedDiscovery} from './supplied-discovery.js';
import suppliedDiscoveryStyles from './supplied-discovery.css';
import {renderSuppliedLauncher} from './supplied-launchers.js';
import suppliedLauncherStyles from './supplied-launchers.css';
import {renderEquityWatch} from './equity-watchlist.js';
import equityWatchStyles from './equity-watchlist.css';
import {renderContextAction} from './context-actions.js';
import contextActionStyles from './context-actions.css';
import {renderFinanceEntry} from './finance-entry.js';
import financeEntryStyles from './finance-entry.css';
import {renderTaskCard} from './task-cards.js';
import taskCardsStyles from './task-cards.css';
import {renderCapabilitySearch} from './capability-search.js';
import capabilitySearchStyles from './capability-search.css';
import {renderReservationPillsCarousel} from './reservation-pills.js';
import reservationPillsStyles from './reservation-pills.css';
import {renderAskLocation} from './ask-location.js';
import askLocationStyles from './ask-location.css';
import {renderCapabilityWelcome} from './capability-welcome.js';
import capabilityWelcomeStyles from './capability-welcome.css';
import {renderQuizCards} from './quiz-cards.js';
import quizCardsStyles from './quiz-cards.css';
import {renderSearchOnboarding} from './search-onboarding.js';
import searchOnboardingStyles from './search-onboarding.css';
import weatherSuppliedStyles from './weather-supplied.css';
import {renderStudyOnboarding} from './study-onboarding.js';
import studyOnboardingStyles from './study-onboarding.css';
import {renderOnboardingCards} from './onboarding-cards.js';
import onboardingCardsStyles from './onboarding-cards.css';
import {renderConversationalOnboarding} from './conversational-onboarding.js';
import conversationalOnboardingStyles from './conversational-onboarding.css';
import {renderVoiceCard} from './voice-cards.js';
import voiceCardsStyles from './voice-cards.css';
import {renderLedgerCategory} from './ledger-category.js';
import ledgerCategoryStyles from './ledger-category.css';
import {renderAskUser} from './ask-user.js';
import askUserStyles from './ask-user.css';
import {renderEntity} from './entity.js';
import entityStyles from './entity.css';
import {renderScheduledSuggestion} from './scheduled-suggestion.js';
import scheduledSuggestionStyles from './scheduled-suggestion.css';
import {renderAutomation} from './automation.js';
import automationStyles from './automation.css';
import{renderTabbedSection,renderVisualCards}from'./tabbed-visual.js';
import tabbedVisualStyles from './tabbed-visual.css';
import{renderSuppliedLink}from'./supplied-links.js';
import suppliedLinkStyles from './supplied-links.css';
import {renderSpendMonth} from './spend-month.js';
import spendMonthStyles from './spend-month.css';
import {renderUpcomingActivity} from './upcoming-activity.js';
import upcomingActivityStyles from './upcoming-activity.css';
import {renderImageGrid} from './image-grid.js';
import imageGridStyles from './image-grid.css';
import {renderConversationSuggestions} from './conversation-suggestions.js';
import conversationSuggestionStyles from './conversation-suggestions.css';
import {renderFollowUpActionBar} from './follow-up-action-bar.js';
import followUpActionStyles from './follow-up-action-bar.css';
import {renderAsyncVideo} from './async-video.js';
import asyncVideoStyles from './async-video.css';
import {renderIncomeTracker} from './income-tracker.js';
import incomeTrackerStyles from './income-tracker.css';
import {renderLottie} from './lottie.js';
import {renderAsyncImages} from './async-image.js';
import asyncImageStyles from './async-image.css';
import {renderSearchImage} from './search-image.js';
import {renderYouTube} from './youtube.js';
import searchImageStyles from './search-image.css';
import youtubeStyles from './youtube.css';
import {renderHtmlView} from './html-view.js';
import htmlViewStyles from './html-view.css';
import {renderFeeInterest} from './fee-interest.js';
import feeInterestStyles from './fee-interest.css';
import {renderPressable} from './pressable.js';
import pressableStyles from './pressable.css';
import {renderNetWorth} from './net-worth.js';
import netWorthStyles from './net-worth.css';
import {renderWeatherSidebar} from './weather-sidebar.js';
import {renderCategoryCorrection} from './category-correction.js';
import weatherSidebarStyles from './weather-sidebar.css';
import categoryCorrectionStyles from './category-correction.css';
import {renderLearningMedia} from './learning-media.js';
import learningMediaStyles from './learning-media.css';
import {renderMatchScores} from './match-scores.js';
import matchScoresStyles from './match-scores.css';
import {renderTournament,renderElectionResults} from './supplied-results.js';
import suppliedResultsStyles from './supplied-results.css';
import {renderBasketballBoxscore,renderCricketBoxscore} from './boxscores.js';
import boxscoreStyles from './boxscores.css';
import {renderMotorsportRaces,renderMotorsportStandings} from './motorsport.js';
import motorsportStyles from './motorsport.css';
import {renderPlayerSummary} from './player-summaries.js';
import playerSummaryStyles from './player-summaries.css';
import ledgerRecordsStyles from './ledger-records.css';
import {renderLedgerAccounts,renderLedgerRecurring} from './ledger-records.js';
import {renderPromptChecklist} from './prompt-checklist.js';
import promptChecklistStyles from './prompt-checklist.css';
import {renderFinanceStatus} from './finance-status.js';
import financeStatusStyles from './finance-status.css';
import {renderRecommendationCard} from './recommendation-card.js';
import recommendationStyles from './recommendation-card.css';
import {renderTransactionDetail} from './transaction-detail.js';
import transactionDetailStyles from './transaction-detail.css';
import {renderFollowUpCardGroup} from './follow-up-card-group.js';
import {renderGeneration} from './generation.js';
import {renderRelatedQuestions} from './related-questions.js';
import {renderFactTable,renderEntityThumbnails} from './entity-facts.js';
import {renderCodeCite,renderFileCite} from './source-citations.js';
import {renderWordCard,renderCopyWords} from './vocabulary.js';
import {renderActivityPlanner,renderEventSidebar} from './activity-planning.js';
import {renderFlightSearch,renderFlightResults} from './flight-discovery.js';
import {renderLocalBusiness,renderRestaurantReviews} from './local-places.js';
import {renderJobs} from './jobs.js';
import {renderProductCard} from './product-card.js';
import {renderEmailPreview} from './email-preview.js';
import {renderFileNav} from './file-nav.js';
import {renderPoll} from './poll.js';
import {renderTracker} from './trackers.js';
import {renderOnboarding} from './onboarding.js';
import {renderFlightOption} from './flight-option.js';
import {renderArtistEvents} from './artist-events.js';
import {renderLedger} from './ledger.js';
import {renderLocationChoice,renderBusinessGallery} from './choice-gallery.js';
import {renderEmailDraft} from './email-draft.js';
import {renderTaskExpansionCard} from './task-expansion-card.js';
import {renderMotion} from './motion.js';
import {renderAvailability} from './availability.js';
import {renderThread} from './thread.js';
import {renderNewsArticle} from './news.js';
import {renderEntityReviews} from './entity-reviews.js';
import {renderWriting} from './writing.js';
import {renderPersonProfile} from './person-profile.js';
import {renderMenu} from './menu.js';
import {renderSuggestions} from './suggestions.js';
import {createLabels} from './labels.js';
import {renderButton} from './button.js';
import {renderAgenda} from './agenda.js';
import {renderFavicon} from './favicon.js';
import {renderRating} from './rating.js';
import {renderVocabCard} from './vocab.js';
import {renderMarkdown} from './markdown.js';
import {renderTabs} from './tabs.js';
import {renderCode} from './code.js';
import {renderCarousel} from './carousel.js';
import {renderSource} from './sources.js';
import {renderLoading} from './loading.js';
import {renderPrimitive} from './primitives.js';
import {renderConverter} from './converters.js';
import {renderTime} from './time.js';
import {renderOverlay} from './overlays.js';
import {renderTable} from './table.js';
import {renderHeatmap} from './heatmap.js';
import {renderFinance} from './finance.js';
import {renderChecklist} from './checklist.js';
import {renderFillBlank} from './fill-blank.js';
import {renderSentenceBuilder} from './sentence-builder.js';
import {renderLearning} from './learning.js';
import {renderSports} from './sports.js';
import {createForms} from './forms.js';
import {renderWeather} from './weather.js';
import {renderChart} from './charts.js';
import {renderPie} from './pie.js';
import type {RendererContext,FormAction} from './context.js';
import katex from 'katex';
import { evaluateState, evaluateValue, validateDocument } from '../core/index.js';
import type { IUIDocument, Node, Value } from '../schema/document.js';
import stylesheet from './style.css';
import mathStyles from './math-style.css';
import { formatNumber, presentationLabels } from './presentation.js';
const styles: string = stylesheet + '\n' + mathStyles + '\n' + transactionDetailStyles + '\n' + recommendationStyles + '\n' + financeStatusStyles + '\n' + promptChecklistStyles + '\n' + ledgerRecordsStyles + '\n' + playerSummaryStyles + '\n' + motorsportStyles + '\n' + boxscoreStyles + '\n' + suppliedResultsStyles + '\n' + matchScoresStyles + '\n' + learningMediaStyles + '\n' + weatherSidebarStyles + '\n' + categoryCorrectionStyles + '\n' + netWorthStyles + '\n' + pressableStyles + '\n' + feeInterestStyles + '\n' + htmlViewStyles + '\n' + searchImageStyles + '\n' + youtubeStyles + '\n' + asyncImageStyles + '\n' + incomeTrackerStyles + '\n' + asyncVideoStyles + '\n' + followUpActionStyles + '\n' + conversationSuggestionStyles + '\n' + imageGridStyles + '\n' + upcomingActivityStyles + '\n' + spendMonthStyles + '\n' + suppliedLinkStyles + '\n' + tabbedVisualStyles + '\n' + automationStyles + '\n' + scheduledSuggestionStyles + '\n' + entityStyles + '\n' + askUserStyles + '\n' + ledgerCategoryStyles + '\n' + voiceCardsStyles + '\n' + conversationalOnboardingStyles + '\n' + onboardingCardsStyles + '\n' + studyOnboardingStyles + '\n' + weatherSuppliedStyles + '\n' + searchOnboardingStyles + '\n' + quizCardsStyles + '\n' + capabilityWelcomeStyles + '\n' + askLocationStyles + '\n' + reservationPillsStyles + '\n' + capabilitySearchStyles + '\n' + taskCardsStyles + '\n' + financeEntryStyles + '\n' + contextActionStyles + '\n' + equityWatchStyles + '\n' + suppliedLauncherStyles+'\n'+suppliedDiscoveryStyles+'\n'+suppliedCreditStyles+'\n'+suppliedInteractionStyles+'\n'+learningVizStyles+'\n'+careProviderStyles+'\n'+inlineHostMediaStyles;

export interface Controller {
  update(document: unknown): void;
  dispose(): void;
  getState(): Readonly<Record<string, string | number | boolean>>;
  setState(patch: Record<string, string | number | boolean>): void;
}
export interface MountOptions { styles?: boolean; actions?: Readonly<Record<string,FormAction>> }
export class InvalidDocumentError extends Error {
  readonly issues: readonly {code: string; path: string; message: string}[];
  constructor(issues: readonly {code: string; path: string; message: string}[]) {
    super(issues.map(i => `${i.code} ${i.path}: ${i.message}`).join('\n'));
    this.name = 'InvalidDocumentError'; this.issues = issues;
  }
}
let instance = 0;
const palette = {blue:'var(--iui-series-blue)',green:'var(--iui-series-green)',orange:'var(--iui-series-orange)',red:'var(--iui-series-red)',purple:'var(--iui-series-purple)',gray:'var(--iui-series-gray)'};
const shorten = (s: string, limit: number) => Array.from(s).length > limit ? Array.from(s).slice(0,limit-1).join('')+'…' : s;

/** Mount a validated, self-contained UI. Updates are synchronous and atomic. */
export function mount(container: HTMLElement, input: unknown, options: MountOptions = {}): Controller {
  if (!container?.ownerDocument) throw new TypeError('mount requires a DOM element');
  const doc = container.ownerDocument;
  const prefix = `iui-${++instance}-`;
  let disposed = false, revision = 0, internalSerial = 0;
  let active: ReturnType<typeof createGeneration> | undefined;
  const allocateInternalId = (role: string) => `iui-${role}-internal-${prefix}${++internalSerial}`;
  const ensureLive = () => { if (disposed) throw new Error('This UI controller has been disposed'); };
  function replace(next: unknown) {
    ensureLive();
    const ticket = revision;
    const validation = validateDocument(next);
    if (!validation.ok) throw new InvalidDocumentError(validation.issues);
    const evaluated = evaluateState(validation.document);
    if (!evaluated.ok) throw new InvalidDocumentError(evaluated.issues);
    // Invalid nested updates do not invalidate this transaction. Valid ones do.
    if (disposed || ticket !== revision) return;
    const generation = ++revision;
    const previous = active;
    const candidate = createGeneration(validation.document, {...evaluated.state}, {...evaluated.computed}, () => !disposed && revision === generation, root => publish(candidate, root));
    active = candidate;
    let cleanupError: unknown; let cleanupFailed = false;
    try { previous?.dispose(); } catch (error) { cleanupFailed = true; cleanupError = error; }
    try { candidate.start(); }
    catch (error) {
      // A failed initial mount has no returned controller to clean it up.
      // Retire exactly this partial candidate, never a newer reentrant owner.
      const failures = cleanupFailed ? [cleanupError, error] : [error];
      try { candidate.dispose(); } catch (releaseError) { failures.push(releaseError); }
      if (failures.length > 1) throw new AggregateError(failures, 'Rendering and cleanup failed');
      throw error;
    }
    if (cleanupFailed) throw cleanupError;
  }
  function publish(candidate: ReturnType<typeof createGeneration>, root: HTMLElement) {
    if (disposed || active !== candidate) return;
    try { container.replaceChildren(root); }
    finally {
      // A host hook can replace us before the native DOM write finishes.
      // Compensate that late write and restore only the newest ready owner.
      if (disposed || active !== candidate) { root.remove(); active?.restore(); }
    }
  }
  replace(input);
  return {
    update: replace,
    getState: () => { ensureLive(); return active!.getState(); },
    setState: patch => { ensureLive(); active!.setState(patch); },
    dispose: () => { if (disposed) return; disposed = true; revision++; const previous = active; active = undefined; previous?.dispose(); }
  };

  function createGeneration(initial: IUIDocument, initialState: Record<string, string | number | boolean>, initialComputed: Record<string, Value>, isCurrent: () => boolean, install: (root: HTMLElement) => void) {
  const lifetime = renderGeneration(isCurrent);
  const during = lifetime.during;
  let labels: ReturnType<typeof presentationLabels>;
  let stopped = false, ready = false;
  let hasHeading = false;
  const current = initial;
  let state = initialState;
  let computed = initialComputed;
  let root: HTMLElement;
  let error: HTMLElement;
  let refreshers: (() => void)[] = [];

  const text = (value: unknown) => value == null ? '' : String(value);
  const display = (value: unknown) => typeof value === 'number' ? formatNumber(value) : text(value);
  const showValue = (target: HTMLElement, value: unknown) => {
    during(() => { target.textContent = display(value); });
    if (typeof value === 'number') {
      const raw = Object.is(value, -0) ? '-0' : String(value);
      during(() => { target.dataset.rawValue = raw; });
      if (display(value) !== raw) during(() => { target.title = `${labels.rawValue}: ${raw}`; });
      else during(() => target.removeAttribute('title'));
    } else { during(() => { delete target.dataset.rawValue; }); during(() => target.removeAttribute('title')); }
  };
  const element = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', value?: unknown) => {
    const result = during(() => doc.createElement(tag));
    if (cls) during(() => { result.className = cls; });
    if (value !== undefined) during(() => { result.textContent = text(value); }); return result;
  };
  const svg = (tag: string, attrs: Record<string, unknown> = {}) => {
    const result = during(() => doc.createElementNS('http://www.w3.org/2000/svg', tag));
    for (const [key, value] of Object.entries(attrs)) during(() => result.setAttribute(key, text(value)));
    return result;
  };
  const on = lifetime.listen;
  const bind = (fn: () => void) => {
    lifetime.check(); const guarded = lifetime.guard(fn); refreshers.push(guarded);
    const release = lifetime.own(() => { const index=refreshers.indexOf(guarded); if(index>=0)refreshers.splice(index,1); });
    guarded(); lifetime.check(); return release;
  };
  const value = (v: Value) => during(() => evaluateValue(v, state, computed));
  const notify = () => { for (const fn of [...refreshers]) { lifetime.check(); fn(); } };
  const fail = (e: unknown) => { if (error) during(() => { error.textContent = e instanceof Error ? e.message : String(e); }); };
  type DraftPolicy = 'preserve' | 'replace' | 'reset';
  function change(patch: Record<string, string | number | boolean>, draftPolicy: DraftPolicy = 'preserve') {
    lifetime.check();
    const candidate = during(() => evaluateState({...current,state}, patch));
    if (!candidate.ok) throw new InvalidDocumentError(candidate.issues);
    state = {...candidate.state}; computed = {...candidate.computed};
    if (error) during(() => { error.textContent = ''; });
    if (draftPolicy !== 'preserve') forms?.syncDrafts(Object.keys(patch), draftPolicy === 'reset');
    notify();
  }
  function fromControl(patch: Record<string, string | number | boolean>, draftPolicy: DraftPolicy = 'preserve') {
    try { change(patch, draftPolicy); } catch(e) { notify(); fail(e); }
  }
  let context: RendererContext;
  let forms: ReturnType<typeof createForms>;
  let fieldLabels: ReturnType<typeof createLabels>;
  const children = (parent: HTMLElement, nodes: readonly Node[]) => { for (const node of nodes) during(() => parent.append(render(node))); };
  function formula(latex: string, block = true) {
    const target = element(block ? 'div' : 'span', 'iui-math');
    try { target.innerHTML = katex.renderToString(latex, {output:'htmlAndMathml', displayMode:block, throwOnError:true, trust:false, strict:'error', maxExpand:200, maxSize:20}); }
    catch { target.textContent = latex; target.classList.add('iui-math-error'); target.setAttribute('aria-label', labels.formulaSource); }
    return target;
  }
  function render(n: Node): HTMLElement | SVGElement {
    lifetime.check();
    let out: HTMLElement | SVGElement;
    switch(n.type) {
      case 'text': case 'title': case 'caption': case 'badge': {
        const tag = n.type === 'title' ? (`h${n.level ?? (hasHeading ? 2 : 1)}` as 'h1'|'h2'|'h3') : n.type === 'badge' ? 'span' : 'p';
        if(n.type==='title')hasHeading=true;
        out = element(tag, `iui-${n.type}`); const target = out;
        if (n.type === 'text' && n.runs) {
          for (const run of n.runs) {
            let parent: HTMLElement = target;
            if (run.href) { const a = element('a'); a.href = run.href.startsWith('#') ? `#${prefix}${run.href.slice(1)}` : run.href; if (!run.href.startsWith('#')) { a.target = '_blank'; a.rel = 'noopener noreferrer'; } parent.append(a); parent = a; }
            for (const [enabled, runTag] of [[run.bold,'strong'],[run.italic,'em'],[run.underline,'u'],[run.strike,'s'],[run.code,'code']] as const) if (enabled) { const span = element(runTag, runTag === 'code' ? 'iui-inline-code' : ''); parent.append(span); parent = span; }
            const content = element('span'); parent.append(content); bind(() => showValue(content, value(run.value)));
          }
        } else if (n.value !== undefined) bind(() => showValue(target, value(n.value!)));
        if ('color' in n && n.color) out.dataset.color = n.color;
        if ('weight' in n && n.weight) out.style.fontWeight = ({normal:'400',medium:'500',semibold:'600',bold:'700'})[n.weight];
        if ('align' in n && n.align) out.style.textAlign = n.align;
        if ('italic' in n && n.italic) out.style.fontStyle = 'italic';
        if ('underline' in n || 'strike' in n) out.style.textDecorationLine = [('underline' in n && n.underline) ? 'underline' : '', ('strike' in n && n.strike) ? 'line-through' : ''].filter(Boolean).join(' ') || 'none';
        if ('shimmer' in n && n.shimmer) out.classList.add('iui-text-shimmer');
        break;
      }
      case 'package-tracker':case 'flight-tracker':out=renderTracker(context,n,labels.trackerUI);break;
      case 'tabbed-section':out=renderTabbedSection(context,n);break;
      case 'visual-card-carousel':out=renderVisualCards(context,n,root,container);break;
      case 'link-card':case 'recommendation-link-card':out=renderSuppliedLink(context,n,root,container);break;
      case 'ledger-spend-so-far-this-month':out=renderSpendMonth(context,n,root);break;
      case 'ledger-upcoming-activity':out=renderUpcomingActivity(context,n,root,container);break;
      case 'image-grid':out=renderImageGrid(context,n,root,container);break;
      case 'conversation-suggestions':out=renderConversationSuggestions(context,n,root,container);break;
      case 'follow-up-action-bar':out=renderFollowUpActionBar(context,n,root,container);break;
      case 'async-video-carousel':out=renderAsyncVideo(context,n,root,container);break;
      case 'ledger-income-tracker':out=renderIncomeTracker(context,n,root,container);break;
      case 'lottie':out=renderLottie(context,n,root,container);break;
      case 'async-image':case 'async-image-group':out=renderAsyncImages(context,n,root,container);break;
      case 'search-image':out=renderSearchImage(context,n,root,container);break;
      case 'youtube':out=renderYouTube(context,n);break;
      case 'html-view':out=renderHtmlView(context,n,root,container);break;
      case 'ledger-fee-interest-paid':out=renderFeeInterest(context,n,root,container);break;
      case 'pressable':out=renderPressable(context,n);break;
      case 'ledger-net-worth':out=renderNetWorth(context,n);break;
      case 'weather-sidebar-title':out=renderWeatherSidebar(context,n);break;
      case 'ledger-low-confidence-category-correction':out=renderCategoryCorrection(context,n);break;
      case 'learning-image-choice-card':case 'learning-image-label-card':case 'learning-audio-label-card':out=renderLearningMedia(context,n);break;
      case 'nba-scores':case 'soccer-games':case 'american-football-games':out=renderMatchScores(context,n,labels.matchScoresUI);break;
      case 'basketball-tournament':out=renderTournament(context,n,labels.suppliedResultsUI);break;
      case 'election-results':out=renderElectionResults(context,n,labels.suppliedResultsUI);break;
      case 'nba-game-boxscore':out=renderBasketballBoxscore(context,n,labels.boxscoreUI);break;
      case 'cricket-match-boxscore':out=renderCricketBoxscore(context,n,labels.boxscoreUI);break;
      case 'f1-races':out=renderMotorsportRaces(context,n,labels.motorsportUI);break;
      case 'f1-standings':out=renderMotorsportStandings(context,n,labels.motorsportUI);break;
      case 'nba-player-summary':case 'tennis-player-summary':out=renderPlayerSummary(context,n,labels.playerSummaryUI);break;
      case 'ledger-accounts':out=renderLedgerAccounts(context,n,labels.ledgerRecordsUI);break;
      case 'ledger-recurring-transactions':out=renderLedgerRecurring(context,n,labels.ledgerRecordsUI);break;
      case 'display-automation':case 'list-automations':case 'automation-plan-summary':out=renderAutomation(context,n);break;
      case 'scheduled-task-suggestion':out=renderScheduledSuggestion(context,n);break;
      case 'entity-card':case 'entity-overview':out=renderEntity(context,n,root,container);break;
      case 'conversational-onboarding-study':out=renderStudyOnboarding(context,n);break;
      case 'conversational-onboarding-search':out=renderSearchOnboarding(context,n,root,container);break;
      case 'follow-up-quiz':case 'multiple-choice-block-v2':case 'personality-quiz':out=renderQuizCards(context,n,root,container);break;
      case 'reservation-time-pills-ref-carousel':out=renderReservationPillsCarousel(context,n,root,container);break;
      case 'whats-new-capability-search':out=renderCapabilitySearch(context,n,root,container);break;
      case 'entity':case 'gen-image':case 'speech-synthesizer':out=renderInlineHostMedia(context,n,root,container);break;
      case 'care-provider-results':case 'care-provider-sidebar':out=renderCareProvider(context,n,root,container);break;
      case 'learning-viz-dil':out=renderLearningViz(context,n,root,container);break;
      case 'ledger-low-confidence-category-correction-legacy':case 'superbowl-riddle':out=renderSuppliedInteraction(context,n,root,container);break;
      case 'ledger-credit-score':case 'ledger-credit-score-detail':out=renderSuppliedCredit(context,n,root,container);break;
      case 'bento':case 'open-detail':case 'openai':out=renderSuppliedDiscovery(context,n,root,container);break;
      case 'homework-helper-v2':case 'image-gen':case 'internal-partner-app':out=renderSuppliedLauncher(context,n,root,container);break;
      case 'ledger-equity-updates':case 'ledger-watchlist':out=renderEquityWatch(context,n);break;
      case 'places-metadata-bar':case 'plugin-followup':case 'instant-suggestions':out=renderContextAction(context,n,root,container);break;
      case 'ledger-finance-onboarding':case 'ledger-repair-bank-connection':case 'finance-onboarding-suggestions':out=renderFinanceEntry(context,n,root,container);break;
      case 'push-drip-series-intro':case 'stop-push-drip-series':case 'task-autopause-card':out=renderTaskCard(context,n);break;
      case 'ask-user-location':out=renderAskLocation(context,n);break;
      case 'whats-new-capability-welcome':out=renderCapabilityWelcome(context,n,root,container);break;
      case 'onboarding-feature-card':case 'onboarding-plugin-suggestions':case 'onboarding-starter-tasks':out=renderOnboardingCards(context,n,root,container);break;
      case 'conversational-onboarding-advice':case 'conversational-onboarding-writing':out=renderConversationalOnboarding(context,n,root,container);break;
      case 'learning-speak-card':case 'learning-voice-mode-launcher-card':case 'offer-voice-conversation':out=renderVoiceCard(context,n,root,container);break;
      case 'ledger-spend-by-category':case 'ledger-spend-by-category-detail':case 'ledger-spend-by-category-recent-transactions':out=renderLedgerCategory(context,n,root,container);break;
      case 'ask-user-details':case 'ask-user-files':out=renderAskUser(context,n);break;
      case 'prompt-checklist':out=renderPromptChecklist(context,n);break;
      case 'ledger-finance-status-banner':out=renderFinanceStatus(context,n);break;
      case 'recommendation-card':out=renderRecommendationCard(context,n);break;
      case 'ledger-transaction-detail':out=renderTransactionDetail(context,n);break;
      case 'follow-up-card-group':out=renderFollowUpCardGroup(context,n);break;
      case 'sidebar-people-also-ask':out=renderRelatedQuestions(context,n,labels.questionsUI);break;
      case 'sidebar-fact-table':out=renderFactTable(context,n,labels.entityFactsUI);break;
      case 'entity-thumbnail-list':out=renderEntityThumbnails(context,n,labels.entityFactsUI);break;
      case 'code-cite':out=renderCodeCite(context,n,labels.citationUI);break;
      case 'file-cite':out=renderFileCite(context,n,labels.citationUI);break;
      case 'word-card':out=renderWordCard(context,n,labels.vocabularyUI);break;
      case 'copy-words':out=renderCopyWords(context,n,labels.vocabularyUI);break;
      case 'shared-activity-planner':out=renderActivityPlanner(context,n,labels.activityUI);break;
      case 'event-sidebar':out=renderEventSidebar(context,n,labels.activityUI);break;
      case 'flight-search-form':out=renderFlightSearch(context,n,labels.discoveryUI);break;
      case 'flight-results':out=renderFlightResults(context,n,labels.discoveryUI);break;
      case 'local-business':out=renderLocalBusiness(context,n,labels.placesUI);break;
      case 'restaurant-reviews':out=renderRestaurantReviews(context,n,labels.placesUI);break;
      case 'jobs':out=renderJobs(context,n,labels.decisionUI);break;
      case 'product-card':out=renderProductCard(context,n,labels.decisionUI);break;
      case 'email-preview':out=renderEmailPreview(context,n,labels.mailFilesUI);break;
      case 'file-nav-list':out=renderFileNav(context,n,labels.mailFilesUI);break;
      case 'create-interactive-poll':out=renderPoll(context,n,labels.pollUI);break;
      case 'onboarding-selection':out=renderOnboarding(context,n,labels.onboardingUI);break;
      case 'asset-distribution':case 'transaction-list':out=renderLedger(context,n,labels.ledgerUI);break;
      case 'location-choice-request':out=renderLocationChoice(context,n,labels.choiceGalleryUI);break;
      case 'business-gallery':out=renderBusinessGallery(context,n,labels.choiceGalleryUI);break;
      case 'restaurant-menu':out=renderMenu(context,n,labels.menuUI);break;
      case 'prompt-suggestions':out=renderSuggestions(context,n,labels.suggestionsUI);break;
      case 'label':out=fieldLabels.render(n);break;
      case 'person-profile':out=renderPersonProfile(context,n,labels.personUI);break;
      case 'writing-block':out=renderWriting(context,n,labels.writingUI);break;
      case 'email-draft':out=renderEmailDraft(context,n,labels.draftReviewUI,labels.writingUI);break;
      case 'task-expansion-card':out=renderTaskExpansionCard(context,n,labels.draftReviewUI);break;
      case 'markdown': out=renderMarkdown(context,n,labels.markdownUI);break;
      case 'code': out=renderCode(context,n,labels);break;
      case 'math': out = formula(n.latex,n.block ?? true); break;
      case 'divider': out = element('hr'); break;
      case 'spacer': out = element('div'); out.style.height = `${n.height ?? 16}px`; out.setAttribute('aria-hidden','true'); break;
      case 'link': {
        if(n.href===undefined){out=renderSuppliedLink(context,n,root,container);break;}
        const anchor = element('a'); out=anchor; anchor.href = n.href.startsWith('#') ? `#${prefix}${n.href.slice(1)}` : n.href;
        if (!n.href.startsWith('#')) { anchor.target = '_blank'; anchor.rel = 'noopener noreferrer'; }
        const target = out; bind(() => target.textContent = text(value(n.value!))); break;
      }
      case 'favicon': out=renderFavicon(context,n,labels.faviconUI); break;
      case 'image': {
        out = element('figure','iui-image'); const target = out;
        const content = element('div','iui-image-content'); target.append(content);
        const external = !/^data:/i.test(n.src);
        let alive = true, requested = false, loading = false;
        let button: HTMLButtonElement | undefined;
        context.cleanup(()=>{ alive = false; });
        const blocked = () => !alive || (external && (!target.isConnected || !button?.isConnected || button.matches(':disabled') || !!button.closest('[hidden]')));
        const load = () => {
          if (requested || loading || blocked()) return;
          loading = true;
          try {
            const img = element('img'); img.alt=n.alt; img.loading='lazy'; img.decoding='async'; img.referrerPolicy='no-referrer';
            if(n.aspectRatio) img.style.aspectRatio=n.aspectRatio.replace(':','/'); img.style.objectFit=n.fit ?? 'contain';
            // Document hooks may synchronously update/dispose during element creation.
            if (blocked()) return;
            requested = true;
            on(img,'error',()=>{ if(alive && target.isConnected && img.parentElement===content) target.dataset.imageStatus='error'; });
            on(img,'load',()=>{ if(alive && target.isConnected && img.parentElement===content) target.dataset.imageStatus='loaded'; });
            target.dataset.imageStatus='loading';
            img.src=n.src;
            if (!alive || (external && !target.isConnected)) return;
            content.replaceChildren(img);
          } finally { loading = false; }
        };
        if (!external) load();
        else { const consent=element('div','iui-image-consent'); consent.append(element('p','',n.alt||labels.externalImage));
          consent.append(element('p','iui-caption',labels.imageDisclosure(new URL(n.src).hostname)));
          button=element('button','',labels.loadImage); button.type='button'; on(button,'click',load); consent.append(button); content.append(consent); }
        break;
      }
      case 'box': case 'card': case 'row': case 'col': case 'grid': {
        out=element('div',`iui-layout iui-${n.type}`);if(n.gap===undefined&&['box','card','col'].includes(n.type))out.dataset.semanticGap='true';
        if(n.gap !== undefined) out.style.setProperty('--iui-gap',String(n.gap));
        if(n.padding !== undefined) out.style.setProperty('--iui-padding',String(n.padding));
        if(n.type==='grid') { out.style.setProperty('--iui-columns',String(n.columns??2)); out.style.setProperty('--iui-grid-mobile-columns',String(n.mobileColumns??1)); }
        if(n.width) out.style.width=typeof n.width==='number'?`${n.width}px`:n.width;
        if(n.align) out.style.alignItems=({start:'flex-start',center:'center',end:'flex-end',stretch:'stretch'})[n.align];
        if(n.justify) out.style.justifyContent=({start:'flex-start',center:'center',end:'flex-end',between:'space-between',around:'space-around'})[n.justify];
        if(n.radius) out.style.borderRadius=({none:'0',sm:'4px',md:'8px',lg:'12px',xl:'16px','2xl':'24px'})[n.radius];
        if(n.border!==undefined) out.dataset.border=String(n.border); if(n.background) out.dataset.background=n.background;
        children(out,n.children); break;
      }
      case 'grid-item': out=element('div','iui-grid-item');out.style.setProperty('--iui-col-span',String(n.colSpan??1));out.style.setProperty('--iui-row-span',String(n.rowSpan??1));out.style.setProperty('--iui-mobile-col-span',String(n.mobileColSpan??1));children(out,n.children);break;
      case 'blockquote': { const quote=element('blockquote','iui-blockquote');if(n.cite)quote.cite=n.cite;children(quote,n.children);out=quote;if(n.attribution){const footer=element('footer','iui-quote-attribution');if(n.cite){const a=element('a','',n.attribution);a.href=n.cite.startsWith('#')?`#${prefix}${n.cite.slice(1)}`:n.cite;if(!n.cite.startsWith('#')){a.target='_blank';a.rel='noopener noreferrer';}footer.append(a);}else footer.textContent=n.attribution;quote.append(footer);}break; }
      case 'section': out=element('section','iui-layout');out.dataset.semanticGap='true'; if(n.heading)out.append(element('h2','',n.heading)); children(out,n.children); break;
      case 'figure': out=element('figure','iui-layout');out.dataset.semanticGap='true'; children(out,n.children); if(n.caption)out.append(element('figcaption','iui-caption',n.caption)); break;
      case 'details': {out=element('details');out.append(element('summary','',n.summary));const inner=element('div','iui-layout iui-details-body');children(inner,n.children);out.append(inner);break;}
      case 'animate':case 'celebration':out=renderMotion(context,n,labels.motionUI);break;
      case 'carousel': out=renderCarousel(context,n,labels.carouselUI);break;
      case 'tab-group': out=renderTabs(context,n);break;
      case 'tab-panel': out=element('div','iui-tab-panel iui-layout');children(out,n.children);break;
      case 'list': out=element(n.ordered?'ol':'ul','iui-list');for(const item of n.items){const li=element('li');if(item&&typeof item==='object'&&'type'in item)li.append(render(item as Node));else bind(()=>showValue(li,value(item as Value)));out.append(li);}break;
      case 'table': out=renderTable(context,n);break;
      case 'metric': {out=element('div','iui-metric');out.dataset.variant=n.variant??'plain';out.append(element('div','iui-metric-label',n.label));const number=element('div','iui-metric-value');const span=element('span');number.append(span);if(n.color)number.dataset.color=n.color;bind(()=>{const v=value(n.value);span.textContent=typeof v==='number'&&n.precision!==undefined?v.toFixed(n.precision):display(v);});if(n.unit)number.append(element('span','iui-unit',n.unit));out.append(number);if(n.hint)out.append(element('div','iui-caption',n.hint));break;}
      case 'metric-grid': out=element('div','iui-layout iui-metric-grid');out.style.setProperty('--iui-columns',String(n.columns??2));out.style.setProperty('--iui-mobile-columns',String(Math.min(2,n.columns??2)));children(out,n.children);break;
      case 'steps': out=element('ol','iui-steps');for(const item of n.items){const li=element('li');li.append(element('strong','',item.title));if(item.detail)li.append(element('p','',item.detail));if(item.latex)li.append(formula(item.latex));out.append(li);}break;
      case 'callout': out=element('aside','iui-callout',n.value);out.dataset.tone=n.tone??'neutral';break;
      case 'slider': {out=element('div','iui-control');const id=allocateInternalId('control'),head=element('div','iui-control-header'),label=element('label','',n.label),output=element('output');label.htmlFor=id;output.htmlFor=id;head.append(label,output);const input=element('input');input.type='range';input.id=id;input.min=String(n.min);input.max=String(n.max);input.step=String(n.step);input.dataset.bind=n.bind;bind(()=>{input.value=text(state[n.bind]);output.value=`${display(state[n.bind])}${n.unit??''}`;});on(input,'input',()=>fromControl({[n.bind]:input.valueAsNumber}));out.append(head,input);if(n.marks){const marks=element('div','iui-marks');for(const m of n.marks){const label=element('span','',m.label),ratio=(m.value-n.min)/(n.max-n.min);label.dataset.value=String(m.value);label.style.left=`${ratio*100}%`;label.style.transform=`translateX(-${ratio*100}%)`;marks.append(label);}out.append(marks);}break;}
      case 'toggle': {out=element('label','iui-control iui-toggle');const input=element('input');input.type='checkbox';input.dataset.bind=n.bind;bind(()=>input.checked=state[n.bind]===true);on(input,'change',()=>fromControl({[n.bind]:input.checked}));out.append(input,doc.createTextNode(n.label));break;}
      case 'select': {out=element('label','iui-control');out.append(element('span','',n.label));const input=element('select');input.dataset.bind=n.bind;for(const [i,o] of n.options.entries()){const opt=element('option','',o.label);opt.value=String(i);input.append(opt);}bind(()=>input.value=String(n.options.findIndex(o=>o.value===state[n.bind])));on(input,'change',()=>fromControl({[n.bind]:n.options[Number(input.value)].value}));out.append(input);break;}
      case 'button': out=renderButton(context,n,labels.buttonUI,current.state??{});break;
      case 'input': case 'textarea': case 'radio': case 'segmented': out=forms.field(n);break;
      case 'field': out=forms.group(n);break;
      case 'form': out=forms.form(n);break;
      case 'topology': out=topology(n);break;
      case 'chart': out=n.kind==='pie'?renderPie(context,n,labels.pieUI):renderChart(context,n);break;
      case 'weather': out=renderWeather(context,n);break;
      case 'finance-heatmap': out=renderHeatmap(context,n); break;
      case 'unit-converter':case 'currency-converter': out=renderConverter(context,n); break;
      case 'clock':case 'stopwatch':case 'timer': out=renderTime(context,n,labels.time); break;
      case 'tooltip':case 'popover': out=renderOverlay(context,n,labels.overlay); break;
      case 'citation':case 'web-link-cards': out=renderSource(context,n,labels.sources); break;
      case 'loading':case 'loading-block': out=renderLoading(context,n,labels.loadingUI); break;
      case 'flow':case 'icon':case 'pulse-indicator': out=renderPrimitive(context,n,labels.primitive); break;
      case 'finance-quote': case 'finance-chart': case 'finance-comparison': out=renderFinance(context,n); break;
      case 'news-article':out=renderNewsArticle(context,n,labels.newsUI);break;
      case 'entity-reviews':out=renderEntityReviews(context,n,labels.reviewsUI);break;
      case 'flight-option':out=renderFlightOption(context,n,labels.travelEventsUI);break;
      case 'artist-upcoming-events':out=renderArtistEvents(context,n,labels.travelEventsUI);break;
      case 'restaurant-availability':out=renderAvailability(context,n,labels.availabilityUI);break;
      case 'reddit-thread-card':out=renderThread(context,n,labels.threadUI);break;
      case 'agenda': out=renderAgenda(context,n,labels.agendaUI); break;
      case 'rating': out=renderRating(context,n,labels.ratingUI); break;
      case 'vocab-card': out=renderVocabCard(context,n,labels.vocabUI); break;
      case 'checklist': out=renderChecklist(context,n,labels.checklistUI); break;
      case 'fill-blank': out=renderFillBlank(context,n); break;
      case 'sentence-builder': out=renderSentenceBuilder(context,n,labels.sentenceBuilderUI); break;
      case 'quiz': case 'flashcards': out=renderLearning(context,n); break;
      case 'sports-schedule': case 'sports-scoreboard': case 'sports-standings': out=renderSports(context,n);break;
      case 'svg': {out=svg('svg',{viewBox:n.viewBox,role:'img','aria-label':n.label??labels.diagram});out.classList.add('iui-svg');for(const shape of n.shapes){const s=svg(shape.tag,shape.attrs);if(shape.text)s.textContent=shape.text;out.append(s);}break;}
      case 'native': throw new Error('Native runtime is not supported');
      default: {const impossible: never=n;throw new Error(`Unsupported node: ${JSON.stringify(impossible)}`);}
    }
    during(() => { out.dataset.iui=n.type; }); if(n.id) during(() => { out.id=prefix+n.id!; }); during(() => fieldLabels.registerTarget(n,out));return out;
  }
  function topology(n: Extract<Node,{type:'topology'}>) {
    const figure=element('figure','iui-topology'),graphic=svg('svg',{role:'img','aria-label':n.caption??labels.topology});figure.append(graphic);
    const summary=element('figcaption','iui-caption');figure.append(summary);
    bind(()=>{graphic.replaceChildren();const width=Math.max(290,figure.clientWidth-24||640);const vertical=n.nodes.length>4||width<360;const step=vertical?90:width/n.nodes.length;const height=vertical?n.nodes.length*step:150;
      graphic.setAttribute('viewBox',`0 0 ${width} ${height}`);
      const positions=new Map(n.nodes.map((node,i)=>[node.id,vertical?{x:width/2,y:40+i*step}:{x:step*(i+.5),y:42}]));
      const loads=n.links.map(link=>link.load===undefined?null:value(link.load));const finite=loads.filter((v):v is number=>typeof v==='number');const maximum=Math.max(...finite);
      for(const [i,link]of n.links.entries()){const a=positions.get(link.from)!,b=positions.get(link.to)!;const high=n.highlight==='max-load'&&loads[i]===maximum;const color=high?'var(--iui-red)':'var(--iui-blue)';const group=svg('g',{'data-bottleneck':String(high),'data-link-index':i});
        const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len;const sx=a.x+ux*36,sy=a.y+uy*25,ex=b.x-ux*39,ey=b.y-uy*27;
        group.append(svg('line',{x1:sx,y1:sy,x2:ex,y2:ey,stroke:color,'stroke-width':high?4:3}));group.append(svg('path',{d:`M ${ex-ux*9-uy*6} ${ey-uy*9+ux*6} L ${ex} ${ey} L ${ex-ux*9+uy*6} ${ey-uy*9-ux*6}`,fill:'none',stroke:color,'stroke-width':3}));
        const label=svg('text',{x:vertical?width/2+24:(a.x+b.x)/2,y:vertical?(a.y+b.y)/2:100,'text-anchor':vertical?'start':'middle','font-size':12});label.textContent=typeof loads[i]==='number'?`U${i+1} = ${(loads[i] as number).toFixed(2)}`:shorten(link.label??'',12);const tip=svg('title');tip.textContent=link.label??`${link.from} ${labels.to} ${link.to}`;group.append(tip,label);graphic.append(group);}
      for(const node of n.nodes){const p=positions.get(node.id)!;graphic.append(svg('rect',{x:p.x-35,y:p.y-24,width:70,height:48,rx:10,fill:'var(--iui-surface)',stroke:'var(--iui-line)','stroke-width':2}));const label=svg('text',{x:p.x,y:p.y+(node.subtitle?0:5),'text-anchor':'middle','font-size':13,'font-weight':600});label.textContent=shorten(node.label,7);const tip=svg('title');tip.textContent=[node.label,node.subtitle].filter(Boolean).join(': ');label.append(tip);graphic.append(label);if(node.subtitle){const sub=svg('text',{x:p.x,y:p.y+15,'text-anchor':'middle','font-size':10});sub.textContent=shorten(node.subtitle,10);graphic.append(sub);}}
      graphic.setAttribute('aria-label',[n.caption,...n.nodes.map(node=>[node.label,node.subtitle].filter(Boolean).join(': ')),...n.links.map((link,i)=>`${link.from} ${labels.to} ${link.to}: ${link.label??''} ${loads[i]===null?'':display(loads[i])}`)].filter(Boolean).join('; '));
      summary.textContent=[n.caption,finite.length?`${labels.maximumLoad}: ${maximum.toFixed(2)}.`:''].filter(Boolean).join(' ');
    });return figure;
  }
  const start = lifetime.guard(() => {
    labels = during(() => presentationLabels(container));
    context = during<RendererContext>(() => ({doc,prefix,allocateInternalId,lifecycle:lifetime,labels:()=>labels,element,svg,on,bind,cleanup:lifetime.own,value,display,showValue,getState:()=>state,change,fromControl,render,actions:options.actions??{}}));
    forms = during(() => createForms(context));
    fieldLabels = during(() => createLabels(context));
    root=element('article','iui-root');
    during(() => { root.dataset.theme=current.theme??'auto'; }); during(() => { root.dir='auto'; });
    if (during(() => options.styles)!==false) { const style=element('style'); during(() => { style.textContent=styles; }); during(() => root.append(style)); }
    if(current.title) during(() => root.setAttribute('aria-label',current.title!));
    if(current.description) during(() => root.append(element('p','iui-description',current.description)));
    const body=element('div','iui-body');children(body,current.body);during(() => root.append(body));
    error=element('p','iui-error');during(() => error.setAttribute('role','alert'));during(() => root.append(error));
    ready = true; during(() => install(root)); notify();
    const RO=during(() => doc.defaultView?.ResizeObserver);
    if(RO) {
      let previousWidth=during(() => container.getBoundingClientRect().width);
      const resize=lifetime.acquire(() => new RO(lifetime.guard(() => {
        const width=during(() => container.getBoundingClientRect().width);
        if(width===previousWidth)return;previousWidth=width;notify();
      })), observer=>observer.disconnect());
      try { during(() => resize.observe(container)); }
      finally { if (!lifetime.current()) resize.disconnect(); }
    }
  });
  return {
    start,
    restore:lifetime.guard(()=>{if(ready)during(()=>install(root));}),
    getState:()=>Object.freeze({...state}),
    setState:lifetime.guard((patch:Record<string,string|number|boolean>)=>change(patch,'replace')),
    dispose:()=>{if(stopped)return;stopped=true;refreshers=[];try{lifetime.dispose();}finally{root?.remove();}}
  };
  }
}
export {styles};
