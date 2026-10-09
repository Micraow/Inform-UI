import {mount,validateDocument,compileHtml} from '../dist/index.js';
import type {IUIDocument,Node} from '../dist/index.js';
type Menu=Extract<Node,{type:'restaurant-menu'}>;
const menu:Menu={type:'restaurant-menu',title:'Menu',currency:'XYZ',sections:[{id:'s',title:'Section',items:[{id:'i',name:'Item',price:null,status:'unavailable',tags:['Literal']}]}]};
const document:IUIDocument={version:'iui/1',body:[menu]};
validateDocument(document);compileHtml(document);if(false)mount({} as HTMLElement,document);
// @ts-expect-error Price is required even when it is unknown.
const missing:Menu['sections'][number]['items'][number]={id:'i',name:'No price'};
// @ts-expect-error No restaurant transaction actions.
const order:Menu={...menu,order:{}};
// @ts-expect-error Literal finite prices are numbers or null, never strings.
const textPrice:Menu['sections'][number]['items'][number]={id:'i',name:'Item',price:'0'};
// @ts-expect-error Status is supplied available/unavailable only.
const invented:Menu['sections'][number]['items'][number]={id:'i',name:'Item',price:0,status:'recommended'};
void [missing,order,textPrice,invented];
