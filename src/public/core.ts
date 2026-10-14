import {mount as mountCore} from '../v2/core.js';
import type {InformProfile} from '../../packages/component-contract/src/types.js';
import type {Preview, Result, Runtime, Snapshot} from '../../packages/parser-runtime/src/types.js';

export {createBaseProfile, createRuntime, prompt, version} from '../v2/core.js';
export type {InformProfile} from '../../packages/component-contract/src/types.js';
export type {
  ActionHandle, BindingHandle, ElementNode, Issue, Limits, OperationOptions,
  Preview, Result, Runtime, RuntimeOptions, Snapshot,
} from '../../packages/parser-runtime/src/types.js';

/** Errors from the parser or DOM host; host errors may not have a DSL path. */
export interface MountIssue {
  readonly code: string;
  readonly message: string;
  readonly path?: string;
}

export interface MountOptions {
  source: string;
  theme?: 'light' | 'dark';
  allowImageURL?: (url: string) => boolean;
  allowAnimationURL?: (url: string) => boolean;
  allowMediaURL?: (url: string) => boolean;
  onError?: (issues: readonly MountIssue[]) => void;
}

export interface MountFailure {
  readonly ok: false;
  readonly issues: readonly MountIssue[];
}

/** The host exposes DSL transactions and the same typed runtime snapshots. */
export interface MountedController<Profile extends InformProfile = InformProfile> {
  readonly element: HTMLDivElement;
  readonly runtime: Runtime;
  readonly profile: Profile;
  commit(source: string): Result | MountFailure;
  preview(source: string): Preview | MountFailure;
  getSnapshot(): Snapshot | null;
  setTheme(theme: 'light' | 'dark'): void;
  dispose(): void;
}

// Keep the implementation in v2; only tighten the public host declaration.
export const mount = mountCore as (
  container: HTMLElement,
  options: MountOptions,
) => MountedController;
