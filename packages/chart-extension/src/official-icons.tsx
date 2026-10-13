import React from 'react';
import {ChevronDown as down} from '@inform/official-icons/ChevronDown';
import {ChevronUp as up} from '@inform/official-icons/ChevronUp';
import {ChevronLeft as left} from '@inform/official-icons/ChevronLeft';
import {ChevronRight as right} from '@inform/official-icons/ChevronRight';
// Geometry is imported verbatim from the host's one canonical 755-icon registry.
// The bridge only converts inert SVG attribute spelling into React attributes.
const reactAttrs=(attrs:Readonly<Record<string,string>>)=>Object.fromEntries(Object.entries(attrs).map(([k,v])=>[k.replace(/-([a-z])/g,(_,c:string)=>c.toUpperCase()),v]));
function icon(definition:typeof down|typeof up|typeof left|typeof right){return function OfficialChartIcon(props:React.SVGProps<SVGSVGElement>){return <svg {...reactAttrs(definition.attrs)} {...props} aria-hidden="true" focusable="false" data-official-icon={definition.name}>{definition.shapes.map(([tag,attrs],i)=>React.createElement(tag,{...reactAttrs(attrs),key:i}))}</svg>;};}
export const ChevronDown=icon(down),ChevronUp=icon(up),ChevronLeft=icon(left),ChevronRight=icon(right);
export const ChevronDownIcon=ChevronDown,ChevronUpIcon=ChevronUp;
