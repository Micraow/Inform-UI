import {renderRelatedQuestions} from './related-questions.js';
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
const styles: string = stylesheet + '\n' + mathStyles;

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
  let labels = presentationLabels(container);
  const prefix = `iui-${++instance}-`;
  let disposed = false;
  let hasHeading = false;
  let current: IUIDocument;
  let state: Record<string, string | number | boolean> = {};
  let computed: Record<string, Value> = {};
  let root: HTMLElement;
  let error: HTMLElement;
  let refreshers: (() => void)[] = [];
  let removers: (() => void)[] = [];
  const text = (value: unknown) => value == null ? '' : String(value);
  const display = (value: unknown) => typeof value === 'number' ? formatNumber(value) : text(value);
  const showValue = (target: HTMLElement, value: unknown) => {
    target.textContent = display(value);
    if (typeof value === 'number') {
      const raw = Object.is(value, -0) ? '-0' : String(value);
      target.dataset.rawValue = raw;
      if (display(value) !== raw) target.title = `${labels.rawValue}: ${raw}`;
      else target.removeAttribute('title');
    } else { delete target.dataset.rawValue; target.removeAttribute('title'); }
  };
  const element = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', value?: unknown) => {
    const result = doc.createElement(tag); if (cls) result.className = cls;
    if (value !== undefined) result.textContent = text(value); return result;
  };
  const svg = (tag: string, attrs: Record<string, unknown> = {}) => {
    const result = doc.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [key, value] of Object.entries(attrs)) result.setAttribute(key, text(value));
    return result;
  };
  const on = (target: EventTarget, name: string, listener: EventListener) => {
    target.addEventListener(name, listener); removers.push(() => target.removeEventListener(name, listener));
  };
  const bind = (fn: () => void) => { refreshers.push(fn); fn(); };
  const value = (v: Value) => evaluateValue(v, state, computed);
  const clear = () => { for (const remove of removers) remove(); removers = []; refreshers = []; };
  const notify = () => { for (const fn of refreshers) fn(); };
  const fail = (e: unknown) => { error.textContent = e instanceof Error ? e.message : String(e); };
  type DraftPolicy = 'preserve' | 'replace' | 'reset';
  function change(patch: Record<string, string | number | boolean>, draftPolicy: DraftPolicy = 'preserve') {
    ensureLive();
    const candidate = evaluateState({...current,state}, patch);
    if (!candidate.ok) throw new InvalidDocumentError(candidate.issues);
    state = {...candidate.state}; computed = {...candidate.computed};
    error.textContent = '';
    if (draftPolicy !== 'preserve') forms.syncDrafts(Object.keys(patch), draftPolicy === 'reset');
    notify();
  }
  function fromControl(patch: Record<string, string | number | boolean>, draftPolicy: DraftPolicy = 'preserve') {
    try { change(patch, draftPolicy); } catch(e) { notify(); fail(e); }
  }
  function ensureLive() { if (disposed) throw new Error('This UI controller has been disposed'); }
  const context:RendererContext={doc,prefix,labels:()=>labels,element,svg,on,bind,cleanup:fn=>removers.push(fn),value,display,showValue,getState:()=>state,change,fromControl,render,actions:options.actions??{}};
  const forms=createForms(context);
  const fieldLabels=createLabels(context);
  const children = (parent: HTMLElement, nodes: readonly Node[]) => { for (const node of nodes) parent.append(render(node)); };
  function formula(latex: string, block = true) {
    const target = element(block ? 'div' : 'span', 'iui-math');
    try { target.innerHTML = katex.renderToString(latex, {output:'htmlAndMathml', displayMode:block, throwOnError:true, trust:false, strict:'error', maxExpand:200, maxSize:20}); }
    catch { target.textContent = latex; target.classList.add('iui-math-error'); target.setAttribute('aria-label', labels.formulaSource); }
    return target;
  }
  function render(n: Node): HTMLElement | SVGElement {
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
      case 'sidebar-people-also-ask':out=renderRelatedQuestions(context,n,labels.questionsUI);break;
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
        const anchor = element('a'); out=anchor; anchor.href = n.href.startsWith('#') ? `#${prefix}${n.href.slice(1)}` : n.href;
        if (!n.href.startsWith('#')) { anchor.target = '_blank'; anchor.rel = 'noopener noreferrer'; }
        const target = out; bind(() => target.textContent = text(value(n.value))); break;
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
      case 'slider': {out=element('div','iui-control');const id=`iui-control-internal-${prefix}${refreshers.length}`,head=element('div','iui-control-header'),label=element('label','',n.label),output=element('output');label.htmlFor=id;output.htmlFor=id;head.append(label,output);const input=element('input');input.type='range';input.id=id;input.min=String(n.min);input.max=String(n.max);input.step=String(n.step);input.dataset.bind=n.bind;bind(()=>{input.value=text(state[n.bind]);output.value=`${display(state[n.bind])}${n.unit??''}`;});on(input,'input',()=>fromControl({[n.bind]:input.valueAsNumber}));out.append(head,input);if(n.marks){const marks=element('div','iui-marks');for(const m of n.marks){const label=element('span','',m.label),ratio=(m.value-n.min)/(n.max-n.min);label.dataset.value=String(m.value);label.style.left=`${ratio*100}%`;label.style.transform=`translateX(-${ratio*100}%)`;marks.append(label);}out.append(marks);}break;}
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
    out.dataset.iui=n.type;if(n.id)out.id=prefix+n.id;fieldLabels.registerTarget(n,out);return out;
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
  function replace(next: unknown) {
    ensureLive(); const validation=validateDocument(next);if(!validation.ok)throw new InvalidDocumentError(validation.issues);
    const evaluated=evaluateState(validation.document);if(!evaluated.ok)throw new InvalidDocumentError(evaluated.issues);
    clear();labels=presentationLabels(container);hasHeading=false;current=validation.document;state={...evaluated.state};computed={...evaluated.computed};
    root=element('article','iui-root');root.dataset.theme=current.theme??'auto';root.dir='auto';
    if(options.styles!==false){const style=element('style');style.textContent=styles;root.append(style);}
    if(current.title)root.setAttribute('aria-label',current.title);
    if(current.description)root.append(element('p','iui-description',current.description));
    const body=element('div','iui-body');children(body,current.body);root.append(body);
    error=element('p','iui-error');error.setAttribute('role','alert');root.append(error);
    container.replaceChildren(root);notify();
  }
  replace(input);
  let resize: ResizeObserver | undefined;
  const RO=doc.defaultView?.ResizeObserver;
  if(RO){let previousWidth=container.getBoundingClientRect().width;resize=new RO(()=>{if(disposed)return;const width=container.getBoundingClientRect().width;if(width===previousWidth)return;previousWidth=width;notify();});resize.observe(container);}
  return {update:replace,getState:()=>{ensureLive();return Object.freeze({...state});},setState:patch=>change(patch,'replace'),dispose:()=>{if(disposed)return;disposed=true;resize?.disconnect();clear();root.remove();}};
}
export {styles};
