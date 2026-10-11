import type {IUIDocument,FollowUpCardDetail} from '../dist/index.js';
import type {FollowUpCardDetail as BrowserDetail} from '../dist/browser.js';
const doc:IUIDocument={version:'iui/1',body:[{type:'follow-up-card-group',label:'Next',items:[{id:'next',label:'Explain',intent:{kind:'query',query:'Explain the example'}}]}]};
const detail:FollowUpCardDetail={componentId:null,itemId:'next',intent:{kind:'prefill',surface:'work',query:'Draft'}};
const browser:BrowserDetail=detail;
// @ts-expect-error arbitrary execution is not part of the intent contract
const bad:FollowUpCardDetail={componentId:null,itemId:'bad',intent:{kind:'execute',code:'bad()'}};
void [doc,browser,bad];
