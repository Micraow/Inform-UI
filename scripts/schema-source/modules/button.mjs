import {string,short,number,bool,integer,choice,array,object,ref,key,color,weight,align,children,scalar} from '../primitives.mjs';
export function install({node,defs}) {
defs.ButtonAction = { oneOf: [
  object({ kind: { const: 'reset' } }, ['kind']),
  object({ kind: { const: 'set' }, bind: short, value: scalar }, ['kind','bind','value']),
  object({ kind: { const: 'host' }, name: key }, ['kind','name'])
] };
node('button', { label: short, action: ref('ButtonAction'), disabled: ref('Value'), tone: choice('default','primary','danger'), hint: string(1000) }, ['label','action']);

}
