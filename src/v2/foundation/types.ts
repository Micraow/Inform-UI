import type {IconDefinition} from '../../icons/types.js';
import type {ElementNode,RenderContext,RenderHandle,RendererAdapter,ValidationResult} from '../../../packages/component-contract/src/types';
export type FoundationNode=ElementNode;
export type FoundationHandle=RenderHandle;
export type FoundationResult=ValidationResult<null>;
/** The contract is authoritative; this host-only capability never enters model props. */
export interface FoundationContext extends RenderContext {allowImageURL?(url:string):boolean;allowAnimationURL?(url:string):boolean;allowMediaURL?(url:string):boolean;theme?:'light'|'dark'}
export interface FoundationOptions {resolveIcon(name:string):IconDefinition}
export type FoundationAdapter=Extract<RendererAdapter,{kind:'dom'}>;
