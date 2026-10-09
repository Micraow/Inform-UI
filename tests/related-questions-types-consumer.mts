import type {SidebarPeopleAlsoAskNode} from '../src/schema/document.js';
const valid:SidebarPeopleAlsoAskNode={type:'sidebar-people-also-ask',label:'Questions',items:[{id:'a',question:'Q?',answer:null}]};
// @ts-expect-error An answer is explicit, including a null missing answer.
const missing:SidebarPeopleAlsoAskNode={type:'sidebar-people-also-ask',label:'Questions',items:[{id:'a',question:'Q?'}]};
void valid;void missing;
