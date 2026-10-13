import {JSDOM} from 'jsdom';
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';

const base = fileURLToPath(new URL('../', import.meta.url));
const bundled = await build({stdin: {contents: "export {renderAutomation} from './src/renderer/automation.ts'; export {renderGeneration} from './src/renderer/generation.ts';", resolveDir: base}, bundle: true, write: false, format: 'esm', platform: 'node', target: 'es2022'});
const {renderAutomation, renderGeneration} = await import('data:text/javascript;base64,' + Buffer.from(bundled.outputFiles[0].text).toString('base64'));

export const plan = (patch = {}) => ({type: 'automation-plan-summary', id: 'sample-plan', label: 'Supplied plan', title: 'Prepare a field guide', goalLabel: 'Your plan', showPlanLabel: 'Show plan', hidePlanLabel: 'Hide plan', showCompletedLabel: 'Show completed steps', statusLabels: {completed: 'Completed', in_progress: 'In progress', pending: 'Pending'}, steps: [{id: 'scope', title: 'Select a topic', status: 'completed'}, {id: 'notes', title: 'Gather notes', status: 'completed'}, {id: 'draft', title: 'Draft the guide', status: 'in_progress'}, {id: 'review', title: 'Review the draft', status: 'pending'}], ...patch});
export const tick = async () => {for (let i = 0; i < 5; i++) await Promise.resolve();};

export function setup(node = plan()) {
  const dom = new JSDOM('<!doctype html><form><main></main></form>', {url: 'https://example.test/', pretendToBeVisual: true});
  const win = dom.window, doc = win.document, host = doc.querySelector('main'), form = doc.querySelector('form'), bindings = new Set();
  let life, stopped = false, current, id = 0;
  function update(value) {
    const old = life, generation = renderGeneration(() => !stopped && life === generation);
    life = generation; old?.dispose();
    const context = {
      doc, prefix: 'automation-test', lifecycle: generation,
      allocateInternalId: role => 'automation-' + role + '-' + (++id),
      element(tag, className = '', value) {const el = doc.createElement(tag); el.className = className; if (value !== undefined) el.textContent = String(value); return el;},
      svg(tag, attributes = {}) {const el = doc.createElementNS('http://www.w3.org/2000/svg', tag); for (const [key, value] of Object.entries(attributes)) el.setAttribute(key, String(value)); return el;},
      on: generation.listen, cleanup: generation.own,
      bind(fn) {bindings.add(fn); return generation.own(() => bindings.delete(fn));}
    };
    current = generation.during(() => renderAutomation(context, value));
    const owner = doc.createElement('article'); owner.className = 'iui-root'; owner.append(current); host.replaceChildren(owner);
    for (const fn of [...bindings]) fn();
    return current;
  }
  update(node);
  return {dom, win, doc, host, form, update, get root() {return current;}, dispose() {if (stopped) return; stopped = true; life.dispose(); host.replaceChildren();}, close() {this.dispose(); win.close();}};
}
