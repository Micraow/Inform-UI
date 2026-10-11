import type {Node,PressableNode} from '../schema/document.js';
import type {Issue} from './index.js';
const passive=new Set(['text','title','caption','badge','icon','divider','spacer','box','card','row','col','grid','grid-item','flow','section','figure','metric','image','svg']);
/** A single native button covers supplied passive content, never another focusable action. */
export function inspectPressable(node:PressableNode,path:string,add:(issue:Issue)=>void):void {
 const issue=(code:string,at:string,message:string)=>add({code,path:at,message});
 const visit=(child:Node,at:string):void=>{
  if(!passive.has(child.type)){issue('PRESSABLE_CONTENT',at,'Pressable content must be passive text, layout, icons, metrics, SVG or inline raster images.');return;}
  if(child.type==='text')child.runs?.forEach((run,index)=>{if(run.href!==undefined)issue('PRESSABLE_INTERACTIVE',`${at}/runs/${index}/href`,'Linked text is a separate action and cannot be nested in pressable content.');});
  if(child.type==='image'&&!/^data:/i.test(child.src))issue('PRESSABLE_EXTERNAL_MEDIA',at+'/src','External images have an interactive consent gate; use an inline allowed raster image or place media outside the pressable.');
  if('children'in child&&Array.isArray(child.children))child.children.forEach((item,index)=>visit(item,`${at}/children/${index}`));
 };
 node.children.forEach((child,index)=>visit(child,`${path}/children/${index}`));
}
