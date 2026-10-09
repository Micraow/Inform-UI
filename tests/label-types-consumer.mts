import type {IUIDocument,Node} from '../dist/index.js';
const extra:Node={type:'label',id:'extra',text:'Additional field name',target:'field'};
const document:IUIDocument={version:'iui/1',state:{text:''},body:[extra,{type:'input',kind:'text',id:'field',label:'Original field name',bind:'text'}]};
// @ts-expect-error text is a required literal
const missingText:Node={type:'label',target:'field'};
// @ts-expect-error target is required
const missingTarget:Node={type:'label',text:'Name'};
// @ts-expect-error host state is not a label text protocol
const boundText:Node={type:'label',text:{$:'text'},target:'field'};
// @ts-expect-error target references cannot be dynamic
const boundTarget:Node={type:'label',text:'Name',target:{$:'text'}};
// @ts-expect-error labels are not field bindings
const fieldLabel:Node={type:'label',text:'Name',target:'field',bind:'text'};
// @ts-expect-error label markup is not supported
const htmlLabel:Node={type:'label',text:'Name',target:'field',html:'<b>Name</b>'};
void [document,missingText,missingTarget,boundText,boundTarget,fieldLabel,htmlLabel];
