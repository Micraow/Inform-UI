import { createViewModules, viewSpecs, viewResources, createCatalog, resources, buildProfile } from '../dist/index.mjs';
export const baseNames=['Code','CodeView','Video','Text','Heading','Badge','Divider','Alert','Table','Stack','Row','Grid','Card','Button','Input','Textarea','Select','RadioGroup','Checkbox','Switch','Slider','BarChart','WeatherCard','Icon','Image'];
// Contract registration fixtures cannot render and NEVER count toward renderer coverage.
export const fixtures=Object.fromEntries([...baseNames,...viewSpecs.map(x=>x.name)].map(name=>[name,{kind:'dom',key:'contract-fixture/'+name,create(){throw Error('Contract-only registration fixture, not a renderer.');}}]));
export function contractProfile(){const modules=[...createCatalog({adapters:fixtures,iconNames:['info']}),...createViewModules({adapters:fixtures})];return buildProfile({id:'inform/view-contracts-validation-only',root:'Stack',modules,select:modules.map(x=>x.id),resources:[...resources,...viewResources]});}
