import type {Node} from '../dist/index.js';import type {Node as BrowserNode} from '../dist/browser.js';
const email:Node={type:'email-preview',subject:'Supplied',from:{address:'sender@example.org'},to:[],body:'Literal'};
const files:BrowserNode={type:'file-nav-list',label:'Supplied',entries:[{id:'folder',name:'Folder',kind:'folder'},{id:'file',name:'File',kind:'file',parentId:'folder'}]};
// @ts-expect-error folders cannot have file URLs
const folderURL:Node={...files,entries:[{id:'folder',name:'Folder',kind:'folder',url:'https://example.org'}]};
// @ts-expect-error no mailbox provider endpoint
const provider:Node={...email,endpoint:'https://example.org/api'};
// @ts-expect-error no rendered HTML
const html:Node={...email,html:'<img src=x>'};
// @ts-expect-error no filesystem mount
const path:Node={...files,path:'/private'};
void[email,files,folderURL,provider,html,path];
