import type {OnboardingSelectionNode} from '../schema/document.js';
import type {Issue} from './index.js';
export function inspectOnboarding(n:OnboardingSelectionNode,path:string,add:(issue:Issue)=>void) {
 const maximum=n.maximum??(n.mode==='multiple'?n.options.length:1),minimum=n.minimum??1,ids=new Set<string>();
 n.options.forEach((option,i)=>{if(ids.has(option.id))add({code:'DUPLICATE_ID',path:`${path}/options/${i}/id`,message:'Option IDs must be unique.'});ids.add(option.id);});
 if(maximum>n.options.length)add({code:'ONBOARDING_RANGE',path:`${path}/maximum`,message:'Maximum exceeds the option count.'});
 if(minimum>maximum)add({code:'ONBOARDING_RANGE',path:`${path}/minimum`,message:'Minimum exceeds maximum.'});
 const initial=new Set<string>();(n.initial??[]).forEach((id,i)=>{if(!ids.has(id))add({code:'ONBOARDING_CHOICE',path:`${path}/initial/${i}`,message:'Initial choice must identify a supplied option.'});if(initial.has(id))add({code:'DUPLICATE_ID',path:`${path}/initial/${i}`,message:'Initial choices must be unique.'});initial.add(id);});
 if(initial.size>maximum)add({code:'ONBOARDING_RANGE',path:`${path}/initial`,message:'Initial choices exceed maximum.'});
}
