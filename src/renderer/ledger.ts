import type {AssetDistributionNode, TransactionListNode} from '../schema/document.js';
import type {RendererContext} from './context.js';
import type {LedgerLabels} from './ledger-labels.js';
import {ledgerGroups} from '../core/ledger.js';

type LedgerNode = AssetDistributionNode | TransactionListNode;
let serial = 0;
const raw = (value:number):string => Object.is(value,-0) ? '0' : String(value);
/** Supplied ledger data has no bindings, host actions, network or persistent state. */
export function renderLedger(c:RendererContext,n:LedgerNode,l:LedgerLabels):HTMLElement {
  const e = c.element, asset = n.type === 'asset-distribution';
  const out = e('section',`iui-ledger iui-${n.type}`), base = `iui-ledger-internal-${c.prefix}${++serial}`;
  const title = e('h2','iui-ledger-title',n.label); title.id = `${base}-title`; out.setAttribute('aria-labelledby',title.id); out.append(title);
  if (n.description !== undefined) out.append(e('p','iui-ledger-description',n.description));
  const note = e('p','iui-ledger-note',asset ? l.assetNote : l.transactionNote); note.id = `${base}-note`;
  out.append(note); out.setAttribute('aria-describedby',note.id);
  if (n.type === 'asset-distribution' && n.observedAt !== undefined) out.append(e('p','iui-ledger-observed',`${l.observed}: ${n.observedAt}`));
  let alive = true, revision = 0;
  let resetRoot: EventTarget | undefined;
  const controls: HTMLSelectElement[] = [];
  const toolbar = e('div','iui-ledger-filters');
  const select = (key:string,labelText:string,allText:string,values:readonly {value:string;label:string}[]) => {
    const label = e('label','iui-ledger-filter-label',labelText), control = e('select',`iui-ledger-${key}-filter`);
    control.id = `${base}-${key}`; label.htmlFor = control.id;
    for (const item of [{value:'',label:allText},...values]) { const option = e('option','',item.label); option.value = item.value; option.defaultSelected = item.value === ''; control.append(option); }
    control.value = ''; controls.push(control); const pair = e('div','iui-ledger-filter'); pair.append(label,control); toolbar.append(pair); return control;
  };
  const counts = e('p','iui-ledger-counts'); counts.setAttribute('role','status'); counts.setAttribute('aria-live','polite'); counts.setAttribute('aria-atomic','true');
  const empty = e('p','iui-ledger-empty');
  let paint:()=>void, reset:()=>void;
  const active = (control:HTMLElement) => alive && out.isConnected && !control.matches(':disabled') && !control.closest('[hidden],[inert]');
  const amountCell = (amount:number|null) => {
    const cell = e('td','iui-ledger-amount',amount === null ? l.notSupplied : raw(amount));
    if (amount !== null) cell.dataset.rawValue = raw(amount); else cell.dataset.missing = 'true';
    cell.dir = amount === null ? 'auto' : 'ltr'; return cell;
  };
  const table = (captionText:string,columns:readonly string[]) => {
    const wrap = e('div','iui-ledger-table-wrap'); wrap.tabIndex = 0; wrap.setAttribute('role','region'); wrap.setAttribute('aria-label',captionText);
    const table = e('table','iui-ledger-table'), caption = e('caption','',captionText), head = e('thead'), row = e('tr'), body = e('tbody');
    for (const text of columns) { const cell = e('th','',text); cell.scope = 'col'; row.append(cell); }
    head.append(row); table.append(caption,head,body); wrap.append(table); return {wrap,body};
  };
  const detail = (items:readonly [string,string][]) => {
    const details = e('details','iui-ledger-details'); details.append(e('summary','',l.details));
    const facts = e('dl');
    for (const [label,value] of items) { facts.append(e('dt','',label),e('dd','',value)); }
    details.append(facts); return details;
  };
  if (n.type === 'asset-distribution') {
    const groups = ledgerGroups(n.accounts), currencies = groups.map(group=>group.currency);
    const filter = groups.length > 1 ? select('currency',l.currencyFilter,l.allCurrencies,currencies.map(value=>({value,label:value}))) : undefined;
    if (filter) out.append(toolbar);
    out.append(counts,empty);
    const mounted = groups.map(group => {
      const section = e('section','iui-ledger-currency-group'); section.dataset.currency = group.currency;
      const heading = e('h3','iui-ledger-currency',group.currency); heading.id = `${base}-group-${groups.indexOf(group)}`; section.setAttribute('aria-labelledby',heading.id);
      const subtotal = e('p','iui-ledger-subtotal',`${l.knownSubtotal}: ${group.subtotal === null ? l.subtotalUnavailable : `${group.subtotal} ${group.currency}`}`);
      if (group.subtotal !== null) subtotal.dataset.rawValue = group.subtotal;
      section.append(heading,e('p','iui-ledger-group-counts',l.accountCounts(group.accounts.length,group.unknown)),subtotal,e('p','iui-ledger-note',l.subtotalNote));
      const known = group.accounts.filter(account=>account.amount !== null), positive = known.filter(account=>account.amount! > 0);
      if (positive.length) {
        const maximum = Math.max(...positive.map(account=>account.amount!));
        const total = positive.reduce((sum,account)=>sum + account.amount! / maximum,0);
        const bar = e('div','iui-ledger-distribution'); bar.setAttribute('aria-hidden','true');
        positive.forEach((account,index) => {
          const segment = e('span','iui-ledger-segment'); segment.dataset.accountId = account.id;
          const share = Math.max(0,Math.min(100,(account.amount! / maximum) / total * 100));
          segment.style.width = `${share}%`; segment.dataset.share = String(share); segment.dataset.color = ['blue','green','orange','purple','red','gray'][index % 6]; bar.append(segment);
        }); section.append(bar);
      } else if (known.length) section.append(e('p','iui-ledger-shares-undefined',l.zeroShares));
      if (group.unknown) section.append(e('p','iui-ledger-note',l.unknownShares));
      const hasCategory = group.accounts.some(account=>account.category !== undefined), hasNote = group.accounts.some(account=>account.note !== undefined);
      const {wrap,body} = table(l.accountTable(group.currency),[l.account,l.amount,l.currency,...(hasCategory ? [l.category] : []),...(hasNote ? [l.details] : [])]);
      for (const account of group.accounts) {
        const row = e('tr'); row.dataset.accountId = account.id;
        const name = e('th','iui-ledger-account-name',account.name); name.scope = 'row';
        row.append(name,amountCell(account.amount),e('td','iui-ledger-currency-code',account.currency));
        if (hasCategory) row.append(e('td','iui-ledger-category',account.category ?? ''));
        if (hasNote) { const cell = e('td'); if (account.note !== undefined) cell.append(detail([[l.note,account.note]])); row.append(cell); }
        body.append(row);
      }
      section.append(wrap); out.append(section); return {group,section};
    });
    out.append(e('p','iui-ledger-note',l.precisionNote));
    let currency = '';
    paint = () => {
      if (filter) filter.value = currency;
      let count = 0;
      for (const {group,section} of mounted) { section.hidden = currency !== '' && group.currency !== currency; if (!section.hidden) count += group.accounts.length; }
      counts.textContent = l.visibleCounts(count,n.accounts.length); empty.hidden = n.accounts.length > 0; empty.textContent = l.accountsEmpty;
    };
    reset = () => { currency = ''; paint(); };
    if (filter) c.on(filter,'change',()=>{
      if (!alive) return;
      if (!active(filter) || filter.selectedIndex < 0 || (filter.value !== '' && !currencies.includes(filter.value))) { paint(); return; }
      currency = filter.value; revision++; paint();
    });
  } else {
    const months = [...new Set(n.transactions.map(transaction=>transaction.date.slice(0,7)))];
    const directionSelect = select('direction',l.directionFilter,l.allDirections,[{value:'debit',label:l.debit},{value:'credit',label:l.credit}]);
    const monthSelect = select('month',l.monthFilter,l.allMonths,months.map(value=>({value,label:value})));
    const resetButton = e('button','iui-ledger-reset',l.reset); resetButton.type = 'button'; toolbar.append(resetButton); out.append(toolbar,counts,empty);
    const {wrap,body} = table(n.label,[l.date,l.description,l.amount,l.currency,l.direction,l.status]); out.append(wrap);
    const mounted = n.transactions.map(transaction => {
      const row = e('tr'); row.dataset.transactionId = transaction.id;
      const dateCell = e('td'), date = e('time','iui-ledger-date',transaction.date); date.dateTime = transaction.date; date.dir = 'ltr'; dateCell.append(date);
      const description = e('th','iui-ledger-transaction-description'); description.scope = 'row'; description.append(e('span','',transaction.description));
      const details: [string,string][] = [];
      if (transaction.counterparty !== undefined) details.push([l.counterparty,transaction.counterparty]);
      if (transaction.note !== undefined) details.push([l.note,transaction.note]);
      if (details.length) description.append(detail(details));
      row.append(dateCell,description,amountCell(transaction.amount),e('td','iui-ledger-currency-code',transaction.currency),e('td','iui-ledger-direction',l[transaction.direction]),e('td','iui-ledger-status',transaction.status === undefined ? l.statusUnknown : l[transaction.status]));
      body.append(row); return {transaction,row};
    });
    let direction = '', month = '';
    paint = () => {
      directionSelect.value = direction; monthSelect.value = month;
      let visible = 0;
      for (const {transaction,row} of mounted) { row.hidden = (direction !== '' && transaction.direction !== direction) || (month !== '' && transaction.date.slice(0,7) !== month); if (!row.hidden) visible++; }
      counts.textContent = l.visibleCounts(visible,n.transactions.length); empty.hidden = visible > 0; empty.textContent = n.transactions.length ? l.noMatch : l.transactionsEmpty;
      wrap.hidden = visible === 0; resetButton.setAttribute('aria-disabled',String(direction === '' && month === ''));
    };
    reset = () => { direction = ''; month = ''; paint(); };
    c.on(directionSelect,'change',()=>{
      if (!alive) return;
      if (!active(directionSelect) || directionSelect.selectedIndex < 0 || !['','debit','credit'].includes(directionSelect.value)) { paint(); return; }
      direction = directionSelect.value; revision++; paint();
    });
    c.on(monthSelect,'change',()=>{
      if (!alive) return;
      if (!active(monthSelect) || monthSelect.selectedIndex < 0 || (monthSelect.value !== '' && !months.includes(monthSelect.value))) { paint(); return; }
      month = monthSelect.value; revision++; paint();
    });
    c.on(resetButton,'click',()=>{ if (active(resetButton)) { revision++; reset(); } });
  }
  if (n.source) {
    const source = e('p','iui-ledger-source'); source.append(c.doc.createTextNode(`${l.source}: `));
    if (n.source.url === undefined) source.append(e('span','',n.source.label));
    else { const link = e('a','',`${n.source.label} (${l.opensNewTab})`); link.href = n.source.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.referrerPolicy = 'no-referrer'; source.append(link); }
    out.append(source);
  }
  // Capture catches native outer-form reset even if its later handlers stop propagation.
  // Wait until the browser's default reset and cancellation decisions have completed.
  const onReset = (event:Event) => {
    const form = event.target as HTMLFormElement | null;
    if (!alive || form?.tagName !== 'FORM' || !form.contains(out)) return;
    const before = revision, allowed = active(out) && controls.every(active);
    queueMicrotask(()=>{
      if (!alive || !out.isConnected || !form.contains(out)) return;
      if (!event.defaultPrevented && before === revision && allowed && active(out) && controls.every(active)) { revision++; reset(); } else paint();
    });
  };
  c.doc.addEventListener('reset',onReset,true);
  c.bind(()=>{
    const tree=out.getRootNode(), next=tree!==c.doc && tree.nodeType===11 ? tree : undefined;
    if (next===resetRoot) return;
    resetRoot?.removeEventListener('reset',onReset,true); resetRoot=next; resetRoot?.addEventListener('reset',onReset,true);
  });
  c.cleanup(()=>{ alive = false; c.doc.removeEventListener('reset',onReset,true); resetRoot?.removeEventListener('reset',onReset,true); });
  paint(); return out;
}
