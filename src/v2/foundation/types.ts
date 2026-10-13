import type {IconDefinition} from '../../icons/types.js';
import type {ElementNode,RenderContext,RenderHandle,RendererAdapter,ValidationResult} from '../../../packages/component-contract/src/types';
export type FoundationNode=ElementNode;
/** Explicit in-place updates preserve native interaction state; the host refreshes bindings first. */
export type FoundationHandle=RenderHandle & {
 update?(props:Record<string,unknown>):void;
 /** May retain unchanged local-only DOM. The host additionally forbids bindings and child records. */
 retainUnchanged?(props:Record<string,unknown>):boolean;
};
export type FoundationResult=ValidationResult<null>;
/** The contract is authoritative; this host-only capability never enters model props. */
export interface FoundationContext extends RenderContext {allowImageURL?(url:string):boolean;allowAnimationURL?(url:string):boolean;allowMediaURL?(url:string):boolean;theme?:'light'|'dark'}
export interface FoundationOptions {resolveIcon(name:string):IconDefinition}
export type FoundationAdapter=Extract<RendererAdapter,{kind:'dom'}>;
