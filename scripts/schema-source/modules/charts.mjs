import {string,short,number,bool,integer,choice,array,object,ref,key,color,weight,align,children,scalar} from '../primitives.mjs';
export function install({node,defs}) {
node('chart', { kind: choice('line', 'bar', 'scatter', 'area', 'donut', 'pie'), xKey: short, xScale: choice('category', 'linear', 'time'), xLabel: short, xMin: number, xMax: number, timezone: short, data: array({ type: 'object', additionalProperties: ref('Value') }, 0, 300), series: array(object({ key: short, label: short, color: choice('blue', 'green', 'orange', 'red', 'purple', 'gray') }, ['key', 'label']), 1, 6), yMin: number, yMax: number, unit: string(), title: string(), note: string(), status: choice('ready', 'loading', 'error'), message: string() }, ['kind', 'xKey', 'data', 'series'], 'charts');
}
