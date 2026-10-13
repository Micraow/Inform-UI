import records from './examples.json';
import type { ViewSpec } from './index';
type Node={type:'element';typeName:string;props:Record<string,unknown>;partial:false};
const known=records as Record<string,{data:Record<string,unknown>;provenance:string}>;
export function viewExample(spec:ViewSpec,all:readonly ViewSpec[]){
 const sample=known[spec.name];if(!sample)throw Error('Missing validated synthetic example: '+spec.name);
 const props:Record<string,unknown>={data:structuredClone(sample.data)};
 for(const [key,slot]of Object.entries(spec.slots)){
  const children:Node[]=[];for(let i=0;i<Math.max(1,slot.min);i++){
   if(slot.accepts==='all')children.push({type:'element',typeName:'Text',props:{content:String(sample.data.label??sample.data.title??sample.data.summary??spec.oldType.replaceAll('-',' '))+': supporting content'},partial:false});
   else{const child=all.find(x=>x.name===slot.accepts[0]);if(!child)throw Error('Missing allowed slot example.');children.push({type:'element',typeName:child.name,props:viewExample(child,all).props,partial:false});}
  }props[key]=children;
 }
 for(const binding of spec.bindings){props[binding.prop]=spec.oldType==='segmented'?(sample.data.options as any[])?.[0]?.value??'sample':0;}
 const states:string[]=[];
 const nodeSource=(name:string,p:Record<string,unknown>):string=>{
  if(name==='Text')return'Text('+JSON.stringify(p.content)+')';
  const def=all.find(x=>x.name===name)!;
  return name+'('+def.orderedProps.map(key=>{
   if(key in def.slots)return'['+(p[key] as Node[]).map(x=>nodeSource(x.typeName,x.props)).join(', ')+']';
   if(def.actions.some(x=>x.prop===key)){if(!states.includes('$fixtureAction = false'))states.push('$fixtureAction = false');return'@Reset($fixtureAction)';}
   if(def.bindings.some(x=>x.prop===key)){const id='$fixture'+name+key;if(!states.some(x=>x.startsWith(id+' = ')))states.push(id+' = '+JSON.stringify(p[key]));return id;}
   return JSON.stringify(p[key]);
  }).join(', ')+')';
 };
 const call=nodeSource(spec.name,props);const source=[...states,'root = Stack(['+call+'])'].join('\n');
 return{name:spec.name,oldType:spec.oldType,data:sample.data,props,actionExpressions:Object.fromEntries(spec.actions.map(x=>[x.prop,'@Reset($fixtureAction)'])),source,provenance:sample.provenance};
}
