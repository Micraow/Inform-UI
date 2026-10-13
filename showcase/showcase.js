import { mount, validateDocument } from './runtime/iui.min.js';

const $ = id => document.getElementById(id);
const repo = 'https://github.com/Micraow/Inform-UI/blob/main/';
let catalog, selected, controller, mountedDocument, theme = 'light', activity = [], toastTimer;
const node = (tag, text, className) => { const element = document.createElement(tag); if (text !== undefined) element.textContent = text; if (className) element.className = className; return element; };
function toast(message) {
  clearTimeout(toastTimer); $('toast').textContent = message; $('toast').hidden = false;
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, 3200);
}
async function copy(text, label) {
  try { await navigator.clipboard.writeText(text); toast(`${label} copied`); }
  catch { toast('Clipboard access is unavailable. Select the JSON and copy it with your keyboard.'); }
}
function tokens(id, values, link = false) {
  $(id).replaceChildren(...values.map(value => {
    const element = node(link ? 'a' : 'span', value);
    if (link) element.href = `#${encodeURIComponent(value)}`;
    return element;
  }));
  if (!values.length) $(id).append(node('span', 'None'));
}
function jsonHighlight(value) {
  const source = JSON.stringify(value, null, 2), fragment = document.createDocumentFragment();
  const pattern = /("(?:\\.|[^"\\])*"\s*:?)|\b(true|false|null)\b|-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/g;
  let start = 0;
  for (const match of source.matchAll(pattern)) {
    fragment.append(document.createTextNode(source.slice(start, match.index)));
    const kind = match[0][0] === '"' ? (match[0].trimEnd().endsWith(':') ? 'key' : 'string') : match[2] ? 'literal' : 'number';
    fragment.append(node('span', match[0], `json-${kind}`));
    start = match.index + match[0].length;
  }
  fragment.append(document.createTextNode(source.slice(start)));
  $('json-code').replaceChildren(fragment);
  $('json-size').textContent = `${new TextEncoder().encode(source).length.toLocaleString()} bytes · ${source.split('\n').length} lines`;
}
function updateState() { if (controller) $('state-view').textContent = JSON.stringify(controller.getState(), null, 2); }
function logEvent(type, detail) {
  activity.unshift({ type, detail }); activity = activity.slice(0, 15);
  $('event-count').textContent = `${activity.length}${activity.length === 15 ? '+' : ''} events`;
  $('event-log').replaceChildren(...activity.map(event => {
    const item = node('li'); item.append(node('strong', event.type), node('div', JSON.stringify(event.detail))); return item;
  }));
  updateState();
}
function renderList() {
  const query = $('search').value.trim().toLowerCase(), category = $('category').value;
  const matches = catalog.entries.filter(entry => (category === 'all' || entry.group === category) && `${entry.type} ${entry.moduleId} ${entry.moduleTitle} ${entry.category}`.toLowerCase().includes(query));
  $('result-count').textContent = `${matches.length} of ${catalog.inventoryCount} schema nodes`;
  $('clear-filters').hidden = !query && category === 'all';
  const fragment = document.createDocumentFragment();
  for (const group of catalog.groups) {
    const items = matches.filter(entry => entry.group === group.id);
    if (!items.length) continue;
    fragment.append(node('h3', `${group.title} · ${items.length}`));
    for (const entry of items) {
      const link = node('a', undefined, 'component-link');
      link.href = `#${encodeURIComponent(entry.type)}`; link.dataset.type = entry.type;
      link.append(node('span', entry.type), node('span', undefined, 'node-dot'));
      if (entry.type === selected?.type) link.setAttribute('aria-current', 'page');
      if (entry.status === 'rejected') link.setAttribute('aria-label', `${entry.type}, rejected compatibility boundary`);
      fragment.append(link);
    }
  }
  if (!matches.length) fragment.append(node('p', 'No matching components. Try another name or clear your filters.', 'no-results'));
  $('component-list').replaceChildren(fragment);
}
function renderPreview() {
  controller?.dispose(); controller = undefined;
  $('preview').replaceChildren(); activity = []; $('event-log').replaceChildren(); $('event-count').textContent = '0 events'; $('state-view').textContent = '{}';
  mountedDocument = { ...structuredClone(selected.document), theme };
  jsonHighlight(mountedDocument);
  const validation = validateDocument(mountedDocument);
  $('preview').dataset.component = selected.type;
  if (selected.status === 'rejected') {
    const warning = node('div', undefined, 'boundary-message');
    warning.append(node('strong', 'An explicit compatibility boundary.'), node('div', 'The schema recognizes native input. The runtime rejects it before rendering. Choose a supported node to build an interface.'), node('pre', JSON.stringify(validation.issues, null, 2)));
    $('preview').append(warning); $('preview').dataset.status = validation.ok ? 'unexpected-success' : 'rejected';
    $('json-label').textContent = '{ } Rejected example';
    document.querySelector('.code-footnote span:last-child').textContent = 'Expected semantic rejection';
    $('preview-label').lastChild.textContent = ' Validation boundary';
    return;
  }
  $('json-label').textContent = '{ } Mounted JSON';
  document.querySelector('.code-footnote span:last-child').textContent = 'Valid iui/1 document';
  $('preview-label').lastChild.textContent = ' Live preview';
  try {
    controller = mount($('preview'), mountedDocument);
    $('preview').dataset.status = 'mounted'; updateState();
  } catch (error) {
    const warning = node('div', undefined, 'boundary-message');
    warning.append(node('strong', 'This preview could not mount.'), node('pre', error.message));
    $('preview').append(warning); $('preview').dataset.status = 'error';
  }
}
function choose(type, { reveal = false } = {}) {
  const next = catalog.entries.find(entry => entry.type === type);
  if (!next) { toast(`Unknown component: ${type}`); return; }
  selected = next;
  const group = catalog.groups.find(item => item.id === selected.group);
  $('component-group').textContent = group.title;
  $('component-title').textContent = selected.type;
  $('component-description').textContent = selected.moduleTitle;
  $('component-status').textContent = selected.status === 'rejected' ? 'Rejected by design' : 'Schema + semantics checked';
  $('component-status').classList.toggle('rejected', selected.status === 'rejected');
  $('component-notes').replaceChildren(...selected.notes.map(note => node('li', note)));
  tokens('owner-module', [selected.moduleId]); tokens('declared-deps', selected.declaredDependencies); tokens('resolved-deps', selected.resolvedModules); tokens('included-types', selected.includes, true); tokens('required-fields', selected.requiredFields); tokens('all-fields', selected.properties);
  $('contracts').replaceChildren(...selected.contractPaths.map(path => {
    const link = node('a', `${path.split('/').at(-1).replace('.md', '').split('#')[0]}`); link.href = repo + path; link.target = '_blank'; link.rel = 'noopener noreferrer'; return link;
  }));
  const sourceLink = node('a', selected.sourceExample); sourceLink.href = repo + selected.sourceExample; sourceLink.target = '_blank'; sourceLink.rel = 'noopener noreferrer';
  $('example-source').replaceChildren(document.createTextNode('Example adapted from '), sourceLink, document.createTextNode('. The JSON above is exactly what this preview mounts.'));
  $('component-content').hidden = false; $('loading').hidden = true;
  renderList(); renderPreview();
  document.title = `${selected.type} · Inform UI`;
  document.documentElement.dataset.ready = 'true';
  if (reveal && matchMedia('(max-width: 760px)').matches) $('workspace').scrollIntoView({ behavior: 'auto', block: 'start' });
}
function hashType() { try { return decodeURIComponent(location.hash.slice(1)) || 'chart'; } catch { return 'chart'; } }
$('theme-toggle').addEventListener('click', () => {
  theme = theme === 'light' ? 'dark' : 'light'; document.documentElement.classList.toggle('dark', theme === 'dark');
  $('theme-toggle').setAttribute('aria-label', `Use ${theme === 'dark' ? 'light' : 'dark'} theme`);
  if (selected) renderPreview();
});
$('search').addEventListener('input', renderList); $('category').addEventListener('change', renderList);
$('clear-filters').addEventListener('click', () => { $('search').value = ''; $('category').value = 'all'; renderList(); $('search').focus(); });
$('copy-json').addEventListener('click', () => copy(JSON.stringify(mountedDocument, null, 2), 'JSON'));
$('copy-link').addEventListener('click', () => copy(location.href, 'Component link'));
$('reset').addEventListener('click', () => { renderPreview(); toast('Preview reset'); });
$('download-json').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(mountedDocument, null, 2) + '\n'], { type: 'application/json' }));
  const link = node('a'); link.href = url; link.download = `${selected.type}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
$('preview').addEventListener('click', event => {
  // Keep sample links and fabricated third-party video IDs inside the local demo.
  const link = event.target.closest('a[href]');
  const videoLoad = event.target.closest('.iui-youtube-load');
  if (link || videoLoad) {
    event.preventDefault(); event.stopPropagation();
    logEvent(videoLoad ? 'gallery:external-media' : 'gallery:link', { target: link?.getAttribute('href') ?? 'YouTube', handled: 'Kept local in this gallery' });
    toast(videoLoad ? 'Third-party playback is kept off in this gallery.' : 'Sample link captured in Local activity.');
  }
}, true);
for (const event of ['input', 'change', 'click']) $('preview').addEventListener(event, () => requestAnimationFrame(updateState));
window.addEventListener('hashchange', () => { if (catalog) choose(hashType(), { reveal: true }); });
document.addEventListener('keydown', event => {
  if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) { event.preventDefault(); $('search').focus(); }
  if (event.key === 'Escape' && document.activeElement === $('search')) { $('search').value = ''; renderList(); }
});
window.addEventListener('pagehide', () => controller?.dispose());
try {
  const response = await fetch('./catalog.json');
  if (!response.ok) throw Error(`Catalog request failed: ${response.status}`);
  catalog = await response.json();
  $('preview-count').textContent = catalog.renderableCount; $('module-count').textContent = catalog.moduleCount; $('boundary-count').textContent = catalog.rejectedCount;
  for (const group of catalog.groups) { const option = node('option', group.title); option.value = group.id; $('category').append(option); }
  for (const event of catalog.events) $('preview').addEventListener(event, e => {
    // The production video component has an optional canonical-link fallback.
    // Cancel that host action here while preserving the real emitted request.
    if (event === 'iui:video-open') e.preventDefault();
    logEvent(event, e.detail);
  });
  const type = hashType();
  if (!catalog.entries.some(entry => entry.type === type)) { history.replaceState(null, '', '#chart'); choose('chart'); toast('That component was not found. Showing chart.'); }
  else choose(type);
} catch (error) { $('loading').textContent = `The studio could not load: ${error.message}. Start it with npm run showcase.`; }
