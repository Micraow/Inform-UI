/** Shared DOM construction for migrated views. Domain layout stays in its adapter. */
export interface ElementBudget {consume(units?:number):void}
const tagClasses:Readonly<Record<string,string>>={button:'if-button',select:'if-select',textarea:'if-textarea',table:'if-table',hr:'if-divider',fieldset:'if-options'};
const classBridge:Readonly<Record<string,string>>={
 'iui-field':'if-field','iui-label':'if-field-label','iui-choice':'if-choice','iui-input':'if-control',
 'iui-select':'if-select','iui-textarea':'if-textarea','iui-btn':'if-button','iui-button':'if-button',
 'iui-badge':'if-badge','iui-divider':'if-divider','iui-icon':'if-icon'
};
const forbidden=new Set(['script','object','embed','iframe']);
export function createFoundationElement<K extends keyof HTMLElementTagNameMap>(document:Document,tag:K,className='',value?:unknown,budget?:ElementBudget):HTMLElementTagNameMap[K]{
 if(forbidden.has(tag))throw new TypeError('Active content requires a separate host capability: '+tag);
 budget?.consume();const element=document.createElement(tag);const classes=new Set(className.split(/\s+/).filter(Boolean));if(tagClasses[tag])classes.add(tagClasses[tag]!);if(tag==='input')classes.add('if-control');for(const name of className.split(/\s+/)){if(classBridge[name])classes.add(classBridge[name]!);}element.className=[...classes].join(' ');if(value!==undefined)element.textContent=value===null?'':String(value);
 if(tag==='button'){(element as HTMLButtonElement).type='button';element.dataset.variant='secondary';}
 return element;
}
/** Literal text/data marks are never guessed into glyphs. Call the icon factory explicitly. */
export const migratedControlCSS=`
.if-root .if-domain .if-control:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=hidden]){font:14px/1.5 var(--if-font);color:var(--if-text);background:var(--if-background);border:1px solid var(--if-border);border-radius:999px;min-height:40px;padding:8px 12px;min-width:0;max-width:100%}
.if-root .if-domain :is(select,textarea,button){font:14px/1.5 var(--if-font)}
.if-root .if-domain label:has(>input:is([type=checkbox],[type=radio])){display:flex;align-items:center;gap:10px;min-height:44px}
.if-root .if-domain input:is([type=checkbox],[type=radio]){appearance:none;flex:none;width:20px;height:20px;min-width:20px;min-height:20px;margin:0;padding:0;border:1.5px solid var(--if-border);border-radius:50%;background:var(--if-background);cursor:pointer}
.if-root .if-domain input[type=radio]:checked{background:var(--if-accent);border-color:var(--if-accent);box-shadow:inset 0 0 0 4px var(--if-background)}
.if-root .if-domain :is(input,textarea,select,button):focus-visible{outline:2px solid var(--if-focus);outline-offset:3px}
.if-root .if-domain :is(input,textarea,select,button):disabled{cursor:not-allowed;color:var(--if-disabled-text);border-color:var(--if-disabled-border)}
.if-root .if-domain :is(input,textarea,select)[aria-invalid=true]{border-color:var(--if-error)}
`;
