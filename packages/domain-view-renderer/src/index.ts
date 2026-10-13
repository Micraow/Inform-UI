import descriptors from '../generated/descriptors.json';
import {renderDomainView} from './runtime.js';
import type {DomainAdapter,DomainOptions,ViewDescriptor,DomainContext} from './types.js';
export * from './types.js';
export {domainViewCSS} from './styles.js';
export {default as domainMathCSS} from './math.css';
export const domainViewDescriptors=Object.freeze(descriptors);
export function createDomainViewAdapters(options:DomainOptions={}):Readonly<Record<string,DomainAdapter>> {
 const registry:Record<string,DomainAdapter>=Object.create(null);
 for(const descriptor of (options.descriptors??descriptors) as unknown as ViewDescriptor[]){
  registry[descriptor.name]=Object.freeze({kind:'dom',key:descriptor.name,create(props:Record<string,unknown>,context:DomainContext){return renderDomainView(descriptor,props,context,options);}});
 }
 return Object.freeze(registry);
}

export {applyDomainResourcePolicy} from './resource-policy.js';
