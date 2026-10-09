// Isolated DOM construction/lifecycle adapter. It is NOT a public validator and
// does not claim candidate-state atomicity; the integration suite tests that.
import { JSDOM } from 'jsdom';
import { evaluateValue } from '../dist/index.js';
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
const fromSource=async name=>{const output=await build({entryPoints:[fileURLToPath(new URL('../src/renderer/'+name,import.meta.url))],bundle:true,write:false,format:'esm',platform:'node',target:'es2022'});return import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].text).toString('base64'));};
const {renderLoading}=await fromSource('loading.ts');
const {loadingEnglish,loadingChinese}=await fromSource('loading-labels.ts');
let instance = 0;
export function setup({ dom = new JSDOM('<!doctype html><html><body></body></html>', {pretendToBeVisual: true}), lang = 'en', theme = 'light', state = {progress: 25, other: 0}, computed = {} } = {}) {
  const doc = dom.window.document, prefix = `test-loading-${++instance}-`;
  const host = doc.createElement('section'); host.lang = lang;
  const root = doc.createElement('article'); root.className = 'iui-root'; root.dataset.theme = theme;
  host.append(root); doc.body.append(host);
  let current = {...state}, bindings = [], disposed = false;
  const metrics = {bindings: 0, valueReads: 0};
  const labels = /^zh(?:-|$)/i.test(lang) ? loadingChinese : loadingEnglish;
  const context = {
    doc,
    element(tag, cls = '', value) { const el = doc.createElement(tag); el.className = cls; if (value !== undefined) el.textContent = String(value); return el; },
    svg(tag, attrs = {}) { const el = doc.createElementNS('http://www.w3.org/2000/svg', tag); for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, String(value)); return el; },
    value(value) { metrics.valueReads++; return evaluateValue(value, current, computed); },
    bind(fn) { fn(); bindings.push(fn); metrics.bindings++; }
  };
  const mount = node => { if (disposed) throw new Error('Disposed'); const out = renderLoading(context, node, labels); out.dataset.iui = node.type; if (node.id) out.id = prefix + node.id; root.append(out); return out; };
  return {doc, dom, root, host, context, metrics, labels, mount,
    // No fake validation: accepted values only, or explicit defensive-guard test.
    refreshWith(patch) { if (disposed) throw new Error('Disposed'); current = {...current, ...patch}; for (const update of bindings) update(); },
    update(nodes) { if (disposed) throw new Error('Disposed'); bindings = []; root.replaceChildren(); return nodes.map(mount); },
    activeBindings() { return bindings.length; },
    dispose() { if (disposed) return; disposed = true; bindings = []; root.replaceChildren(); host.remove(); }
  };
}
