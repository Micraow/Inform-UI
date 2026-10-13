import { createIcon } from '../src/icons/index.ts';
import { getIcon } from '../src/icons/all.ts';

/** Search is case-insensitive; upstream names themselves are not renamed. */
export function searchText(icon, categoryLabel) {
  return [icon.name, ...icon.aliases, ...icon.keywords, icon.category, categoryLabel].join(' ').normalize('NFKC').toLowerCase();
}
export function matchesSearch(text, query) {
  return query.normalize('NFKC').toLowerCase().trim().split(/\s+/u).every(token => text.includes(token));
}
export function importExample(icon) {
  return `import { createIcon } from '@micraow/inform-ui/icons';\nimport { ${icon.name} } from '${icon.importSubpath}';\n\ncontainer.append(createIcon(document, ${icon.name}, {\n  size: 24,\n  label: '${icon.name}',\n}));`;
}

export function installIconShowcase(document) {
  const window = document.defaultView;
  const byId = id => document.getElementById(id);
  const catalog = JSON.parse(byId('iui-icon-catalog').textContent);
  const categories = new Map(catalog.categories.map(category => [category.id, category.label]));
  const search = byId('icon-search'), category = byId('icon-category'), grid = byId('icon-grid');
  const dialog = byId('icon-dialog'), preview = byId('icon-preview');
  const buttons = new Map();
  const searchIndex = new Map(catalog.icons.map(icon => [icon.name, searchText(icon, categories.get(icon.category))]));
  let selected = null, previousFocus = null, toastTimer;
  const say = message => {
    if (dialog.open) byId('dialog-status').textContent = message;
    else {
      const toast = byId('toast');
      toast.textContent = message; toast.hidden = false;
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => { toast.hidden = true; }, 3800);
    }
  };
  const download = (value, filename) => {
    const blob = new window.Blob([JSON.stringify(value, null, 2) + '\n'], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = filename;
    document.body.append(anchor); anchor.click(); anchor.remove();
    // Do not revoke until the browser has started consuming the download.
    window.setTimeout(() => window.URL.revokeObjectURL(url), 1500);
    say(`Downloaded ${filename}`);
  };
  const copy = async text => {
    try {
      if (window.navigator.clipboard?.writeText) await window.navigator.clipboard.writeText(text);
      else throw Error('Clipboard unavailable');
      say('Import example copied.');
    } catch {
      // Local file URLs do not always expose the async clipboard API.
      const textarea = document.createElement('textarea');
      textarea.value = text; textarea.setAttribute('aria-label', 'Import example for copying');
      textarea.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0';
      (dialog.open ? dialog : document.body).append(textarea);
      textarea.select();
      let copied = false;
      try { copied = document.execCommand?.('copy') === true; } catch { /* Show manual selection below. */ }
      textarea.remove();
      if (copied) { byId('copy-import').focus(); say('Import example copied.'); }
      else {
        const code = byId('import-example'), range = document.createRange();
        code.parentElement.focus();
        range.selectNodeContents(code);
        const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
        say('Automatic copy is unavailable here. The example is selected; press Ctrl+C or ⌘C to copy.');
      }
    }
  };
  const renderPreview = () => {
    if (!selected) return;
    preview.replaceChildren(createIcon(document, getIcon(selected.name), { size: Number(byId('preview-size').value), label: selected.name }));
    preview.dataset.icon = selected.name;
  };
  const selectIcon = (icon, trigger) => {
    selected = icon;
    previousFocus = trigger ?? document.activeElement;
    byId('icon-title').textContent = icon.name;
    byId('icon-group').textContent = categories.get(icon.category);
    byId('icon-viewbox').textContent = icon.viewBox;
    byId('icon-aliases').textContent = icon.aliases.length ? icon.aliases.join(', ') : 'None';
    byId('icon-keywords').textContent = icon.keywords.join(', ');
    byId('import-example').textContent = importExample(icon);
    byId('icon-source').href = icon.source.url;
    byId('dialog-status').textContent = '';
    renderPreview();
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
    byId('close-icon').focus();
  };
  const filter = () => {
    let count = 0;
    for (const icon of catalog.icons) {
      const show = (category.value === 'all' || category.value === icon.category) && matchesSearch(searchIndex.get(icon.name), search.value);
      buttons.get(icon.name).parentElement.hidden = !show;
      if (show) count++;
    }
    byId('result-count').textContent = `${count} of ${catalog.iconCount} icons`;
    byId('empty-state').hidden = count !== 0;
    byId('clear-filters').hidden = !search.value && category.value === 'all';
    grid.dataset.resultCount = String(count);
  };
  const clearFilters = () => { search.value = ''; category.value = 'all'; filter(); };

  byId('total-count').textContent = String(catalog.iconCount);
  byId('category-count').textContent = String(catalog.categories.length);
  byId('upstream-link').href = catalog.repository;
  byId('commit-link').textContent = catalog.commit;
  byId('commit-link').href = `${catalog.repository}/commit/${catalog.commit}`;
  for (const item of catalog.categories) {
    const option = document.createElement('option');
    option.value = item.id; option.textContent = `${item.label} (${item.count})`; category.append(option);
  }
  const fragment = document.createDocumentFragment();
  for (const icon of catalog.icons) {
    const item = document.createElement('li'), button = document.createElement('button'), name = document.createElement('span');
    button.type = 'button'; button.className = 'icon-card'; button.dataset.icon = icon.name;
    button.setAttribute('aria-haspopup', 'dialog'); button.setAttribute('aria-controls', 'icon-dialog');
    name.className = 'icon-name'; name.textContent = icon.name;
    button.append(createIcon(document, getIcon(icon.name), { size: 28 }), name);
    button.addEventListener('click', () => selectIcon(icon, button));
    item.append(button); fragment.append(item); buttons.set(icon.name, button);
  }
  grid.append(fragment);
  search.addEventListener('input', filter); category.addEventListener('change', filter);
  byId('clear-filters').addEventListener('click', () => { clearFilters(); search.focus(); });
  byId('reset-empty').addEventListener('click', () => { clearFilters(); search.focus(); });
  byId('close-icon').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { if (previousFocus?.isConnected) previousFocus.focus(); });
  byId('preview-size').addEventListener('change', renderPreview);
  byId('copy-import').addEventListener('click', () => { if (selected) void copy(importExample(selected)); });
  byId('download-catalog').addEventListener('click', () => download(catalog, 'inform-ui-icons.catalog.json'));
  byId('download-icon').addEventListener('click', () => {
    if (selected) download({ schemaVersion: 1, repository: catalog.repository, commit: catalog.commit, license: catalog.license, icon: selected, definition: getIcon(selected.name) }, `${selected.name}.icon.json`);
  });
  byId('theme-toggle').addEventListener('click', () => {
    const dark = document.documentElement.dataset.theme !== 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    byId('theme-toggle').setAttribute('aria-pressed', String(dark));
    byId('theme-toggle').setAttribute('aria-label', `Use ${dark ? 'light' : 'dark'} theme`);
  });
  document.addEventListener('keydown', event => {
    if (dialog.open || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
    const isEditing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName ?? '') || document.activeElement?.isContentEditable;
    if (event.key === '/' && !isEditing) { event.preventDefault(); search.focus(); }
    if (event.key === 'Escape' && document.activeElement === search) { event.preventDefault(); clearFilters(); }
  });
  // Native buttons keep standard Tab/Enter/Space behavior; arrows are an optional shortcut.
  grid.addEventListener('keydown', event => {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    const current = event.target.closest('.icon-card');
    if (!current) return;
    const visible = [...buttons.values()].filter(button => !button.parentElement.hidden);
    const at = visible.indexOf(current);
    const columns = Math.max(1, window.getComputedStyle(grid).gridTemplateColumns.split(/\s+/u).length);
    const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: columns, ArrowUp: -columns }[event.key] ?? 0;
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? visible.length - 1 : Math.min(visible.length - 1, Math.max(0, at + step));
    event.preventDefault(); visible[next]?.focus();
  });
  filter();
  document.documentElement.dataset.ready = 'true';
  return { catalog, filter, selectIcon };
}

if (typeof document !== 'undefined' && document.getElementById('iui-icon-catalog')) {
  try { installIconShowcase(document); }
  catch (error) {
    const message = document.getElementById('catalog-error');
    message.hidden = false; message.textContent = `The icon library could not be initialized: ${error.message}`;
    document.getElementById('result-count').textContent = 'Icon library unavailable';
    document.documentElement.dataset.ready = 'error';
  }
}
