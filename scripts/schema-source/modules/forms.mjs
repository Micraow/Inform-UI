import {string,short,number,bool,integer,choice,array,object,ref,key,color,weight,align,children,scalar} from '../primitives.mjs';
export function install({node,defs}) {
const inputCommon = { label: short, bind: short, hint: string(), error: ref('Value'), required: bool, disabled: ref('Value') };
const inputOptions = array(object({ value: { anyOf: [string(), number] }, label: short, disabled: bool }, ['value', 'label']), 1, 40);
node('input', { ...inputCommon, kind: choice('text', 'number', 'email', 'checkbox', 'date'), minDate: { type: 'string', pattern: '^(?!0000)\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])$' }, maxDate: { type: 'string', pattern: '^(?!0000)\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])$' }, placeholder: string(200), min: number, max: number, step: { ...number, exclusiveMinimum: 0 }, minLength: integer(0, 12000), maxLength: integer(1, 12000) }, ['label', 'bind', 'kind'], 'forms');
// Date-only constraints remain separate from numeric/text constraints in schema and types.
defs.InputNode.oneOf = [
  object({ ...defs.InputNode.properties, kind: { const: 'date' }, ...Object.fromEntries(['placeholder', 'min', 'max', 'step', 'minLength', 'maxLength'].map(name => [name, false])) }),
  object({ ...defs.InputNode.properties, kind: choice('text', 'number', 'email', 'checkbox'), minDate: false, maxDate: false })
];
defs.InputNode.if = { properties: { kind: { const: 'checkbox' } }, required: ['kind'] };
defs.InputNode.then = { properties: Object.fromEntries(['placeholder', 'min', 'max', 'step', 'minLength', 'maxLength'].map(name => [name, false])) };
node('textarea', { ...inputCommon, placeholder: string(200), rows: integer(2, 20), minLength: integer(0, 12000), maxLength: integer(1, 12000) }, ['label', 'bind'], 'forms');
for (const name of ['radio', 'segmented']) node(name, { ...inputCommon, options: inputOptions }, ['label', 'bind', 'options'], 'forms');
node('field', { label: short, hint: string(), children: array(ref('Node'), 1, 20), disabled: ref('Value') }, ['label', 'children'], 'forms');
node('form', { label: short, children, submitLabel: short, cancelLabel: short, action: key, disabled: ref('Value'), successMessage: string(), errorMessage: string() }, ['label', 'children'], 'forms');

}
