import type { Node, Value } from '../schema/document.js';
import type { Scalar, StateValue } from '../core/index.js';
import type { presentationLabels } from './presentation.js';
export interface FormActionContext { readonly values: Readonly<Record<string,StateValue>>; readonly signal: AbortSignal }
export type FormAction = (context:FormActionContext)=>void|Promise<void>;
export interface RendererContext {
  doc: Document;
  prefix: string;
  labels: ()=>ReturnType<typeof presentationLabels>;
  element: <K extends keyof HTMLElementTagNameMap>(tag:K,cls?:string,value?:unknown)=>HTMLElementTagNameMap[K];
  svg: (tag:string,attrs?:Record<string,unknown>)=>SVGElement;
  on: (target:EventTarget,name:string,listener:EventListener)=>void;
  bind: (fn:()=>void)=>void;
  cleanup: (fn:()=>void)=>void;
  value: (value:Value)=>Scalar;
  display: (value:unknown)=>string;
  showValue: (target:HTMLElement,value:unknown)=>void;
  getState: ()=>Readonly<Record<string,StateValue>>;
  change: (patch:Record<string,StateValue>)=>void;
  fromControl: (patch:Record<string,StateValue>)=>void;
  render: (node:Node)=>HTMLElement|SVGElement;
  actions: Readonly<Record<string,FormAction>>;
}
