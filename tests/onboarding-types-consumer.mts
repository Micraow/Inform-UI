import type {Node,OnboardingChoiceDetail} from '../dist/index.js';
const good:Node={type:'onboarding-selection',label:'Select',options:[{id:'a',label:'A'},{id:'b',label:'B'}],mode:'multiple',minimum:0,maximum:2};
// @ts-expect-error Single-selection maximum cannot be two.
const wrong:Node={type:'onboarding-selection',label:'Bad',options:[{id:'a',label:'A'},{id:'b',label:'B'}],mode:'single',maximum:2};
const detail:OnboardingChoiceDetail={componentId:null,selectedIds:['a']};
// @ts-expect-error An integration listener must not mutate the shared event payload.
detail.selectedIds.push('b');
void good;void wrong;
