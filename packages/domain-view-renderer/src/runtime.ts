import {applyDomainResourcePolicy} from './resource-policy.js';
import {renderQuestionnaire,type QuestionnaireAction} from './internal/renderer/questionnaire.js';
import {renderQsofa} from './internal/renderer/qsofa.js';
import {renderRox} from './internal/renderer/rox.js';
import {renderGcs} from './internal/renderer/gcs.js';
import {renderCorrectedAge} from './internal/renderer/corrected-age.js';
import {renderInlineHostMedia} from './internal/renderer/inline-host-media.js';
import {renderCareProvider} from './internal/renderer/care-providers.js';
import {renderLearningViz} from './internal/renderer/learning-viz.js';
import {renderSuppliedInteraction} from './internal/renderer/supplied-interactions.js';
import {renderSuppliedCredit} from './internal/renderer/credit-score.js';
import {renderSuppliedDiscovery} from './internal/renderer/supplied-discovery.js';
import {renderSuppliedLauncher} from './internal/renderer/supplied-launchers.js';
import {renderEquityWatch} from './internal/renderer/equity-watchlist.js';
import {renderContextAction} from './internal/renderer/context-actions.js';
import {renderFinanceEntry} from './internal/renderer/finance-entry.js';
import {renderTaskCard} from './internal/renderer/task-cards.js';
import {renderCapabilitySearch} from './internal/renderer/capability-search.js';
import {renderReservationPillsCarousel} from './internal/renderer/reservation-pills.js';
import {renderAskLocation} from './internal/renderer/ask-location.js';
import {renderCapabilityWelcome} from './internal/renderer/capability-welcome.js';
import {renderQuizCards} from './internal/renderer/quiz-cards.js';
import {renderSearchOnboarding} from './internal/renderer/search-onboarding.js';
import {renderStudyOnboarding} from './internal/renderer/study-onboarding.js';
import {renderOnboardingCards} from './internal/renderer/onboarding-cards.js';
import {renderConversationalOnboarding} from './internal/renderer/conversational-onboarding.js';
import {renderVoiceCard} from './internal/renderer/voice-cards.js';
import {renderLedgerCategory} from './internal/renderer/ledger-category.js';
import {renderAskUser} from './internal/renderer/ask-user.js';
import {renderEntity} from './internal/renderer/entity.js';
import {renderScheduledSuggestion} from './internal/renderer/scheduled-suggestion.js';
import {renderAutomation} from './internal/renderer/automation.js';
import{renderTabbedSection,renderVisualCards}from'./internal/renderer/tabbed-visual.js';
import{renderSuppliedLink}from'./internal/renderer/supplied-links.js';
import {renderSpendMonth} from './internal/renderer/spend-month.js';
import {renderUpcomingActivity} from './internal/renderer/upcoming-activity.js';
import {renderImageGrid} from './internal/renderer/image-grid.js';
import {renderConversationSuggestions} from './internal/renderer/conversation-suggestions.js';
import {renderFollowUpActionBar} from './internal/renderer/follow-up-action-bar.js';
import {renderAsyncVideo} from './internal/renderer/async-video.js';
import {renderIncomeTracker} from './internal/renderer/income-tracker.js';
import {renderLottie} from './internal/renderer/lottie.js';
import {renderAsyncImages} from './internal/renderer/async-image.js';
import {renderSearchImage} from './internal/renderer/search-image.js';
import {renderYouTube} from './internal/renderer/youtube.js';
import {renderHtmlView} from './internal/renderer/html-view.js';
import {renderFeeInterest} from './internal/renderer/fee-interest.js';
import {renderPressable} from './internal/renderer/pressable.js';
import {renderNetWorth} from './internal/renderer/net-worth.js';
import {renderWeatherSidebar} from './internal/renderer/weather-sidebar.js';
import {renderCategoryCorrection} from './internal/renderer/category-correction.js';
import {renderLearningMedia} from './internal/renderer/learning-media.js';
import {renderMatchScores} from './internal/renderer/match-scores.js';
import {renderTournament,renderElectionResults} from './internal/renderer/supplied-results.js';
import {renderBasketballBoxscore,renderCricketBoxscore} from './internal/renderer/boxscores.js';
import {renderMotorsportRaces,renderMotorsportStandings} from './internal/renderer/motorsport.js';
import {renderPlayerSummary} from './internal/renderer/player-summaries.js';
import {renderLedgerAccounts,renderLedgerRecurring} from './internal/renderer/ledger-records.js';
import {renderPromptChecklist} from './internal/renderer/prompt-checklist.js';
import {renderFinanceStatus} from './internal/renderer/finance-status.js';
import {renderRecommendationCard} from './internal/renderer/recommendation-card.js';
import {renderTransactionDetail} from './internal/renderer/transaction-detail.js';
import {renderFollowUpCardGroup} from './internal/renderer/follow-up-card-group.js';
import {renderGeneration} from './internal/renderer/generation.js';
import {renderRelatedQuestions} from './internal/renderer/related-questions.js';
import {renderFactTable,renderEntityThumbnails} from './internal/renderer/entity-facts.js';
import {renderCodeCite,renderFileCite} from './internal/renderer/source-citations.js';
import {renderWordCard,renderCopyWords} from './internal/renderer/vocabulary.js';
import {renderActivityPlanner,renderEventSidebar} from './internal/renderer/activity-planning.js';
import {renderFlightSearch,renderFlightResults} from './internal/renderer/flight-discovery.js';
import {renderLocalBusiness,renderRestaurantReviews} from './internal/renderer/local-places.js';
import {renderJobs} from './internal/renderer/jobs.js';
import {renderProductCard} from './internal/renderer/product-card.js';
import {renderEmailPreview} from './internal/renderer/email-preview.js';
import {renderFileNav} from './internal/renderer/file-nav.js';
import {renderPoll} from './internal/renderer/poll.js';
import {renderTracker} from './internal/renderer/trackers.js';
import {renderOnboarding} from './internal/renderer/onboarding.js';
import {renderFlightOption} from './internal/renderer/flight-option.js';
import {renderArtistEvents} from './internal/renderer/artist-events.js';
import {renderLedger} from './internal/renderer/ledger.js';
import {renderLocationChoice,renderBusinessGallery} from './internal/renderer/choice-gallery.js';
import {renderEmailDraft} from './internal/renderer/email-draft.js';
import {renderTaskExpansionCard} from './internal/renderer/task-expansion-card.js';
import {renderMotion} from './internal/renderer/motion.js';
import {renderAvailability} from './internal/renderer/availability.js';
import {renderThread} from './internal/renderer/thread.js';
import {renderNewsArticle} from './internal/renderer/news.js';
import {renderEntityReviews} from './internal/renderer/entity-reviews.js';
import {renderWriting} from './internal/renderer/writing.js';
import {renderPersonProfile} from './internal/renderer/person-profile.js';
import {renderMenu} from './internal/renderer/menu.js';
import {renderSuggestions} from './internal/renderer/suggestions.js';
import {createLabels} from './internal/renderer/labels.js';
import {renderButton} from './internal/renderer/button.js';
import {renderAgenda} from './internal/renderer/agenda.js';
import {renderFavicon} from './internal/renderer/favicon.js';
import {renderRating} from './internal/renderer/rating.js';
import {renderRatingSummary} from './internal/renderer/rating-summary.js';
import {renderVocabCard} from './internal/renderer/vocab.js';
import {renderMarkdown} from './internal/renderer/markdown.js';
import {renderTabs} from './internal/renderer/tabs.js';
import {renderCode} from './internal/renderer/code.js';
import {renderCarousel} from './internal/renderer/carousel.js';
import {renderSource} from './internal/renderer/sources.js';
import {renderLoading} from './internal/renderer/loading.js';
import {renderPrimitive} from './internal/renderer/primitives.js';
import {renderConverter} from './internal/renderer/converters.js';
import {renderTime} from './internal/renderer/time.js';
import {renderOverlay} from './internal/renderer/overlays.js';
import {renderTable} from './internal/renderer/table.js';
import {renderHeatmap} from './internal/renderer/heatmap.js';
import {renderFinance} from './internal/renderer/finance.js';
import {renderChecklist} from './internal/renderer/checklist.js';
import {renderFillBlank} from './internal/renderer/fill-blank.js';
import {renderSentenceBuilder} from './internal/renderer/sentence-builder.js';
import {renderLearning} from './internal/renderer/learning.js';
import {renderSports} from './internal/renderer/sports.js';
import {createForms} from './internal/renderer/forms.js';
import {renderWeather} from './internal/renderer/weather.js';
import {renderChart} from './internal/renderer/charts.js';
import {renderPie} from './internal/renderer/pie.js';
import type {RendererContext,FormAction} from './internal/renderer/context.js';
import katex from 'katex';
import type { IUIDocument, Node, Value } from './internal/schema/document.js';
import { formatNumber, presentationLabels } from './internal/renderer/presentation.js';
import type {DomainContext,DomainHandle,DomainOptions,ViewDescriptor} from './types.js';
let viewSerial=0;
const palette = {blue:'var(--if-chart-1)',green:'var(--if-chart-2)',orange:'var(--if-chart-4)',red:'var(--if-chart-5)',purple:'var(--if-chart-3)',gray:'var(--if-chart-6)'};
const shorten=(s:string,limit:number)=>Array.from(s).length>limit?Array.from(s).slice(0,limit-1).join('')+'…':s;
/** Mount one validated V2 View. This is not an iui/1 protocol entry point. */
export function renderDomainView(descriptor:ViewDescriptor,props:Record<string,unknown>,external:DomainContext,options:DomainOptions):DomainHandle {
 const doc=external.document;
 if(external.partial||external.signal?.aborted){const element=doc.createElement('p');element.className='if-status';element.textContent=descriptor.name+' · Preview';return{element,dispose(){element.remove();}};}
 const data=props.data;
 if(!data||typeof data!=='object'||Array.isArray(data))throw new TypeError(descriptor.name+' requires its validated data object');
 if(Object.hasOwn(data,'type')||Object.hasOwn(data,'id'))throw new TypeError('View data cannot contain old protocol type or id');
 let disposed=false,serial=0;
 const lifetime=renderGeneration(()=>!disposed&&!external.signal?.aborted),during=lifetime.during;
 const prefix=`inform-view-${++viewSerial}-`;
 const allocateInternalId=(role:string)=>`${prefix}${role}-${++serial}`;
 const text=(value:unknown)=>value==null?'':String(value);
 const display=(value:unknown)=>typeof value==='number'?formatNumber(value):text(value);
 const showValue=(target:HTMLElement,value:unknown)=>{during(()=>{target.textContent=display(value);});if(typeof value==='number')target.dataset.rawValue=String(value);};
 const childrenHandles=new Set<DomainHandle>();
 const child=(name:string,p:Record<string,unknown>)=>{const handle=external.renderChild({type:'element',typeName:name,props:p,partial:false});if(!childrenHandles.has(handle)){childrenHandles.add(handle);lifetime.own(()=>handle.dispose());}return handle.element;};
 const element=<K extends keyof HTMLElementTagNameMap>(tag:K,cls='',value?:unknown):HTMLElementTagNameMap[K]=>{
  lifetime.check();external.budget.consume();const out=options.createElement?options.createElement(doc,tag,cls,value):doc.createElement(tag);
  if(!options.createElement){if(cls)out.className=cls;if(value!==undefined)out.textContent=text(value);}
  applyDomainResourcePolicy(out,external);return out;
 };
 const svg=(tag:string,attrs:Record<string,unknown>={})=>{if(/^(script|foreignObject|iframe|image|use|a)$/i.test(tag))throw new TypeError('Active SVG content is not allowed');for(const key of Object.keys(attrs))if(/^on|^(?:href|xlink:href|style)$/i.test(key))throw new TypeError('Unsafe SVG attribute');external.budget.consume();const node=during(()=>doc.createElementNS('http://www.w3.org/2000/svg',tag));for(const[key,value]of Object.entries(attrs)){external.budget.consume();during(()=>node.setAttribute(key,text(value)));}return node;};
 const root=element('div','if-domain-owned'),container=element('section','if-domain if-domain-view');container.dataset.component=descriptor.name;container.dataset.actualAdapter='true';container.dataset.publicBaseComposed='false';container.append(root);root.dataset.theme=external.theme??'light';
 const labels=presentationLabels(container);
 const state:Record<string,any>=Object.create(null);const initialState:Record<string,any>=Object.create(null);
 const mapped=new Map<string,string>();
 const node:any={...(data as object),type:descriptor.oldType};
 const bindingSpecs=descriptor.bindings??(descriptor.bindingProps??[]).map(prop=>({prop,dataProp:prop}));
 for(const spec of bindingSpecs){const source=spec.dataProp??spec.prop;const next=Object.hasOwn(props,spec.prop)?props[spec.prop]:node[source];if(next!==undefined){node[source]=next;state[spec.prop]=next;initialState[spec.prop]=next;}mapped.set(spec.prop,spec.prop);}
 if(bindingSpecs.length&&['rating','input','textarea','radio','segmented','slider','toggle','select'].includes(descriptor.oldType))node.bind=bindingSpecs[0].prop;
 for(const[key,val]of Object.entries(props))if(key!=='data'&&!bindingSpecs.some(x=>x.prop===key)&&!descriptor.actionProps?.includes(key))node[key]=val;
 if(descriptor.oldType==='form'&&props.onSubmit){node.action='local-submit';}
 if(descriptor.oldType==='tab-group'){node.children=(node.children??[]).map((child:any,index:number)=>({...child,id:'panel-'+index,label:child.props?.data?.label??'Tab '+(index+1),disabled:child.props?.data?.disabled===true}));if(node.initialIndex!==undefined)node.initial='panel-'+node.initialIndex;else delete node.initial;}
 if(descriptor.oldType==='list')node.items=[...(node.items??[]),...(props.children as any[]??[])];
 if(descriptor.oldType==='checklist')node.items=(node.items??[]).map((item:any,index:number)=>{const bind='local-check-'+index;state[bind]=item.checked??false;mapped.set(bind,bind);return{...item,bind};});
 const refreshers:Array<()=>void>=[];
 const bind=(fn:()=>void)=>{const safe=lifetime.guard(fn);refreshers.push(safe);safe();return lifetime.own(()=>{const i=refreshers.indexOf(safe);if(i>=0)refreshers.splice(i,1);});};
 const notify=()=>{for(const fn of [...refreshers]){lifetime.check();fn();}};
 const change=(patch:Record<string,any>)=>{for(const[key,next]of Object.entries(patch)){lifetime.check();const prop=mapped.get(key);if(prop&&Object.hasOwn(external.bindings??{},prop)){const result=external.writeBinding?.(prop,next);if(!result?.ok)throw new Error(result?.issues?.[0]?.message??'Binding change rejected');if(!lifetime.current())return;state[key]=next;}else if(prop){state[key]=next;}else throw new Error('Undeclared View state field: '+key);}notify();};
 const fromControl=(patch:Record<string,any>,_policy?:unknown)=>{try{change(patch);}catch(error){container.dataset.bindingError=error instanceof Error?error.message:String(error);notify();}};
 const value=(v:any):any=>{if(v!==null&&typeof v==='object')throw new TypeError('Old expression values are not accepted by V2 Views');return v;};
 const on=lifetime.listen;
 let hasHeading=false;
 const current={state:initialState};
 const actions:Record<string,any>=Object.create(null);
 if(props.onSubmit)actions['local-submit']=()=>{const result=external.dispatchLocal?.(props.onSubmit);if(!result?.ok)throw new Error(result?.issues?.[0]?.message??'Local action rejected');};
 let context:RendererContext;
 let forms:ReturnType<typeof createForms>;
 let fieldLabels:ReturnType<typeof createLabels>;
 const children=(parent:HTMLElement,nodes:readonly Node[])=>{for(const n of nodes)parent.append(render(n));};
 function formula(latex:string,block=true){const target=element(block?'div':'span','iui-math');try{target.innerHTML=katex.renderToString(latex,{output:'htmlAndMathml',displayMode:block,throwOnError:true,trust:false,strict:'error',maxExpand:200,maxSize:20});}catch{target.textContent=latex;target.classList.add('iui-math-error');}return target;}
 let retainedDetails:{element:HTMLDetailsElement;summary:HTMLElement;body:HTMLElement}|undefined;
 function renderFoundationNode(n:any):HTMLElement|SVGElement|null {
  if(n.type==='element')return null;
  if(n===node&&n.type==='details'){if(!retainedDetails){const outer=element('details'),summary=element('summary'),body=element('div','iui-layout iui-details-body');outer.append(summary,body);retainedDetails={element:outer,summary,body};}retainedDetails.summary.textContent=text(n.summary);const content=child('Stack',{children:n.children??[],gap:'sm'});if(retainedDetails.body.firstChild!==content)retainedDetails.body.replaceChildren(content);return retainedDetails.element;}
  if(n.type==='html-view'){const out=element('section','if-alert');out.dataset.hostBoundary='html';out.append(element('strong','if-alert-title',n.title??'Embedded HTML'),element('p','if-text','This view requires an explicit sandboxed host renderer. Supplied HTML is shown as text.'),element('pre','if-code',n.html));return out;}
  const baseNode=(typeName:string,props:Record<string,unknown>)=>({type:'element',typeName,props,partial:false});
  const textNode=(content:unknown,tone?:string)=>baseNode('Text',{content:text(content),...(tone?{tone}:{})});
  const mark=()=>{if(n===node)container.dataset.publicBaseComposed='true';};
  if(['section','figure','grid-item','metric-grid','metric','tab-panel','list','spacer'].includes(n.type)){
   mark();
   if(n.type==='metric'){const contents=[textNode(n.label,'muted'),baseNode('Heading',{content:typeof n.value==='number'&&n.precision!==undefined?n.value.toFixed(n.precision):display(n.value),level:3})];if(n.unit)contents.push(textNode(n.unit,'muted'));if(n.hint)contents.push(textNode(n.hint,'muted'));return child('Card',{children:contents});}
   if(n.type==='metric-grid')return child('Grid',{children:n.children??[],columns:n.columns??2,gap:'md'});
   if(n.type==='list'){const list=element(n.ordered?'ol':'ul','if-domain-list');for(const item of n.items??[]){const li=element('li');li.append(item&&typeof item==='object'&&item.type==='element'?render(item):child('Text',{content:display(item)}));list.append(li);}return list;}
   const contents=[...(n.children??[])];if(n.type==='section'&&n.heading)contents.unshift(baseNode('Heading',{content:n.heading,level:2}));if(n.type==='figure'&&n.caption)contents.push(textNode(n.caption,'muted'));
   const out=child('Stack',{children:contents,gap:'sm'});if(n.type==='figure'){out.setAttribute('role','figure');if(n.caption)out.setAttribute('aria-label',n.caption);else out.removeAttribute('aria-label');}if(n.type==='spacer'){out.style.height=String(n.height??16)+'px';out.setAttribute('aria-hidden','true');}if(n.type==='grid-item'){out.style.gridColumn='span '+(n.colSpan??1);out.style.gridRow='span '+(n.rowSpan??1);}return out;
  }
  if(n.type==='image')return child('Image',{src:n.src,alt:n.alt??''});
  if(n.type==='icon'){
   const aliases:Record<string,string>={info:'InfoCircle',check:'Check',warning:'TriangleExclamationErrorWarning',error:'XCircle',plus:'Plus',minus:'Minus','arrow-left':'ArrowLeft','arrow-right':'ArrowRight','external-link':'ExternalLink',clock:'Clock'};
   return child('Icon',{name:aliases[n.name]??n.name,...(n.label?{label:n.label}:{})});
  }
  if(n.type==='text'&&!n.runs)return child('Text',{content:text(n.value)});
  if(n.type==='title')return child('Heading',{content:text(n.value),level:n.level??2});
  if(n.type==='divider')return child('Divider',{});
  if(n.type==='badge')return child('Badge',{label:text(n.value)});
  return null;
 }

  function render(n: Node): HTMLElement | SVGElement {
    lifetime.check();
    if ((n as any).type === 'element') { const child = external.renderChild(n as any); lifetime.own(() => child.dispose()); if((n as any).id)child.element.id=prefix+(n as any).id;return child.element; }
    const composed = renderFoundationNode(n as any); if (composed) return composed;
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
      case 'calculator-rox-index-for-high-flow-nasal-cannula':out=renderRox(context,n);break;
      case 'calculator-qsofa-score':out=renderQsofa(context,n);break;
      case 'questionnaire':out=renderQuestionnaire(context,n);break;
      case 'calculator-glasgow-coma-scale-gcs':out=renderGcs(context,n);break;
      case 'calculator-corrected-adjusted-age-of-preterm-infants':out=renderCorrectedAge(context,n);break;
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
        if(n.gap !== undefined) out.style.setProperty('--if-domain-gap',String(n.gap));
        if(n.padding !== undefined) out.style.setProperty('--if-domain-padding',String(n.padding));
        if(n.type==='grid') { out.style.setProperty('--if-domain-columns',String(n.columns??2)); out.style.setProperty('--if-domain-grid-mobile-columns',String(n.mobileColumns??1)); }
        if(n.width) out.style.width=typeof n.width==='number'?`${n.width}px`:n.width;
        if(n.align) out.style.alignItems=({start:'flex-start',center:'center',end:'flex-end',stretch:'stretch'})[n.align];
        if(n.justify) out.style.justifyContent=({start:'flex-start',center:'center',end:'flex-end',between:'space-between',around:'space-around'})[n.justify];
        if(n.radius) out.style.borderRadius=({none:'0',sm:'4px',md:'8px',lg:'12px',xl:'16px','2xl':'24px'})[n.radius];
        if(n.border!==undefined) out.dataset.border=String(n.border); if(n.background) out.dataset.background=n.background;
        children(out,n.children); break;
      }
      case 'grid-item': out=element('div','iui-grid-item');out.style.setProperty('--if-domain-col-span',String(n.colSpan??1));out.style.setProperty('--if-domain-row-span',String(n.rowSpan??1));out.style.setProperty('--if-domain-mobile-col-span',String(n.mobileColSpan??1));children(out,n.children);break;
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
      case 'metric-grid': out=element('div','iui-layout iui-metric-grid');out.style.setProperty('--if-domain-columns',String(n.columns??2));out.style.setProperty('--if-domain-mobile-columns',String(Math.min(2,n.columns??2)));children(out,n.children);break;
      case 'steps': out=element('ol','iui-steps');for(const item of n.items){const li=element('li');li.append(element('strong','',item.title));if(item.detail)li.append(element('p','',item.detail));if(item.latex)li.append(formula(item.latex));out.append(li);}break;
      case 'callout': out=element('aside','iui-callout',n.value);out.dataset.tone=n.tone??'neutral';break;
      case 'slider': {out=element('div','iui-control iui-slider');const id=allocateInternalId('control'),head=element('div','iui-control-header'),label=element('label','',n.label),output=element('output');label.htmlFor=id;output.htmlFor=id;head.append(label,output);const input=element('input');input.type='range';input.id=id;input.min=String(n.min);input.max=String(n.max);input.step=String(n.step);input.dataset.bind=n.bind;const refresh=()=>{input.value=text(state[n.bind]);output.value=`${display(state[n.bind])}${n.unit??''}`;};bind(refresh);on(input,'input',()=>fromControl({[n.bind]:input.valueAsNumber}));out.append(head,input);forms.nativeControl(out,[input],n.bind,refresh);if(n.marks){const marks=element('div','iui-marks');for(const m of n.marks){const label=element('span','',m.label),ratio=(m.value-n.min)/(n.max-n.min);label.dataset.value=String(m.value);label.style.left=`${ratio*100}%`;label.style.transform=`translateX(-${ratio*100}%)`;marks.append(label);}out.append(marks);}break;}
      case 'toggle': {out=element('label','iui-control iui-toggle');const input=element('input');input.type='checkbox';input.dataset.bind=n.bind;const refresh=()=>{input.checked=state[n.bind]===true;};bind(refresh);on(input,'change',()=>fromControl({[n.bind]:input.checked}));out.append(input,doc.createTextNode(n.label));forms.nativeControl(out,[input],n.bind,refresh);break;}
      case 'select': {out=element('label','iui-control');out.append(element('span','',n.label));const input=element('select');input.dataset.bind=n.bind;for(const [i,o] of n.options.entries()){const opt=element('option','',o.label);opt.value=String(i);input.append(opt);}const refresh=()=>{input.value=String(n.options.findIndex(o=>o.value===state[n.bind]));};bind(refresh);on(input,'change',()=>fromControl({[n.bind]:n.options[Number(input.value)].value}));out.append(input);forms.nativeControl(out,[input],n.bind,refresh);break;}
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
      case 'rating-summary': out=renderRatingSummary(context,n); break;
      case 'vocab-card': out=renderVocabCard(context,n,labels.vocabUI); break;
      case 'checklist': out=renderChecklist(context,n,labels.checklistUI); break;
      case 'fill-blank': out=renderFillBlank(context,n); break;
      case 'sentence-builder': out=renderSentenceBuilder(context,n,labels.sentenceBuilderUI); break;
      case 'quiz': case 'flashcards': out=renderLearning(context,n); break;
      case 'sports-schedule': case 'sports-scoreboard': case 'sports-standings': out=renderSports(context,n);break;
      case 'svg': {out=svg('svg',{viewBox:n.viewBox,role:'img','aria-label':n.label??labels.diagram});out.classList.add('iui-svg');for(const shape of n.shapes){const s=svg(shape.tag,shape.attrs);if(shape.text)s.textContent=shape.text;out.append(s);}break;}
      case 'native': throw new Error('Native runtime is not supported');
      default: {const impossible=n;throw new Error(`Unsupported node: ${JSON.stringify(impossible)}`);}
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
      for(const [i,link]of n.links.entries()){const a=positions.get(link.from)!,b=positions.get(link.to)!;const high=n.highlight==='max-load'&&loads[i]===maximum;const color=high?'var(--if-chart-5)':'var(--if-chart-1)';const group=svg('g',{'data-bottleneck':String(high),'data-link-index':i});
        const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len;const sx=a.x+ux*36,sy=a.y+uy*25,ex=b.x-ux*39,ey=b.y-uy*27;
        group.append(svg('line',{x1:sx,y1:sy,x2:ex,y2:ey,stroke:color,'stroke-width':high?4:3}));group.append(svg('path',{d:`M ${ex-ux*9-uy*6} ${ey-uy*9+ux*6} L ${ex} ${ey} L ${ex-ux*9+uy*6} ${ey-uy*9-ux*6}`,fill:'none',stroke:color,'stroke-width':3}));
        const label=svg('text',{x:vertical?width/2+24:(a.x+b.x)/2,y:vertical?(a.y+b.y)/2:100,'text-anchor':vertical?'start':'middle','font-size':12});label.textContent=typeof loads[i]==='number'?`U${i+1} = ${(loads[i] as number).toFixed(2)}`:shorten(link.label??'',12);const tip=svg('title');tip.textContent=link.label??`${link.from} ${labels.to} ${link.to}`;group.append(tip,label);graphic.append(group);}
      for(const node of n.nodes){const p=positions.get(node.id)!;graphic.append(svg('rect',{x:p.x-35,y:p.y-24,width:70,height:48,rx:10,fill:'var(--if-surface)',stroke:'var(--if-border)','stroke-width':2}));const label=svg('text',{x:p.x,y:p.y+(node.subtitle?0:5),'text-anchor':'middle','font-size':13,'font-weight':600});label.textContent=shorten(node.label,7);const tip=svg('title');tip.textContent=[node.label,node.subtitle].filter(Boolean).join(': ');label.append(tip);graphic.append(label);if(node.subtitle){const sub=svg('text',{x:p.x,y:p.y+15,'text-anchor':'middle','font-size':10});sub.textContent=shorten(node.subtitle,10);graphic.append(sub);}}
      graphic.setAttribute('aria-label',[n.caption,...n.nodes.map(node=>[node.label,node.subtitle].filter(Boolean).join(': ')),...n.links.map((link,i)=>`${link.from} ${labels.to} ${link.to}: ${link.label??''} ${loads[i]===null?'':display(loads[i])}`)].filter(Boolean).join('; '));
      summary.textContent=[n.caption,finite.length?`${labels.maximumLoad}: ${maximum.toFixed(2)}.`:''].filter(Boolean).join(' ');
    });return figure;
  }

 context={doc,prefix,allocateInternalId,lifecycle:lifetime,labels:()=>labels,element,svg,on,bind,cleanup:lifetime.own,value,display,showValue,getState:()=>state,change,fromControl,render,actions,questionnaireActions:{}};
 // The official-icon helper uses the same injected catalog as foundation Icon.
 (context as any).allowImageURL=external.allowImageURL;
 (context as any).allowAnimationURL=external.allowAnimationURL;
 (context as any).officialIcon=(name:string,iconOptions:any)=>{if(options.renderIcon)return options.renderIcon(doc,name,iconOptions);return child('Icon',{name,...(iconOptions?.label?{label:iconOptions.label}:{})}) as SVGElement;};
 forms=createForms(context);fieldLabels=createLabels(context);
 const dispose=()=>{if(disposed)return;disposed=true;try{lifetime.dispose();}finally{container.remove();}};
 if(external.signal){external.signal.addEventListener('abort',dispose,{once:true});lifetime.own(()=>external.signal?.removeEventListener('abort',dispose));}
 try {root.append(render(node));
  for(const checkbox of container.querySelectorAll<HTMLInputElement>('input[type=checkbox]')){const parent=checkbox.parentElement;if(!parent||parent.querySelector(':scope > .if-domain-choice-check'))continue;parent.classList.add('if-domain-choice-owner');const glyph=(context as any).officialIcon('Check',{size:16,className:'if-domain-choice-check'});checkbox.after(glyph);}

  if(descriptor.oldType==='pressable'&&props.onPress){lifetime.listen(container,'inform:view-press',event=>{queueMicrotask(lifetime.guard(()=>{if(!event.defaultPrevented)external.dispatchLocal?.(props.onPress);}));});}
  const structural=['details','section','figure','grid-item','metric-grid','metric','tab-panel','spacer'].includes(descriptor.oldType);
  const update=structural?(next:Record<string,unknown>)=>{
   for(const key of Object.keys(node))if(key!=='type')delete node[key];
   Object.assign(node,next.data);for(const[key,value]of Object.entries(next))if(key!=='data')node[key]=value;
   const content=renderFoundationNode(node);if(content&&root.firstChild!==content)root.replaceChildren(content);
  }:undefined;
  return{element:container,dispose,...(update?{update}:{})};
 }catch(error){dispose();throw error;}
}
