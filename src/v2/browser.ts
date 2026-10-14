import {createCatalog,resources,buildProfile} from '../../packages/component-contract/src/index';
import {createRuntime} from '../../packages/parser-runtime/src/index';
import {createFoundationAdapters} from './foundation/adapters';
import {getIcon,iconNames} from '../icons/all';
import {mountProfile,type MountOptions} from './host';
import {chartModules,chartResources} from '../../packages/chart-extension/src/eager';
import {chartCSS} from '../../packages/chart-extension/generated/styles';
import {createViewModules,viewResources,viewSpecs,migrationMap,createMigrationCoverage} from '../../packages/view-contracts/src/index';
import {createDomainViewAdapters,domainViewCSS,domainMathCSS,domainViewDescriptors} from '../../packages/domain-view-renderer/src/index';
import {createFoundationElement} from './foundation/bridge';
import {createIcon} from '../icons/create-icon';
import type {InformProfile} from '../../packages/component-contract/src/types';
export {createRuntime,createCatalog,buildProfile,resources,createFoundationAdapters,getIcon,iconNames,createIcon,viewSpecs,migrationMap,createMigrationCoverage};
export {foundationCSS,themeTokens,spacing,radii,controlSizes,typography} from './foundation/tokens';
export {createBaseProfile} from './core';
export const version='2.0.0-alpha.1';
const profileCache=new Map<string,InformProfile&{styleText:string}>();
export interface ProfileSelection {select?:readonly string[];viewNames?:readonly string[]}
export function createProfile(options:ProfileSelection={}){
 // CodeView moved to base/code; explicit pre-migration profile selections remain valid.
 const legacyCode=options.viewNames?.includes('CodeView')||options.select?.includes('views/content');
 if(legacyCode)options={...options,...(options.select?{select:[...new Set([...options.select,'base/code'])]}:{}),...(options.viewNames?{viewNames:options.viewNames.filter(name=>name!=='CodeView')}:{})};
 const key=JSON.stringify({modules:options.select?[...new Set(options.select)].sort():null,views:options.viewNames?[...new Set(options.viewNames)].sort():null});
 if(profileCache.has(key)){const cached=profileCache.get(key)!;profileCache.delete(key);profileCache.set(key,cached);return cached;}
 // Drop the previous profile before allocating a different schema closure.
 profileCache.clear();
 const adapters=createFoundationAdapters({resolveIcon:getIcon});
 const domainAdapters=createDomainViewAdapters({createElement:createFoundationElement,renderIcon:(document,name,options)=>createIcon(document,getIcon(name),{...options,size:typeof options?.size==='number'?options.size:20})});
 const requestedViews=options.viewNames??(options.select?viewSpecs.filter(spec=>options.select!.includes('views/'+spec.family)).map(spec=>spec.name):undefined);
 const modules=[...createCatalog({adapters,iconNames}).filter(m=>!['base/charts','base/chart-data'].includes(m.id)),...chartModules,...createViewModules({adapters:domainAdapters,names:requestedViews})];
 if(legacyCode&&options.select?.includes('views/content')&&!modules.some(m=>m.id==='views/content'))modules.push({id:'views/content',layer:'domain',components:[],dependsOn:['base/code'],runtimeRequires:[]});
 const profile=buildProfile({id:'inform/v2/'+(options.select?.join('+')??'all'),root:'Stack',modules,select:options.select??modules.map(m=>m.id),resources:[...resources.filter(r=>r.id!=='inform/charts'),...chartResources,...viewResources]});
 const result=Object.freeze({...profile,styleText:chartCSS+domainViewCSS+domainMathCSS});profileCache.set(key,result);while(profileCache.size>1)profileCache.delete(profileCache.keys().next().value!);return result;
}
export function createDefaultProfile(){return createProfile();}
export function mount(container:HTMLElement,options:MountOptions&ProfileSelection){
 if(!container||container.nodeType!==1)throw new TypeError('mount requires an HTML element');
 const profile=createProfile({select:options.select,viewNames:options.viewNames}),runtime=createRuntime(profile as any);
 return mountProfile(container,profile,runtime,options);
}
export function prompt(){return createDefaultProfile().prompt({bindings:true,builtinFunctions:true});}
