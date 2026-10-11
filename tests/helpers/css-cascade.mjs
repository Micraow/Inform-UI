import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
export function cssEvidence(css){
const dom=new JSDOM('<style></style>');dom.window.document.querySelector('style').textContent=css;
const rules=[];function visit(entries,conditions=[]){for(const rule of entries){if(rule.style&&rule.selectorText)rules.push({selector:rule.selectorText,style:rule.style,conditions});if(rule.cssRules)visit(rule.cssRules,[...conditions,rule.conditionText??'']);}}
visit(dom.window.document.styleSheets[0].cssRules);
function splitSelectors(text){let depth=0,start=0,result=[];for(let i=0;i<text.length;i++){if(text[i]==='('||text[i]==='[')depth++;if(text[i]===')'||text[i]===']')depth--;if(text[i]===','&&depth===0){result.push(text.slice(start,i));start=i+1;}}result.push(text.slice(start));return result;}
function specificity(selector){let score=0,s=selector.trim();while(s.length){let m;if((m=/^\s+|^[>+~*]/.exec(s))){s=s.slice(m[0].length);continue;}
 if(s[0]==='['){const end=s.indexOf(']');assert.ok(end>=0);score+=100;s=s.slice(end+1);continue;}
 if((m=/^:(is|not|where)\(/.exec(s))){let depth=1,end=m[0].length;for(;end<s.length&&depth;end++){if(s[end]==='(')depth++;if(s[end]===')')depth--;}const inner=s.slice(m[0].length,end-1);if(m[1]!=='where')score+=Math.max(...splitSelectors(inner).map(specificity));s=s.slice(end);continue;}
 if((m=/^([.#:]?)[\w-]+/.exec(s))){score+=m[1]==='#'?10000:m[1]?100:1;s=s.slice(m[0].length);continue;}
 throw new Error(`Unhandled specificity syntax ${s}`);
 }return score;}
function applicable(conditions,env){return conditions.every(condition=>{
 const c=condition.replaceAll(' ','');if(!c)return true;
 if(c==='(hover:hover)and(pointer:fine)')return env.fine;
 if(c==='(prefers-color-scheme:dark)')return env.dark;
 if(c==='(prefers-reduced-motion:reduce)')return !!env.reduce;
 if(c==='(forced-colors:active)')return false;
 return false;
});}
function winner(element,property,env){let best;for(let order=0;order<rules.length;order++){const r=rules[order];if(!applicable(r.conditions,env))continue;
 let value=r.style.getPropertyValue(property),p=property;if(!value&&property==='background-color'){p='background';value=r.style.getPropertyValue(p);}if(!value)continue;
 for(const selector of splitSelectors(r.selector)){
 if(selector.includes('::'))continue; // Pseudo-element declarations do not style the control box.
 const match=selector.replaceAll(':hover','[data-qa-hover]').replaceAll(':active','[data-qa-active]').replaceAll(':focus-visible','[data-qa-focus]');
 let matched;try{matched=element.matches(match);}catch(error){throw new Error(`Cannot match ${match}`,{cause:error});}if(!matched)continue;
 const rank=[r.style.getPropertyPriority(p)==='important'?1:0,specificity(selector),order];
 if(!best||rank.some((x,i)=>x>best.rank[i]&&rank.slice(0,i).every((v,j)=>v===best.rank[j])))best={value:value.trim(),rank,selector};
 }}assert.ok(best,`No ${property}`);return best.value;}

return {dom,rules,winner,specificity};
}
