import type {Node,ActivityPlanDetail,EventReviewDetail} from '../dist/index.js';import type {ActivityPlanDetail as BrowserPlan} from '../dist/browser.js';
const planner:Node={type:'shared-activity-planner',label:'Local',participants:[{id:'p',label:'P'}],options:[]};const event:Node={type:'event-sidebar',eventId:'e',label:'Supplied',startsAt:'2028-02-29T09:00Z',endsAt:'2028-02-29T10:00Z',agenda:[]};const detail:ActivityPlanDetail={componentId:null,optionId:'o',preferences:[{participantId:'p',value:'unset'}]};const browser:BrowserPlan=detail;const review:EventReviewDetail={componentId:null,eventId:'e'};
// @ts-expect-error preference snapshot readonly
detail.preferences[0].value='yes';
// @ts-expect-error no invitation API
const invite:Node={...planner,inviteUrl:'https://example.org'};
// @ts-expect-error no calendar API
const calendar:Node={...event,calendarUrl:'https://example.org'};
void[planner,event,detail,browser,review,invite,calendar];
