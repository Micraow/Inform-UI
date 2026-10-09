import type {Node,PollReadyDetail} from '../dist/index.js';
import type {PollReadyDetail as BrowserDetail} from '../dist/browser.js';
const poll:Node={type:'create-interactive-poll',label:'Local',options:[{id:'a',label:''},{id:'b',label:''}]};
const detail:PollReadyDetail={componentId:null,question:'Which?',options:[{id:'a',label:'A'},{id:'b',label:'B'}],multiple:false};
const browser:BrowserDetail=detail;
// @ts-expect-error no endpoint or provider
const endpoint:Node={...poll,endpoint:'https://example.org/poll'};
// @ts-expect-error no host binding
const binding:Node={...poll,bind:'poll'};
// @ts-expect-error event options are readonly
browser.options.push({id:'c',label:'C'});
// @ts-expect-error event option labels are readonly
browser.options[0].label='changed';
void[poll,detail,browser,endpoint,binding];
