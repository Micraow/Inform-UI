/** Structural subset of the authoritative component-contract RenderContext. */
export interface DomainHandle {element:HTMLElement|SVGElement;dispose():void;update?(props:Record<string,unknown>):void}
export interface DomainContext {
 document:Document;partial?:boolean;signal?:AbortSignal;bindings?:Readonly<Record<string,unknown>>;
 budget:{consume(units?:number):void;readonly remaining?:number};
 renderChild(node:any):DomainHandle;
 writeBinding?(prop:string,value:any):{ok:boolean;issues?:readonly {message:string}[]};
 dispatchLocal?(action:unknown):{ok:boolean;issues?:readonly {message:string}[]};
 allowImageURL?(url:string):boolean;
 allowAnimationURL?(url:string):boolean;
 theme?:'light'|'dark';
}
export interface ViewDescriptor {
 name:string;oldType:string;
 slots?:Readonly<Record<string,{min:number;max:number;accepts:'all'|readonly string[]}>>;
 bindingProps?:readonly string[];
 bindings?:readonly {prop:string;dataProp?:string;schema?:unknown}[];
 actionProps?:readonly string[];
}
export interface DomainOptions {
 /** The contract manifest is authoritative. Omit to expose candidate View names. */
 descriptors?:readonly ViewDescriptor[];
 /** Shared foundation DOM construction; it may add classes, never wrappers. */
 createElement?<K extends keyof HTMLElementTagNameMap>(document:Document,tag:K,className?:string,value?:unknown,budget?:DomainContext['budget']):HTMLElementTagNameMap[K];
 /** Official, finite, bundled icon renderer. No geometry from authored data. */
 renderIcon?(document:Document,name:string,options?:{label?:string;size?:number|string;className?:string}):SVGElement;
}
export interface DomainAdapter {kind:'dom';key:string;create(props:Record<string,unknown>,context:DomainContext):DomainHandle}
