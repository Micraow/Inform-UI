import type { IconDefinition, IconOptions, IconShape, IconAttributes } from './types.js';
import { validateIconDefinition, validateOptions, validateSize } from './svg-policy.mjs';
const SVG_NS = 'http://www.w3.org/2000/svg';
const documentCounters = new WeakMap<Document, number>();

/** Construct safe native SVG in the caller's document. No React or network calls. */
export function createIcon(document: Document, definition: IconDefinition, options: IconOptions = {}): SVGSVGElement {
  const localIds = validateIconDefinition(definition);
  validateOptions(options);
  const remapped = new Map<string,string>();
  if (localIds.size) {
    let count = documentCounters.get(document) ?? 0;
    do { count++; } while ([...localIds].some(id=>document.getElementById(`iui-icon-${count}-${id}`)));
    documentCounters.set(document,count);
    for (const id of localIds) remapped.set(id,`iui-icon-${count}-${id}`);
  }
  const setAttrs = (element: SVGElement, attrs: IconAttributes) => {
    for (const [key,value] of Object.entries(attrs)) {
      const safe = key === 'id' ? remapped.get(value)! : key === 'clip-path' ? `url(#${remapped.get(value.slice(5,-1))!})` : value;
      element.setAttribute(key,safe);
    }
  };
  const element = document.createElementNS(SVG_NS,'svg');
  setAttrs(element,definition.attrs);
  const size = validateSize(options.size ?? '1em');
  element.setAttribute('width',size); element.setAttribute('height',size);
  element.setAttribute('class',[definition.attrs.class,'iui-official-icon',options.className].filter(Boolean).join(' '));
  element.setAttribute('focusable','false');
  element.setAttribute('data-iui-icon',definition.name);
  if (options.label !== undefined) { element.setAttribute('role','img'); element.setAttribute('aria-label',options.label); }
  else element.setAttribute('aria-hidden','true');
  const append = (parent: SVGElement, shapes: readonly IconShape[]) => {
    for (const [tag,attrs,children] of shapes) {
      const child = document.createElementNS(SVG_NS,tag);
      setAttrs(child,attrs);
      if (children) append(child,children);
      parent.append(child);
    }
  };
  append(element,definition.shapes);
  return element;
}
