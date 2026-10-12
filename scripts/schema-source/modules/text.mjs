import {string,short,number,bool,integer,choice,array,object,ref,key,color,weight,align,children,scalar} from '../primitives.mjs';
export function install({node,defs}) {
const textStyle = { color, weight, align, italic: bool, underline: bool, strike: bool, shimmer: bool };
defs.TextRun = object({ value: ref('Value'), bold: bool, italic: bool, underline: bool, strike: bool, code: bool, href: string(2048, 1) }, ['value']);
node('text', { value: ref('Value'), runs: array(ref('TextRun'), 1, 100), ...textStyle });
defs.TextNode.oneOf = [object(defs.TextNode.properties, ['value']), object(defs.TextNode.properties, ['runs'])];
for (const name of ['title', 'caption']) node(name, { value: ref('Value'), ...textStyle, ...(name === 'title' ? { level: integer(1, 3) } : {}) }, ['value']);

}
