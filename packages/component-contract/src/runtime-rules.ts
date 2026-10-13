import type {RuntimeSemanticRule,SemanticHook} from './types';

/** Keep a runtime-only relation and its prompt/schema contract beside its hook. */
export function withRuntimeRule(rule:RuntimeSemanticRule,validate:SemanticHook):SemanticHook {
  if(!rule.id||!rule.rule.trim())throw new TypeError('Runtime semantic rules need a stable id and a readable rule.');
  Object.defineProperty(validate,'promptRule',{value:Object.freeze({...rule,paths:Object.freeze([...(rule.paths??[])])}),enumerable:true,writable:false,configurable:false});
  return validate;
}
