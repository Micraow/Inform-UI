import {object,number,short,string,array,ref,choice,integer,bool,key,color,weight,align,children} from '../primitives.mjs';
/** Existing maintained contract; source registration only. */
export function install({defs,node,registerDefinedNode}){
node('svg', { viewBox: { type: 'string', pattern: '^\\d+\\s+\\d+\\s+\\d+\\s+\\d+$' }, shapes: array(object({ tag: choice('rect', 'line', 'circle', 'path', 'text', 'polyline', 'polygon'), attrs: { type: 'object', maxProperties: 24, additionalProperties: { anyOf: [string(), number] } }, text: string() }, ['tag', 'attrs']), 1, 150), label: string() }, ['viewBox', 'shapes'], 'graphics');
}
