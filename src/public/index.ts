import {mount as mountBrowser, createProfile} from '../v2/browser.js';
import type {ProfileSelection} from '../v2/browser.js';
import type {MountOptions as CoreMountOptions, MountedController} from './core.js';

export {
  createProfile, createDefaultProfile, createRuntime, createBaseProfile, prompt, version,
} from '../v2/browser.js';
export type {ProfileSelection} from '../v2/browser.js';
export type {
  ActionHandle, BindingHandle, ElementNode, InformProfile, Issue, Limits,
  MountFailure, MountIssue, MountedController, OperationOptions,
  Preview, Result, Runtime, RuntimeOptions, Snapshot,
} from './core.js';

export type MountOptions = CoreMountOptions & ProfileSelection;

// The browser implementation adds profile selection; the DSL contract is shared.
export const mount = mountBrowser as (
  container: HTMLElement,
  options: MountOptions,
) => MountedController<ReturnType<typeof createProfile>>;
