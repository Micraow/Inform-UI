import type {RestaurantMenuNode} from '../schema/document.js';
import type {RendererContext} from './context.js';
import type {MenuLabels} from './menu-labels.js';

let serial = 0;
const overLimit = (text: string, limit: number): boolean => {
  let size = 0; for (const _point of text) if (++size > limit) return true; return false;
};

/** Finite, page-local browsing. Item DOM and native disclosures stay mounted. */
export function renderMenu(c: RendererContext, node: RestaurantMenuNode, t: MenuLabels): HTMLElement {
  const e = c.element, prefix = `iui-menu-internal-${c.prefix}${++serial}-`;
  const root = e('section', 'iui-menu'), title = e('h2', 'iui-menu-title', node.title);
  title.id = prefix+'title'; root.setAttribute('aria-labelledby', title.id);
  // The authored title comes first so Arabic-first menus genuinely drive inherited dir=auto.
  root.append(title, e('p','iui-caption',t.kind));
  if (node.description !== undefined) root.append(e('p','iui-menu-description',node.description));
  if (node.source !== undefined) {
    const source = e('p','iui-menu-source'); source.append(c.doc.createTextNode(t.source+': '));
    const value = e(node.source.url === undefined ? 'span' : 'a','',node.source.label);
    if (value.tagName === 'A') {
      const link = value as HTMLAnchorElement; link.href = node.source.url!; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.referrerPolicy = 'no-referrer';
      value.append(c.doc.createTextNode(' ('+t.external+')'));
    }
    source.append(value); root.append(source);
  }
  const rules = e('p','iui-caption',t.rules); rules.id = prefix+'rules'; root.append(rules);
  const controls = e('div','iui-menu-controls');
  const searchLabel = e('label','iui-menu-control',t.search), search = e('input','iui-menu-search');
  search.type = 'search'; search.id = prefix+'search'; search.autocomplete = 'off'; search.spellcheck = false; search.dir = 'auto';
  searchLabel.htmlFor = search.id; searchLabel.append(search);
  // No maxLength: native limits count UTF-16 units and can silently truncate a pasted draft.
  const limit = e('p','iui-menu-limit',t.tooLong); limit.id = prefix+'limit'; limit.hidden = true; limit.setAttribute('role','status');
  search.setAttribute('aria-describedby',rules.id+' '+limit.id);
  const categoryLabel = e('label','iui-menu-control',t.category), category = e('select','iui-menu-category');
  category.id = prefix+'category'; categoryLabel.htmlFor = category.id; categoryLabel.append(category);
  const all = e('option','',t.all); all.value = ''; category.append(all);
  for (const section of node.sections) {const option = e('option','',section.title); option.value = section.id; category.append(option);}
  const clear = e('button','iui-menu-clear',t.clear); clear.type = 'button';
  controls.append(searchLabel,categoryLabel,clear);
  const count = e('p','iui-menu-count'); count.setAttribute('role','status'); count.setAttribute('aria-live','polite'); count.setAttribute('aria-atomic','true');
  const empty = e('p','iui-menu-empty'); root.append(controls,limit,count,empty);
  const sections = node.sections.map(section => {
    const group = e('section','iui-menu-section'), heading = e('h3','iui-menu-section-title',section.title), list = e('ul','iui-menu-items');
    group.dataset.sectionId = section.id; heading.id = prefix+'section-'+section.id; group.setAttribute('aria-labelledby',heading.id);
    // An explicit list role preserves list semantics when CSS removes markers.
    list.setAttribute('role','list');
    const items = section.items.map(item => {
      const row = e('li','iui-menu-item'), head = e('div','iui-menu-item-heading'); row.dataset.itemId = item.id;
      const name = e('h4','iui-menu-name',item.name), price = e('bdi','iui-menu-price'); price.dir = 'ltr';
      price.dataset.price = item.price === null ? 'missing' : 'supplied';
      price.textContent = item.price === null ? t.missingPrice : `${String(item.price)} ${node.currency}`;
      if (item.price === null) price.removeAttribute('dir');
      head.append(name,price); row.append(head);
      if (item.description !== undefined) {
        const description = e('p','iui-menu-description',item.description);
        if (overLimit(item.description,200)) {
          const details = e('details','iui-menu-details'); details.append(e('summary','',t.details(item.name)),description); row.append(details);
        } else row.append(description);
      }
      row.append(e('p','iui-menu-item-status',item.status === undefined ? t.unknownStatus : t[item.status]));
      if (item.tags?.length) {
        const tags = e('ul','iui-menu-tags'); tags.setAttribute('aria-label',t.tags); tags.setAttribute('role','list');
        for (const tag of item.tags) tags.append(e('li','iui-menu-tag',tag)); row.append(tags);
      }
      list.append(row);
      return {row, searchable:[item.name,item.description??'',...(item.tags??[])].map(value=>value.toLowerCase())};
    });
    group.append(heading,list); root.append(group); return {id:section.id,group,items};
  });
  root.append(e('p','iui-caption',t.privacy));
  const total = sections.reduce((sum,section)=>sum+section.items.length,0);
  let query = '', draft = '', selected = '', disposed = false;
  function paint(): void {
    let visible = 0;
    for (const section of sections) {
      let inSection = 0;
      for (const item of section.items) {
        item.row.hidden = (selected !== '' && selected !== section.id) || !item.searchable.some(value=>value.includes(query));
        if (!item.row.hidden) {visible++; inSection++;}
      }
      section.group.hidden = inSection === 0;
    }
    const tooLong = overLimit(draft,200); limit.hidden = !tooLong;
    if (tooLong) search.setAttribute('aria-invalid','true'); else search.removeAttribute('aria-invalid');
    root.dataset.state = tooLong ? 'query-too-long' : total === 0 ? 'empty' : visible === 0 ? 'no-match' : 'ready';
    count.textContent = t.count(visible,total); empty.hidden = total !== 0 && (visible !== 0 || tooLong);
    empty.textContent = total === 0 ? t.empty : t.noMatch;
    // Keep an enclosing native form reset from desynchronizing these unbound local controls.
    search.defaultValue = draft;
    for (const option of category.options) option.defaultSelected = option.value === selected;
    search.value = draft; category.value = selected;
  }
  c.on(search,'input',()=>{
    if (disposed) return;
    if (search.matches(':disabled')) {search.value=draft; return;}
    draft = search.value;
    if (!overLimit(draft,200)) query = draft.trim().toLowerCase();
    paint();
  });
  c.on(category,'change',()=>{
    if (disposed) return;
    if (category.matches(':disabled') || (category.value !== '' && !sections.some(section=>section.id === category.value))) {category.value=selected; return;}
    selected = category.value; paint();
  });
  c.on(search,'keydown',event=>{
    const key = event as KeyboardEvent;
    if (!disposed && !search.matches(':disabled') && key.key === 'Enter' && !key.isComposing && key.keyCode !== 229 && !key.altKey && !key.ctrlKey && !key.metaKey && !key.shiftKey) key.preventDefault();
  });
  c.on(clear,'click',()=>{
    if (disposed || clear.matches(':disabled')) return;
    query = ''; draft = ''; selected = ''; paint(); search.focus();
  });
  c.cleanup(()=>{disposed=true;});
  // No state binding, global listener, timer, storage or network. Lifecycle owns all c.on listeners.
  paint(); return root;
}
