import {string,short,number,bool,integer,choice,array,object,ref,key,color,weight,align,children,scalar} from '../primitives.mjs';
export function install({node,defs}) {
defs.Value = { oneOf: [string(), number, bool, { type: 'null' }, object({ $: { ...key, minLength: 1 } }, ['$']), object({ op: choice('add', 'sub', 'mul', 'div', 'max', 'min', 'round', 'abs', 'clamp', 'gt', 'lt', 'eq', 'if', 'format'), args: array(ref('Value'), 1, 12) }, ['op', 'args'])] };

}
