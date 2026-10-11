import type {Node} from '../dist/types/schema/document.js';
import type {RecommendationCardIntent} from '../dist/browser.js';
const good:Node={type:'recommendation-card',label:'Card',status:'resolved',canOpenConversation:true,data:{conversationId:'supplied',title:'Title',description:''}};
// @ts-expect-error resolved cards require explicit capability
const missing:Node={type:'recommendation-card',label:'Card',status:'resolved',data:{conversationId:'supplied',title:'Title',description:''}};
// @ts-expect-error pending cards cannot include live actions
const pending:Node={type:'recommendation-card',label:'Card',status:'pending',canOpenConversation:true};
const detail:RecommendationCardIntent={componentId:null,conversationId:'supplied'};
// @ts-expect-error emitted intent is readonly
 detail.conversationId='changed';
void good;void missing;void pending;
