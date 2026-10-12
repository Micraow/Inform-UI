import {installSearchOnboardingSchema} from '../../search-onboarding-schema.mjs';
/** Existing maintained contract; source registration only. */
export function install({defs,node,registerDefinedNode}){
installSearchOnboardingSchema({node,defs});
}
