import type {Node,IUIDocument} from '../dist/index.js';
const email:Node={type:'email-draft',label:'Draft',to:[],subject:'',body:'',cc:['fiction@example.invalid'],editable:false};
const plan:Node={type:'task-expansion-card',title:'Read supplied plan',summary:'Local review',steps:[{id:'read',title:'Read',reviewed:true},{id:'detail',title:'Inspect',description:'Supplied text',details:'More text'}],disabled:{$:'locked'}};
const input:IUIDocument={version:'iui/1',state:{locked:false},body:[email,plan]};void input;
// @ts-expect-error to is required even when empty
const missingRecipients:Node={type:'email-draft',label:'Draft',subject:'',body:''};
// @ts-expect-error email body is a literal string, never a binding
const boundBody:Node={type:'email-draft',label:'Draft',to:[],subject:'',body:{$:'text'}};
// @ts-expect-error no email sending or provider action
const send:Node={type:'email-draft',label:'Draft',to:[],subject:'',body:'',send:true};
// @ts-expect-error supplied steps need stable IDs
const noStepID:Node={type:'task-expansion-card',title:'Plan',steps:[{title:'Read'}]};
// @ts-expect-error marks are supplied booleans, never bindings
const boundMark:Node={type:'task-expansion-card',title:'Plan',steps:[{id:'s',title:'Read',reviewed:{$:'read'}}]};
// @ts-expect-error no execution API
const execute:Node={type:'task-expansion-card',title:'Plan',steps:[],execute:true};
void [missingRecipients,boundBody,send,noStepID,boundMark,execute];
