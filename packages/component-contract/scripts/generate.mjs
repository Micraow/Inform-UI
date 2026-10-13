import { mkdir, writeFile } from 'node:fs/promises';
import { createCatalog, buildProfile, resources, textAdapter, barChartAdapter } from '../dist/index.mjs';
import { generateArtifacts } from './artifacts.mjs';
// Actual renderer coverage only: no registration-only test fixture enters this output.
const catalog = createCatalog({ adapters: { Text: textAdapter, BarChart: barChartAdapter } });
const text = catalog.find(mod => mod.id === 'base/text').components.find(def => def.name === 'Text');
const modules = catalog.map(mod => mod.id === 'base/text' ? { ...mod, components: [text] } : mod);
const profile = buildProfile({ id: 'inform/representative-2', root: 'BarChart', modules, resources, select: ['base/text','base/charts'] });
await mkdir('generated', { recursive: true });
for (const [filename, content] of Object.entries(generateArtifacts(profile))) await writeFile(`generated/${filename}`, content);
console.log(JSON.stringify({ profile: profile.id, implementedRenderers: Object.keys(profile.components), dataShapes: Object.keys(profile.data), output: 'generated' }));
