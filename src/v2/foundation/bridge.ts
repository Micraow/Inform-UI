/** Shared DOM construction for migrated views. Domain layout stays in its adapter. */
export interface ElementBudget {consume(units?:number):void}
const tagClasses:Readonly<Record<string,string>>={button:'if-control-button',select:'if-select',textarea:'if-textarea',table:'if-table',hr:'if-divider',fieldset:'if-options'};
const classBridge:Readonly<Record<string,string>>={
 'iui-field':'if-field','iui-label':'if-field-label','iui-choice':'if-choice','iui-input':'if-control',
 'iui-select':'if-select','iui-textarea':'if-textarea','iui-btn':'if-button','iui-button':'if-button',
 'iui-badge':'if-badge','iui-divider':'if-divider','iui-icon':'if-icon'
};
const cardButtons=new Set(['iui-onboarding-feature','iui-automation-card','iui-weather-day','iui-weather-day-button','iui-follow-up-card','iui-task-expansion-card','iui-async-image-hit','iui-image-grid-open']);
const rowButtons=new Set(['iui-automation-list-item','iui-automation-view-all','iui-onboarding-benefit','iui-onboarding-task-button','iui-conversation-suggestion','iui-learning-choice','iui-quiz-option','iui-homework-choice','iui-location-choice-option','iui-transaction-detail-related-item']);
const forbidden=new Set(['script','object','embed','iframe']);
export function createFoundationElement<K extends keyof HTMLElementTagNameMap>(document:Document,tag:K,className='',value?:unknown,budget?:ElementBudget):HTMLElementTagNameMap[K]{
 if(forbidden.has(tag))throw new TypeError('Active content requires a separate host capability: '+tag);
 budget?.consume();const element=document.createElement(tag);const classes=new Set(className.split(/\s+/).filter(Boolean));if(tagClasses[tag])classes.add(tagClasses[tag]!);if(tag==='input')classes.add('if-control');for(const name of className.split(/\s+/)){if(classBridge[name])classes.add(classBridge[name]!);}element.className=[...classes].join(' ');if(value!==undefined)element.textContent=value===null?'':String(value);
 if(tag==='button'){(element as HTMLButtonElement).type='button';const names=className.split(/\s+/);const role=names.some(name=>cardButtons.has(name))?'card':names.some(name=>rowButtons.has(name))?'row':names.some(name=>/(?:^iui-(?:btn|button)(?:-(?:primary|secondary|destructive))?$|-(?:reset|submit|cancel|confirm|connect|continue|next|previous|copy|search|clear|prepare|undo|play|pause|stop|load|unload)$)/.test(name))?'action':'plain';element.dataset.controlRole=role;if(role==='action')element.classList.add('if-button');else element.classList.add('if-click-'+role);element.dataset.variant=names.includes('iui-button-primary')?'primary':names.includes('iui-button-destructive')?'destructive':'secondary';}
 return element;
}
/** Literal text/data marks are never guessed into glyphs. Call the icon factory explicitly. */
export const migratedControlCSS=`
.if-root .if-domain .if-control-button{font:inherit;cursor:pointer;max-width:100%;min-width:0}
.if-root .if-domain .if-click-plain{color:inherit;appearance:none;background:transparent;border:0;border-radius:0}
.if-root .if-domain .if-click-card{color:inherit;appearance:none;border:1px solid var(--if-border);border-radius:16px;background:var(--if-surface);padding:16px;text-align:start;white-space:normal;min-height:44px;overflow-wrap:anywhere}
.if-root .if-domain .if-click-row{color:inherit;appearance:none;border:0;border-radius:0;background:transparent;padding:12px 16px;text-align:start;white-space:normal;min-height:44px;overflow-wrap:anywhere}
.if-root .if-domain :is(.if-click-card,.if-click-row):hover{background:var(--if-hover)}
.if-root .if-domain :is(.if-click-card,.if-click-row):active{background:var(--if-pressed)}
.if-root .if-domain :is(.if-click-card,.if-click-row):focus-visible{outline-offset:-3px}
.if-root .if-domain :is(pre,code,kbd,samp){font-family:var(--if-mono);font-style:normal;tab-size:2}
.if-root .if-domain pre{box-sizing:border-box;min-width:0;max-width:100%;overflow:auto;white-space:pre;font-size:13px;line-height:1.65;border-radius:12px;padding:16px;background:var(--if-surface);color:var(--if-text)}
.if-root .if-domain .iui-heatmap-filter{display:grid;grid-template-columns:max-content minmax(0,1fr);gap:8px;align-items:center}
.if-root .if-domain .iui-heatmap-filter select{width:100%;min-width:0}
.if-root .if-domain .iui-automation-copy{gap:4px}
.if-root .if-domain :is(.iui-automation-title,.iui-automation-schedule){white-space:normal;overflow-wrap:anywhere}
.if-root .if-domain .iui-onboarding-feature{align-items:stretch;justify-content:flex-start}
.if-root .if-domain .iui-onboarding-feature-art{min-height:96px;flex:0 0 auto}
.if-root .if-domain .iui-onboarding-benefits{gap:8px}
.if-root .if-domain .iui-onboarding-benefit{padding:12px 16px;border-radius:12px;background:var(--if-surface)}

.if-root .if-domain .if-control:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=hidden]){font:14px/1.5 var(--if-font);color:var(--if-text);background:var(--if-background);border:1px solid var(--if-border);border-radius:999px;min-height:40px;padding:8px 12px;min-width:0;max-width:100%}
.if-root .if-domain :is(select,textarea,button),.if-root .if-domain .if-button{font:14px/1.5 var(--if-font)}
.if-root .if-domain label:has(>input:is([type=checkbox],[type=radio])){display:flex;align-items:center;gap:10px;min-height:44px}
.if-root .if-domain input:is([type=checkbox],[type=radio]){appearance:none;flex:none;width:20px;height:20px;min-width:20px;min-height:20px;margin:0;padding:0;border:1.5px solid var(--if-border);border-radius:50%;background:var(--if-background);cursor:pointer}
.if-root .if-domain .iui-checklist-items{padding-inline-start:0}
.if-root .if-domain .iui-field-checkbox{display:grid;grid-template-columns:20px minmax(0,1fr);column-gap:10px;row-gap:4px;align-items:center}
.if-root .if-domain .iui-field-checkbox>input[type=checkbox]{grid-area:1/1;align-self:center;justify-self:center}
.if-root .if-domain .iui-field-checkbox>.iui-field-label{grid-area:1/2;display:flex;align-items:center;min-height:44px;margin:0;text-align:start}
.if-root .if-domain .iui-field-checkbox>:is(.iui-field-hint,.iui-field-error){grid-column:2;margin:0;text-align:start}
.if-root .if-domain .iui-field-checkbox>.if-domain-choice-check{position:static;grid-area:1/1;transform:none;align-self:center;justify-self:center}
.if-root .if-domain input[type=checkbox]:checked{background:var(--if-accent);border-color:var(--if-accent)}
.if-root .if-domain input[type=radio]:checked{background:var(--if-accent);border-color:var(--if-accent);box-shadow:inset 0 0 0 4px var(--if-background)}
.if-root .if-domain :is(input,textarea,select,button):focus-visible{outline:2px solid var(--if-focus);outline-offset:3px}
.if-root .if-domain :is(input,textarea,select,button):disabled{cursor:not-allowed;color:var(--if-disabled-text);border-color:var(--if-disabled-border)}
.if-root .if-domain :is(input,textarea,select)[aria-invalid=true]{border-color:var(--if-error)}
`;
