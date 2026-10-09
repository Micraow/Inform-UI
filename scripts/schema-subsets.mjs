import { createHash } from 'node:crypto';
import { mkdir, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

// Discovery metadata only. The canonical generator owns every node definition and group assignment.
export const SCHEMA_GROUPS = Object.freeze({
  base: { title: '基础内容、布局与联动控件', examples: ['examples/flight-discovery.json', 'examples/local-places.json', 'examples/decision-cards.json', 'examples/related-questions.json', 'examples/mail-files.json', 'examples/create-interactive-poll.json', 'examples/supplied-trackers.json', 'examples/flight-option.json', 'examples/artist-upcoming-events.json', 'examples/onboarding-selection.json', 'examples/motion.json', 'examples/wifi.json', 'examples/shortlist.json', 'examples/math-fonts.json', 'examples/foundations.json', 'examples/structured-tables.json', 'examples/local-status-primitives.json', 'examples/loading-states.json', 'examples/source-cards.json', 'examples/carousel-basic.json', 'examples/code.json', 'examples/markdown-subset.json', 'examples/tabs.json', 'examples/checklist.json', 'examples/prompt-suggestions.json', 'examples/restaurant-menu.json', 'examples/writing-block.json', 'examples/email-draft.json', 'examples/task-expansion-card.json', 'examples/person-profile.json', 'examples/news-article.json', 'examples/entity-reviews.json', 'examples/restaurant-availability.json', 'examples/location-choice-request.json', 'examples/business-gallery.json', 'examples/reddit-thread-card.json', 'examples/rating.json', 'examples/favicon.json', 'examples/agenda.json', 'examples/button-actions.json'] },
  forms: { title: '表单与字段', examples: ['examples/forms.json', 'examples/overlays.json', 'examples/checkbox-practice.json', 'examples/date-practice.json', 'examples/checklist-form.json', 'examples/field-labels.json'] },
  charts: { title: '通用图表与数值/时间坐标', examples: ['examples/rtt.json', 'examples/numeric-charts.json', 'examples/pie.json'] },
  graphics: { title: '拓扑与受限SVG', examples: ['examples/hpcc.json'] },
  weather: { title: '天气供数视图', examples: ['examples/weather.json'] },
  sports: { title: '体育赛程、记分牌与积分榜', examples: ['examples/sports.json'] },
  learning: { title: '本地学习练习', examples: ['examples/learning.json', 'examples/fill-blank-practice.json', 'examples/sentence-builder.json', 'examples/vocab-card.json'] },
  finance: { title: '金融快照、历史、比较与热图', examples: ['examples/finance-preview.json', 'examples/finance-lists.json'] },
  converters: { title: '单位与汇率换算', examples: ['examples/converters.json'] },
  time: { title: '本地时钟、秒表与倒计时', examples: ['examples/time.json'] },
  compatibility: { title: '仅识别的历史输入边界', examples: [], warning: 'native is structurally recognized but always rejected by validateDocument; it is not a supported renderer.' },
});

export const encodeSchema = value => JSON.stringify(value, null, 2) + '\n';
export function schemaMetrics(text) {
  const codePoints = Array.from(text).length;
  return { utf8Bytes: Buffer.byteLength(text), unicodeCodePoints: codePoints, estimatedTokens: Math.ceil(codePoints / 4), sha256: createHash('sha256').update(text).digest('hex') };
}
function references(value, out = []) {
  if (value && typeof value === 'object') {
    if (Array.isArray(value)) for (const item of value) references(item, out);
    else for (const [key, item] of Object.entries(value)) {
      if (key === '$ref' || key === '$dynamicRef') {
        if (typeof item !== 'string') throw Error('Schema reference must be a string.');
        out.push(item);
      } else references(item, out);
    }
  }
  return out;
}
function pointer(root, reference) {
  if (!reference.startsWith('#/')) throw Error(`Only local JSON-pointer references are supported: ${reference}`);
  let value = root;
  for (const part of decodeURIComponent(reference.slice(2)).split('/').map(x => x.replaceAll('~1', '/').replaceAll('~0', '~'))) {
    if (!value || typeof value !== 'object' || !Object.hasOwn(value, part)) throw Error(`Unresolved schema reference: ${reference}`);
    value = value[part];
  }
  return value;
}
export function assertClosedReferences(schema) { for (const reference of references(schema)) pointer(schema, reference); }
export function nodeInventory(full) {
  return full.$defs.Node.oneOf.map(reference => {
    const node = pointer(full, reference.$ref), type = node?.properties?.type?.const;
    if (typeof type !== 'string') throw Error('Each Node alternative must reference a definition with a constant type.');
    return { type, reference };
  });
}
export function assertOwners(full, owners) {
  const inventory = nodeInventory(full), types = inventory.map(item => item.type);
  if (new Set(types).size !== types.length) throw Error('Duplicate node type in full schema.');
  if (types.length !== Object.keys(owners).length || types.some(type => !Object.hasOwn(owners, type)) || Object.keys(owners).some(type => !types.includes(type))) throw Error('Every full-schema node needs exactly one owner group.');
  for (const group of Object.values(owners)) if (!Object.hasOwn(SCHEMA_GROUPS, group)) throw Error(`Unknown owner group: ${group}`);
  return inventory;
}

/** Prune the canonical schema, changing only the permitted Node union and descriptive identity. */
export function createSchemaSubset(full, owners, groups, { rootKind = 'document' } = {}) {
  if (!['document', 'node'].includes(rootKind)) throw Error('rootKind must be document or node.');
  if (!Array.isArray(groups) || !groups.length) throw Error('Select at least one schema group.');
  for (const group of groups) if (!Object.hasOwn(SCHEMA_GROUPS, group)) throw Error(`Unknown schema group: ${group}`);
  const requested = new Set(groups), included = Object.keys(SCHEMA_GROUPS).filter(group => requested.has(group));
  const inventory = assertOwners(full, owners), selected = inventory.filter(item => requested.has(owners[item.type]));
  if (!selected.length) throw Error('Selected groups contain no nodes.');
  const definitions = { ...full.$defs, Node: { ...full.$defs.Node, oneOf: selected.map(item => structuredClone(item.reference)) } };
  const schema = rootKind === 'document' ? structuredClone(full) : { $schema: full.$schema, $ref: '#/$defs/Node' };
  delete schema.$defs;
  schema.$id = `urn:micraow:inform-ui:schema:iui:1:${schemaMetrics(encodeSchema(full)).sha256}:${rootKind}:${included.join('+')}`;
  schema.title = `Inform UI ${rootKind} subset: ${included.join(', ')}`;
  schema.description = rootKind === 'document'
    ? 'Document structural subset. Other node types are intentionally excluded. Always run the full validateDocument for semantic validation.'
    : 'Node structural subset for field lookup, not a Document schema. Use the corresponding Document bundle or a union for authored pages.';
  const needed = new Set(), queue = references(schema);
  while (queue.length) {
    const reference = queue.pop(), match = /^#\/\$defs\/([^/]+)(?:\/.*)?$/.exec(reference);
    if (!match) throw Error(`Unsupported non-definition reference: ${reference}`);
    const name = decodeURIComponent(match[1]).replaceAll('~1', '/').replaceAll('~0', '~');
    if (!Object.hasOwn(definitions, name)) throw Error(`Unresolved schema reference: ${reference}`);
    if (needed.has(name)) continue;
    needed.add(name);
    queue.push(...references(definitions[name]));
  }
  schema.$defs = Object.fromEntries([...needed].sort().map(name => [name, structuredClone(definitions[name])]));
  assertClosedReferences(schema);
  return schema;
}

export async function assertSchemaDirectoryContents(directory, { complete = false } = {}) {
  const expected = new Set(['index.json', ...Object.keys(SCHEMA_GROUPS).flatMap(id => [`${id}.schema.json`, `nodes/${id}.schema.json`])]), found = new Set();
  const walk = async relative => {
    for (const entry of await readdir(join(directory, relative), { withFileTypes: true })) {
      const name = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isDirectory() && name === 'nodes') await walk(name);
      else if (entry.isFile() && expected.has(name)) found.add(name);
      else throw Error(`Unexpected generated schema entry: ${name}`);
    }
  };
  await walk('');
  if (complete) for (const name of expected) if (!found.has(name)) throw Error(`Missing generated schema entry: ${name}`);
}

