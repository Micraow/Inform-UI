import type {RuntimeSemanticRule} from '@inform/component-contract';
/** Coverage is explicit. Never pretend an unenumerated domain inspector is a complete schema contract. */
export function viewRuntimeRule(oldType:string):RuntimeSemanticRule {
 const rules:Record<string,string>={
  code:'Code is displayed, not executed. Inline code cannot enable copy or highlighting; the data oneOf contains the exact combinations.',
  checklist:'Checklist item IDs must be unique. Each checked value is boolean. Disabled, when supplied, must be an evaluated boolean. The adapter allocates distinct local bindings; they are not external DSL state.',
  blockquote:'A supplied nonempty cite must be a safe HTTP(S), mailto (no query or CR/LF escape), tel, or local #anchor URL. No credentials, whitespace, control characters or backslashes are allowed.',
  citation:'Source url must be an absolute HTTP(S) URL with a hostname, without credentials, whitespace, control characters or backslashes.',
  metric:'No additional cross-field rule beyond the declared data schema and common evaluated disabled/error types.',
  figure:'Children must be actual elements from the selected profile. Data follows its declared schema.',
  section:'Children must be actual elements from the selected profile. Data follows its declared schema.',
  steps:'Each supplied step must satisfy the declared data schema; this view does not execute the steps.',
  math:'The declared data schema applies. Formula rendering is display-only and does not execute JavaScript.',
  details:'Children must be actual elements from the selected profile. Disclosure state is local to the view.',
 };
 const rule=rules[oldType];
 return {id:'domain-'+oldType,paths:['data'],complete:!!rule,rule:rule??'Additional domain-specific runtime checks are present but not yet exhaustively projected. Use the actual runtime to validate the final DSL; JSON Schema alone does not establish validity.'};
}
