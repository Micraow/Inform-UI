import type {LocationChoiceRequestNode, LocationChoiceOption, BusinessGalleryNode} from '../schema/document.js';
import type {RendererContext} from './context.js';
import type {ChoiceGalleryLabels} from './choice-gallery-labels.js';

/** An explicit local request. It is not a device location or navigation action. */
export interface LocationChoiceDetail {
  readonly componentId: string | null;
  readonly optionId: string;
  readonly label: string;
  readonly address: string | null;
}
let serial = 0;

function section(c: RendererContext, node: LocationChoiceRequestNode | BusinessGalleryNode, cls: string, disclosure: string) {
  const root = c.element('section', cls); root.dir = 'auto';
  const prefix = `iui-choice-gallery-internal-${c.prefix}${++serial}`;
  const title = c.element('h2', `${cls}-title`, node.label); title.id = `${prefix}-title`;
  root.setAttribute('aria-labelledby', title.id); root.append(title);
  if (node.description !== undefined) root.append(c.element('p', `${cls}-description`, node.description));
  const note = c.element('p', `${cls}-note`, disclosure); note.id = `${prefix}-note`;
  root.append(note); root.setAttribute('aria-describedby', note.id);
  return {root, prefix, title, note};
}

export function renderLocationChoice(c: RendererContext, n: LocationChoiceRequestNode, labels: ChoiceGalleryLabels): HTMLElement {
  const {root, prefix, title, note} = section(c,n,'iui-location-choice',labels.locationDisclosure);
  const list = c.element('ul','iui-location-choice-options'); list.setAttribute('aria-labelledby',title.id); root.append(list);
  const selection = c.element('p','iui-location-choice-selection'); selection.id = `${prefix}-selection`;
  const clear = c.element('button','iui-location-choice-clear',labels.clear); clear.type = 'button'; clear.setAttribute('aria-describedby',selection.id);
  const status = c.element('p','iui-location-choice-status'); status.setAttribute('role','status'); status.setAttribute('aria-live','polite'); status.setAttribute('aria-atomic','true');
  let selected: LocationChoiceOption | undefined, alive = true, dispatching = false;
  c.cleanup(()=>{ alive = false; });
  const blocked = (button: HTMLButtonElement) => !alive || !root.isConnected || button.matches(':disabled') || !!button.closest('[hidden]');
  const controls = n.options.map(option => {
    const row = c.element('li'), button = c.element('button','iui-location-choice-option'); button.type = 'button'; button.dir = 'auto'; button.dataset.optionId = option.id;
    button.setAttribute('aria-describedby',note.id); button.append(c.element('span','iui-location-choice-label',option.label));
    if (option.address !== undefined) button.append(c.element('span','iui-location-choice-address',option.address));
    if (option.description !== undefined) button.append(c.element('span','iui-location-choice-detail',option.description));
    row.append(button); list.append(row);
    c.on(button,'click',()=>{
      if (dispatching || blocked(button)) return;
      dispatching = true;
      try {
        const detail: LocationChoiceDetail = Object.freeze({componentId:n.id??null,optionId:option.id,label:option.label,address:option.address??null});
        const EventConstructor = c.doc.defaultView?.CustomEvent;
        let event: CustomEvent<LocationChoiceDetail>;
        if (typeof EventConstructor === 'function') event = new EventConstructor('iui:location-choice',{detail,bubbles:true,cancelable:true,composed:false});
        else { event = c.doc.createEvent('CustomEvent'); event.initCustomEvent('iui:location-choice',true,true,detail); }
        // Host constructor hooks and event listeners may synchronously replace this tree.
        if (blocked(button)) return;
        const accepted = root.dispatchEvent(event);
        if (!alive || !root.isConnected) return;
        if (accepted) { selected = option; status.textContent = labels.accepted; root.dataset.status = 'selected'; }
        else { status.textContent = labels.rejected; root.dataset.status = 'not-accepted'; }
        paint();
      } finally { dispatching = false; }
    });
    return {option,button};
  });
  function paint() {
    controls.forEach(({option,button})=>button.setAttribute('aria-pressed',String(selected?.id===option.id)));
    selection.textContent = selected ? `${labels.selected}: ${selected.label}${selected.address === undefined || selected.address === '' ? '' : ` — ${selected.address}`}` : labels.noSelection;
    clear.setAttribute('aria-disabled',String(selected===undefined));
  }
  c.on(clear,'click',()=>{
    if (dispatching || blocked(clear) || selected===undefined) return;
    selected = undefined; status.textContent = ''; root.dataset.status = 'idle'; paint();
  });
  root.append(selection,clear,status);
  if (n.source) {
    const source = c.element('p','iui-location-choice-source'); source.append(c.doc.createTextNode(`${labels.source}: `));
    if (n.source.url === undefined) source.append(c.element('span','',n.source.label));
    else {
      const anchor = c.element('a','',`${n.source.label} (${labels.opensNewTab})`); anchor.href = n.source.url;
      anchor.target = '_blank'; anchor.rel = 'noopener noreferrer'; anchor.referrerPolicy = 'no-referrer'; source.append(anchor);
    }
    root.append(source);
  }
  root.dataset.status = 'idle'; paint(); return root;
}

/** Each supplied picture delegates to the ordinary image renderer's own consent gate. */
export function renderBusinessGallery(c: RendererContext, n: BusinessGalleryNode, labels: ChoiceGalleryLabels): HTMLElement {
  const {root, title} = section(c,n,'iui-business-gallery',labels.galleryDisclosure);
  const list = c.element('ol','iui-business-gallery-images'); list.setAttribute('aria-labelledby',title.id);
  for (const image of n.images) {
    const row = c.element('li','iui-business-gallery-item'); row.dataset.imageId = image.id;
    const figure = c.render({type:'image',src:image.src,alt:image.alt,fit:'contain'});
    if (image.caption !== undefined) {
      const caption = c.element('figcaption','iui-business-gallery-caption',image.caption);
      caption.id = `${title.id}-${image.id}-caption`; figure.setAttribute('aria-describedby',caption.id); figure.append(caption);
    }
    row.append(figure); list.append(row);
  }
  root.append(list); return root;
}
