import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { SCHEMA_MODULES } from './schema-source/catalog.mjs';
import { buildSelection } from './schema-source/registry.mjs';
import { validateDocument } from '../dist/index.js';

export const groups = [
  { id: 'foundations', title: 'Foundations', categories: ['foundations'] },
  { id: 'forms', title: 'Forms & choices', categories: ['forms', 'choices'] },
  { id: 'content', title: 'Content & discovery', categories: ['content', 'readers', 'citations', 'entities', 'discovery', 'decisions'] },
  { id: 'data', title: 'Charts & graphics', categories: ['charts', 'graphics', 'converters'] },
  { id: 'learning', title: 'Learning & practice', categories: ['learning', 'vocabulary', 'interactions'] },
  { id: 'media', title: 'Images & media', categories: ['media'] },
  { id: 'finance', title: 'Finance snapshots', categories: ['finance'] },
  { id: 'sports', title: 'Sports & results', categories: ['sports', 'results'] },
  { id: 'travel', title: 'Places & plans', categories: ['travel', 'activities', 'reservations', 'weather', 'care'] },
  { id: 'actions', title: 'Actions & onboarding', categories: ['requests', 'context', 'onboarding', 'launchers', 'tasks', 'automation'] },
  { id: 'utilities', title: 'Time & calculators', categories: ['time', 'calculators'] },
  { id: 'compatibility', title: 'Compatibility boundary', categories: ['compatibility'] },
];
const known = new Set(SCHEMA_MODULES.flatMap(module => module.nodeTypes));
export function nodeTypes(value, out = new Set()) {
  if (value && typeof value === 'object') {
    if (known.has(value.type)) out.add(value.type);
    for (const item of Object.values(value)) nodeTypes(item, out);
  }
  return out;
}
const digest = value => createHash('sha256').update(value).digest('hex');
const readJSON = async path => JSON.parse(await readFile(path, 'utf8'));
async function documents(directory) {
  const out = [];
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) out.push(...await documents(path));
    else if (entry.name.endsWith('.json')) {
      const document = await readJSON(path);
      if (document.version === 'iui/1') out.push({ path, document });
    }
  }
  return out;
}
function childNodes(value, out = []) {
  if (value && typeof value === 'object') {
    if (known.has(value.type)) out.push(value);
    for (const item of Object.values(value)) childNodes(item, out);
  }
  return out;
}
function trimDocument(original, body) {
  const doc = { version: original.version, ...(original.state ? { state: original.state } : {}), ...(original.computed ? { computed: original.computed } : {}), body };
  // State is retained intact: submit snapshots and bound sibling controls can depend on it.
  return doc;
}
function notes(type, category, host, includes) {
  const result = [];
  if (type === 'native') return ['Recognized by the structural schema, deliberately rejected by validateDocument. This is an error-boundary example, not a renderer.'];
  if (host !== type) result.push(`Shown inside ${host}; the complete host document is included in the JSON.`);
  if (['grid-item', 'tab-panel', 'field', 'label'].includes(type)) result.push(({ 'grid-item': 'Grid items require a grid parent.', 'tab-panel': 'Tab panels belong inside a tab-group; use its tabs to reveal panels.', field: 'Field grouping preserves its surrounding form when required.', label: 'Labels must target a supported, uniquely identified control in the same document.' })[type]);
  if (['finance', 'sports', 'results', 'weather', 'travel', 'care', 'entities'].includes(category)) result.push('Displayed records are supplied, fictional sample data. No account, market, booking, weather or directory service is connected.');
  if (category === 'calculators') result.push('Software demonstration only. These bounded calculations are not clinically validated and must not guide diagnosis or treatment.');
  if (['requests', 'tasks', 'automation', 'onboarding', 'launchers', 'context', 'reservations'].includes(category)) result.push('Actions produce local intent events. This demo does not send messages, schedule work, book services or grant permissions.');
  if (category === 'media' || includes.some(t => ['youtube', 'search-image'].includes(t))) result.push('Supplied media stays local. Third-party playback is intercepted in this gallery; no video, image-generation or speech service is connected.');
  if (type === 'markdown') result.push('Bounded Markdown subset. Unsupported syntax remains literal; this is not a complete CommonMark renderer.');
  if (['divider', 'spacer', 'loading', 'loading-block', 'pulse-indicator'].includes(type)) result.push('A visual or layout primitive. It has no action of its own.');
  result.push('Changes live in this preview only. Reset restores the supplied JSON.');
  return result;
}
export async function createShowcaseCatalog() {
  const schemaBytes = await readFile('src/schema/iui.schema.json', 'utf8');
  const schema = JSON.parse(schemaBytes);
  const inventory = schema.$defs.Node.oneOf.map(ref => schema.$defs[ref.$ref.slice('#/$defs/'.length)].properties.type.const).sort();
  if (JSON.stringify(inventory) !== JSON.stringify([...known].sort())) throw Error('Catalog and canonical schema disagree.');
  const sources = [...await documents('showcase/examples'), ...await documents('examples')];
  const candidates = new Map();
  for (const { path, document } of sources) {
    if (!validateDocument(document).ok) continue;
    const options = [trimDocument(document, document.body)];
    for (const node of childNodes(document.body)) options.push(trimDocument(document, [node]));
    const seen = new Set();
    for (const option of options) {
      const encoded = JSON.stringify(option);
      if (seen.has(encoded)) continue;
      seen.add(encoded);
      if (!validateDocument(option).ok) continue;
      for (const type of nodeTypes(option)) {
        if (!candidates.has(type)) candidates.set(type, []);
        candidates.get(type).push({ path, document: option, length: encoded.length });
      }
    }
  }
  const entries = [];
  for (const module of SCHEMA_MODULES) for (const type of module.nodeTypes) {
    let chosen;
    if (type === 'native') chosen = { path: module.examplePaths[0], document: await readJSON(module.examplePaths[0]) };
    else {
      const score = candidate => candidate.length + (candidate.path.startsWith('showcase/') ? -2000000 : module.examplePaths.includes(candidate.path) ? -1000000 : 0);
      const all = candidates.get(type)?.sort((a, b) => score(a) - score(b) || a.path.localeCompare(b.path));
      if (!all?.length) throw Error(`No semantically valid example for ${type}`);
      chosen = all[0];
      // Keep the authored chart composition as the visual starting point.
      if (type === 'chart') chosen = { path: 'showcase/examples/chart.json', document: await readJSON('showcase/examples/chart.json') };
    }
    const includes = [...nodeTypes(chosen.document)].sort();
    const requestedModules = SCHEMA_MODULES.filter(m => m.nodeTypes.some(t => includes.includes(t))).map(m => m.id);
    const selection = buildSelection(requestedModules);
    const definition = schema.$defs[schema.$defs.Node.oneOf.find(ref => schema.$defs[ref.$ref.slice('#/$defs/'.length)].properties.type.const === type).$ref.slice('#/$defs/'.length)];
    const host = chosen.document.body[0]?.type;
    entries.push({
      type, category: module.category, group: groups.find(group => group.categories.includes(module.category))?.id,
      moduleId: module.id, moduleTitle: module.title, declaredDependencies: module.dependsOn,
      resolvedModules: selection.manifest.resolvedModules, requiredModules: requestedModules,
      contractPaths: [...new Set([module.contractPath, ...(module.semanticContractPaths ?? [])])],
      sourceExample: chosen.path, status: type === 'native' ? 'rejected' : 'renderable', host, includes,
      requiredFields: definition.required ?? [], properties: Object.keys(definition.properties),
      notes: notes(type, module.category, host, includes), document: chosen.document,
    });
  }
  const eventNames = new Set();
  for (const entry of await readdir('src/renderer')) if (entry.endsWith('.ts')) {
    const source = await readFile(`src/renderer/${entry}`, 'utf8');
    for (const match of source.matchAll(/['"](iui:[a-zA-Z0-9-]+)['"]/g)) eventNames.add(match[1]);
  }
  return {
    format: 'inform-ui-showcase/1', schemaVersion: 'iui/1', schemaSha256: digest(schemaBytes),
    inventoryCount: inventory.length, renderableCount: entries.filter(x => x.status === 'renderable').length,
    rejectedCount: entries.filter(x => x.status === 'rejected').length, moduleCount: SCHEMA_MODULES.length,
    groups, modules: SCHEMA_MODULES.map(({ install, ...metadata }) => metadata),
    events: [...eventNames].sort(), entries,
  };
}