export async function emitSchemaSubsets(full, owners, directory) {
  assertOwners(full, owners); assertClosedReferences(full);
  await mkdir(join(directory, 'nodes'), { recursive: true });
  await assertSchemaDirectoryContents(directory);
  const index = {
    schemaVersion: 'iui/1', format: 'inform-ui-schema-index/1',
    fullSchema: { path: '../iui.schema.json', ...schemaMetrics(encodeSchema(full)) },
    semantics: 'All bundles perform structural validation only. The unchanged full validateDocument also checks state references, ranges, dates, URLs, native rejection and other semantic rules.',
    tokenEstimateMethod: 'ceil(Unicode code points / 4), a rough model-independent heuristic; not measured model tokens or a guaranteed saving.',
    recommendedForAuthoring: 'Use groups[].documentSchema. Node files are field-lookup subsets; recursive Node children are limited to the owned group and document state is absent.',
    examplesBase: 'Paths are relative to this CDN index URL; repositoryPath is supplied for local checkouts.',
    nodeOwners: Object.fromEntries(Object.entries(owners).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)),
    nodeSupportExceptions: { native: 'rejected' }, nodeSupportNotes: { markdown: 'Bounded original Markdown subset, not CommonMark; unsupported syntax remains literal.' }, groups: [],
  };
  for (const [id, metadata] of Object.entries(SCHEMA_GROUPS)) {
    const includedGroups = id === 'base' ? ['base'] : ['base', id];
    const document = createSchemaSubset(full, owners, includedGroups), node = createSchemaSubset(full, owners, [id], { rootKind: 'node' });
    const documentText = encodeSchema(document), nodeText = encodeSchema(node), path = `${id}.schema.json`, nodePath = `nodes/${id}.schema.json`;
    await writeFile(join(directory, path), documentText); await writeFile(join(directory, nodePath), nodeText);
    index.groups.push({
      id, title: metadata.title, includedGroups,
      ownedNodeTypes: nodeInventory(full).filter(item => owners[item.type] === id).map(item => item.type),
      documentSchema: { path, rootKind: 'document', ...schemaMetrics(documentText) },
      nodeSchema: { path: nodePath, rootKind: 'node', ...schemaMetrics(nodeText) },
      examples: metadata.examples.map(repositoryPath => ({ path: `../../${repositoryPath}`, repositoryPath })),
      ...(metadata.warning ? { warning: metadata.warning } : {}),
    });
  }
  await writeFile(join(directory, 'index.json'), encodeSchema(index));
  await assertSchemaDirectoryContents(directory, { complete: true });
  return index;
}
