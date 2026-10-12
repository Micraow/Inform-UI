import {string,short,number,bool,integer,choice,array,object,ref,key,color,weight,align,children,scalar} from '../primitives.mjs';
export function install({node,defs}) {
node('topology', { nodes: array(object({ id: short, label: short, subtitle: string() }, ['id', 'label']), 2, 24), links: array(object({ from: short, to: short, label: string(), load: ref('Value') }, ['from', 'to']), 1, 40), highlight: choice('max-load', 'none'), caption: string() }, ['nodes', 'links'], 'graphics');
}
