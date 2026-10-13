/** Shared build/runtime allowlist. Source code is parsed as data, never evaluated. */
export const jsxAttributeNames = Object.freeze({fillRule: 'fill-rule', clipRule: 'clip-rule', strokeWidth: 'stroke-width', strokeLinecap: 'stroke-linecap', strokeLinejoin: 'stroke-linejoin', clipPath: 'clip-path', className: 'class'});
const number = '[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][+-]?\\d+)?';
const numeric = new RegExp('^' + number + '$');
const numbers = new RegExp('^' + number + '(?:[ ,]+' + number + ')*$');
const presentation = ['fill','stroke','stroke-width','stroke-linecap','stroke-linejoin','fill-rule','clip-rule','opacity','transform'];
const allowed = Object.freeze({svg: new Set(['width','height','viewBox','class',...presentation]), path: new Set(['d','clip-path',...presentation]), rect: new Set(['width','height','x','y','rx',...presentation]), circle: new Set(['cx','cy','r',...presentation]), g: new Set(['clip-path',...presentation]), defs: new Set(), clipPath: new Set(['id'])});
const numericAttrs = new Set(['x','y','cx','cy','r','rx','opacity','stroke-width']);
function fail(message) { throw new TypeError('Unsafe or unsupported icon: ' + message); }
function record(value, label) {
  if (!value || typeof value !== 'object' || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) fail(label);
  for (const key of Reflect.ownKeys(value)) { if (typeof key !== 'string') fail(label); const d = Object.getOwnPropertyDescriptor(value,key); if (!d || !Object.hasOwn(d,'value')) fail('accessor'); }
}
export function validateSize(size) {
  if (typeof size === 'number') { if (!Number.isFinite(size) || size <= 0 || size > 4096) fail('size'); return String(size); }
  if (typeof size !== 'string' || !/^(?:\d+(?:\.\d+)?|\.\d+)(?:px|em|rem|%)?$/.test(size) || parseFloat(size) <= 0 || parseFloat(size) > 4096) fail('size');
  return size;
}
export function validateOptions(options) {
  record(options, 'options');
  for (const key of Object.keys(options)) if (!['size','label','className'].includes(key)) fail('option ' + key);
  if (options.size !== undefined) validateSize(options.size);
  if (options.label !== undefined && (typeof options.label !== 'string' || !options.label.trim() || options.label.length > 4096 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(options.label))) fail('label');
  if (options.className !== undefined && (typeof options.className !== 'string' || options.className.length > 1024 || /[\u0000-\u001f]/.test(options.className))) fail('className');
}
export function validateAttributes(tag, attrs, ids, references) {
  record(attrs, 'attributes');
  if (!Object.hasOwn(allowed, tag)) fail('element ' + tag);
  for (const [key,value] of Object.entries(attrs)) {
    if (!allowed[tag].has(key) || typeof value !== 'string' || value.length > 100000) fail('attribute ' + key);
    if (key === 'viewBox') { const vals = value.split(/[ ,]+/).map(Number); if (!numbers.test(value) || vals.length !== 4 || vals.some(v=>!Number.isFinite(v)) || vals[2] <= 0 || vals[3] <= 0) fail('viewBox'); }
    else if (key === 'width' || key === 'height') { if (tag === 'svg') validateSize(value); else if (!numeric.test(value) || !Number.isFinite(Number(value)) || Number(value) < 0) fail(key); }
    else if (numericAttrs.has(key)) { if (!numeric.test(value) || !Number.isFinite(Number(value)) || (['r','rx','stroke-width'].includes(key) && Number(value)<0) || (key==='opacity' && (Number(value)<0 || Number(value)>1))) fail(key); }
    else if (key === 'fill' || key === 'stroke') { if (!/^(?:currentColor|none|black|white|#[\da-fA-F]{3,8}|var\(--green-500\))$/.test(value)) fail('paint'); }
    else if (key === 'fill-rule' || key === 'clip-rule') { if (!['evenodd','nonzero'].includes(value)) fail(key); }
    else if (key === 'stroke-linecap') { if (!['round','butt','square'].includes(value)) fail(key); }
    else if (key === 'stroke-linejoin') { if (!['round','miter','bevel'].includes(value)) fail(key); }
    else if (key === 'd') { if (!value || !/^[MmZzLlHhVvCcSsQqTtAaEe0-9+.,\s-]+$/.test(value)) fail('path'); }
    else if (key === 'class') { if (!/^[a-zA-Z0-9_-]+(?: [a-zA-Z0-9_-]+)*$/.test(value)) fail('class'); }
    else if (key === 'transform') { if (!/^translate\([\d.eE+ ,\-]+\)$/.test(value) || !numbers.test(value.slice(10,-1)) || ![1,2].includes(value.slice(10,-1).split(/[ ,]+/).length) || value.slice(10,-1).split(/[ ,]+/).some(v=>!Number.isFinite(Number(v)))) fail('transform'); }
    else if (key === 'id') { if (!/^[a-zA-Z_][\w-]*$/.test(value) || ids.has(value)) fail('local id'); ids.add(value); }
    else if (key === 'clip-path') { const match = /^url\(#([a-zA-Z_][\w-]*)\)$/.exec(value); if (!match) fail('clip reference'); references.add(match[1]); }
  }
}
export function validateIconDefinition(definition) {
  record(definition, 'definition');
  if (Object.keys(definition).some(key=>!['name','attrs','shapes'].includes(key)) || typeof definition.name !== 'string' || !/^[A-Z][A-Za-z0-9]*$/.test(definition.name)) fail('definition name');
  const ids = new Set(), references = new Set();
  validateAttributes('svg', definition.attrs, ids, references);
  if (!Object.hasOwn(definition.attrs,'viewBox')) fail('missing viewBox');
  let count = 0;
  function visit(shapes, parent, depth) {
    if (!Array.isArray(shapes) || depth > 8) fail('shape tree');
    for (const shape of shapes) {
      if (!Array.isArray(shape) || shape.length < 2 || shape.length > 3 || ++count > 1000) fail('shape');
      const [tag,attrs,children] = shape;
      if (typeof tag !== 'string' || tag === 'svg') fail('shape tag');
      if ((tag==='defs' && parent!=='svg') || (tag==='clipPath' && parent!=='defs') || (parent==='defs' && tag!=='clipPath')) fail('shape nesting');
      validateAttributes(tag,attrs,ids,references);
      if (tag==='clipPath' && !Object.hasOwn(attrs,'id')) fail('clip id');
      if (children !== undefined) { if (!['defs','clipPath','g'].includes(tag)) fail('leaf children'); visit(children,tag,depth+1); }
      if (['defs','clipPath'].includes(tag) && !children?.length) fail('empty definition');
    }
  }
  visit(definition.shapes, 'svg', 0);
  if (!count) fail('empty icon');
  for (const reference of references) if (!ids.has(reference)) fail('missing clip target');
  return ids;
}
