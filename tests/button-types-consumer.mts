import type {Node,MountOptions,FormAction} from '../dist/index.js';
const host:Node={type:'button',label:'Run',tone:'primary',hint:'Explicit host action',disabled:{$:'locked'},action:{kind:'host',name:'save'}};
const set:Node={type:'button',label:'Set',action:{kind:'set',bind:'n',value:1}};
const reset:Node={type:'button',label:'Reset',action:{kind:'reset'}};
const action:FormAction=async({values,signal})=>{const value:string|number|boolean|undefined=values.note;signal.throwIfAborted();void value;
 // @ts-expect-error action values are immutable
 values.note='changed';
};
const options:MountOptions={actions:{save:action}};
// @ts-expect-error host actions require a name
const missing:Node={type:'button',label:'Run',action:{kind:'host'}};
// @ts-expect-error host cannot carry local mutation fields
const mixed:Node={type:'button',label:'Run',action:{kind:'host',name:'save',bind:'n'}};
// @ts-expect-error reset cannot carry host action names
const namedReset:Node={type:'button',label:'Reset',action:{kind:'reset',name:'save'}};
// @ts-expect-error set requires a value
const noValue:Node={type:'button',label:'Set',action:{kind:'set',bind:'n'}};
// @ts-expect-error tone is a finite enum
const tone:Node={type:'button',label:'Reset',tone:'success',action:{kind:'reset'}};
// @ts-expect-error hint is literal text
const hint:Node={type:'button',label:'Reset',hint:{$:'hint'},action:{kind:'reset'}};
void [host,set,reset,options,missing,mixed,namedReset,noValue,tone,hint];
