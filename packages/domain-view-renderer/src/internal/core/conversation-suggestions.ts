import type {ConversationSuggestionsNode} from '../schema/document.js';
import type {Issue} from './index.js';
/** Original finite action contract; no historical implementation identity is implied. */
export function inspectConversationSuggestions(node:ConversationSuggestionsNode,path:string,add:(issue:Issue)=>void,safe:(url:string,kind?:'link'|'image')=>boolean):void {
 const ids=new Set<string>();
 node.suggestions.forEach((action,index)=>{const at=`${path}/suggestions/${index}`;if(action.iconSrc!==undefined&&!safe(action.iconSrc,'image'))add({code:'CONVERSATION_SUGGESTION_SOURCE',path:at+'/iconSrc',message:'Use a safe supplied image source.'});if(ids.has(action.id))add({code:'CONVERSATION_SUGGESTION_ID',path:at+'/id',message:'Action IDs must be unique within this bar.'});ids.add(action.id);if(!action.prompt.trim())add({code:'CONVERSATION_SUGGESTION_PROMPT',path:at+'/prompt',message:'A suggestion needs nonblank supplied prompt text.'});if(!action.label.trim())add({code:'CONVERSATION_SUGGESTION_LABEL',path:at+'/label',message:'An action needs a nonblank supplied label.'});});
 if(node.label!==undefined&&!node.label.trim())add({code:'CONVERSATION_SUGGESTION_LABEL',path:path+'/label',message:'The supplied group label must not be blank.'});
}
