import {string,short,number,bool,integer,choice,array,object,ref,key,color,weight,align,children,scalar} from '../primitives.mjs';
export function install({node,defs}) {
node('markdown', { value: string() }, ['value']);
node('writing-block', { label: short, value: string(), editable: bool, note: string(1000) }, ['label','value']);
// Original supplied envelope and local plan review; no services or execution.
node('email-draft', { label:short, subject:string(300), body:string(), to:array(string(320,1),0,20), cc:array(string(320,1),0,20), note:string(1000), editable:bool }, ['label','subject','body','to']);
defs.TaskReviewStep = object({id:key,title:short,description:string(2000),details:string(6000),reviewed:bool}, ['id','title']);
node('task-expansion-card', {title:short,summary:string(2000),steps:array(ref('TaskReviewStep'),1,20),disabled:ref('Value')}, ['title','steps']);
node('code', { value: string(), language: short, inline: bool, copy: bool, highlight: bool, showLanguage: bool }, ['value']);
// Inline code cannot opt into block controls. Keep exact disjoint structural
// branches so validator, generated public types and all domain subsets agree.
defs.CodeNode.oneOf = [
  object({ ...defs.CodeNode.properties, inline: { const: true }, copy: { const: false }, highlight: { const: false }, showLanguage: { const: false } }, ['inline']),
  object({ ...defs.CodeNode.properties, inline: { const: false } })
];
node('math', { latex: string(6000, 1), block: bool }, ['latex']);
node('badge', { value: ref('Value'), color }, ['value']);
node('divider');
node('spacer', { height: integer(0, 200) });

}
