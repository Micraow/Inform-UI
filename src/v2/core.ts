import {createCatalog,resources,buildProfile} from '../../packages/component-contract/src/index';
import {createRuntime} from '../../packages/parser-runtime/src/index';
import {createFoundationAdapters} from './foundation/adapters';
import {getIcon,iconNames} from '../icons/all';
import {mountProfile,type MountOptions} from './host';
export {createRuntime,createCatalog,buildProfile,resources,createFoundationAdapters,getIcon,iconNames};
export {foundationCSS,themeTokens,spacing,radii,controlSizes} from './foundation/tokens';
export const version='2.0.0-alpha.1';
export function createBaseProfile(){
 const adapters=createFoundationAdapters({resolveIcon:getIcon});
 const modules=createCatalog({adapters,iconNames});
 // Native chart reference reuses the registered accessible Table.
 const resolved=modules.map(module=>module.id==='base/charts'?{...module,dependsOn:[...module.dependsOn,'base/text']}:module);
 return buildProfile({id:'inform/base-v2',root:'Stack',modules:resolved,select:['base/text','base/icon','base/media','base/layout','base/controls','base/charts','domain/weather'],resources});
}
export function mount(container:HTMLElement,options:MountOptions){
 if(!container||container.nodeType!==1)throw new TypeError('mount requires an HTML element');
 const profile=createBaseProfile(),runtime=createRuntime(profile as any);
 return mountProfile(container,profile,runtime,options);
}
export function prompt(){return createBaseProfile().prompt({bindings:true,builtinFunctions:true});}
