import * as InformUI from '@micraow/inform-ui';
import * as Browser from '@micraow/inform-ui/browser';
import * as Core from '@micraow/inform-ui/core';
import type {
  ElementNode, InformProfile, Issue, MountOptions, MountedController,
  Preview, Result, Runtime, Snapshot,
} from '@micraow/inform-ui';
import type {MountOptions as BrowserMountOptions} from '@micraow/inform-ui/browser';
import type {MountOptions as CoreMountOptions} from '@micraow/inform-ui/core';
import {createIcon, type IconDefinition} from '@micraow/inform-ui/icons';
import Check from '@micraow/inform-ui/icons/Check';
import {getIcon} from '@micraow/inform-ui/icons/all';

const source = '$count = 1\nroot = Stack([Text("Count: " + $count)])';
const profile: InformProfile = InformUI.createDefaultProfile();
const runtime: Runtime = InformUI.createRuntime(profile);
const result: Result = runtime.commit(source);
const preview: Preview = runtime.preview('root = Stack([');
const snapshot: Snapshot | null = runtime.getSnapshot();
const updated: Result = runtime.setState({$count: 2});
if (result.ok) {
  const tree: ElementNode = result.snapshot.tree;
  const state: Readonly<Record<string, unknown>> = result.snapshot.state;
  const revision: number = result.snapshot.revision;
  // @ts-expect-error snapshot state is data with unknown values, not unchecked any
  const unvalidatedCount: number = state.$count;
  // @ts-expect-error committed snapshots are immutable
  result.snapshot.revision = 2;
  void [tree, state, revision, unvalidatedCount];
} else {
  const issues: readonly Issue[] = result.issues;
  void issues;
}
const unsubscribe = runtime.subscribe(current => {
  const revision: number = current.revision;
  // @ts-expect-error state writes must use a runtime transaction
  current.state.$count = 2;
  void revision;
});
unsubscribe();

const options: MountOptions = {
  source,
  theme: 'dark',
  allowImageURL: url => url.startsWith('https://'),
  allowAnimationURL: url => url.startsWith('https://'),
  allowMediaURL: url => url.startsWith('https://'),
  onError: issues => {
    for (const issue of issues) {
      const code: string = issue.code;
      const path: string | undefined = issue.path;
      void [code, path];
    }
  },
};
const browserOptions: BrowserMountOptions = options;
const coreOptions: CoreMountOptions = options;
declare const container: HTMLElement;
const controller: MountedController = InformUI.mount(container, {...options, select: ['base/text', 'base/layout']});
const browserController = Browser.mount(container, {...browserOptions, viewNames: []});
const coreController = Core.mount(container, coreOptions);
controller.commit(source);
controller.runtime.setState({$count: 3});
const mountedSnapshot: Snapshot | null = controller.getSnapshot();
const browserSnapshot: Snapshot | null = browserController.getSnapshot();
const coreSnapshot: Snapshot | null = coreController.getSnapshot();
controller.setTheme('light');
controller.dispose();

const selected = InformUI.createProfile({select: ['base/text', 'base/layout']});
const base = Core.createBaseProfile();
Core.createRuntime(base).commit(source);
Browser.createRuntime(Browser.createDefaultProfile()).commit(source);
const prompts: string[] = [InformUI.prompt(), Browser.prompt(), Core.prompt()];
const versions: string[] = [InformUI.version, Browser.version, Core.version];
const definition: IconDefinition = Check;
const icon: SVGSVGElement = createIcon(document, getIcon('Check'));

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type IsAny<T> = 0 extends (1 & T) ? true : false;
type RootNames = 'createProfile' | 'createDefaultProfile' | 'createRuntime' | 'createBaseProfile' | 'mount' | 'prompt' | 'version';
type CoreNames = 'createBaseProfile' | 'createRuntime' | 'mount' | 'prompt' | 'version';
const rootExportsAreDSLOnly: Equal<keyof typeof InformUI, RootNames> = true;
const browserExportsAreDSLOnly: Equal<keyof typeof Browser, RootNames> = true;
const coreExportsAreDSLOnly: Equal<keyof typeof Core, CoreNames> = true;
const snapshotIsTyped: IsAny<ReturnType<typeof browserController.getSnapshot>> = false;
const commitIsTyped: IsAny<ReturnType<typeof browserController.commit>> = false;
const mountedStateIsTyped: IsAny<NonNullable<ReturnType<typeof browserController.getSnapshot>>['state']> = false;

// @ts-expect-error authoring input is DSL text, never the former JSON document
runtime.commit({version: 'iui/1', body: []});
// @ts-expect-error preview also takes only DSL source
runtime.preview({version: 'iui/1', body: []});
// @ts-expect-error mounted commits cannot introduce a second authoring protocol
controller.commit({version: 'iui/1', body: []});
// @ts-expect-error mounting requires options with a string source
InformUI.mount(container, {version: 'iui/1', body: []});
// @ts-expect-error source cannot be an old JSON document
Core.mount(container, {source: {version: 'iui/1', body: []}});
// @ts-expect-error invalid theme cannot reach the host
Browser.mount(container, {source, theme: 'automatic'});
// @ts-expect-error public root no longer exports JSON validation
InformUI.validateDocument;
// @ts-expect-error public browser no longer exports the JSON compiler
Browser.compileArtifact;
// @ts-expect-error migration metadata is internal
InformUI.migrationMap;
// @ts-expect-error the core has no full-domain profile selection API
Core.createProfile;
// @ts-expect-error old authoring document types are not public
import type {IUIDocument} from '@micraow/inform-ui';
// @ts-expect-error the transitional next entry is no longer public
import {createRuntime as nextRuntime} from '@micraow/inform-ui/next';

void [preview, snapshot, updated, mountedSnapshot, browserSnapshot, coreSnapshot, selected,
  prompts, versions, definition, icon, rootExportsAreDSLOnly, browserExportsAreDSLOnly,
  coreExportsAreDSLOnly, snapshotIsTyped, commitIsTyped, mountedStateIsTyped];
