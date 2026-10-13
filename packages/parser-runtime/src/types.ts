export interface Issue { code: string; path: string; message: string }
export interface Limits { source: number; tokens: number; statements: number; astNodes: number; depth: number; operations: number; array: number; outputNodes: number; dataValues: number; text: number; actionSteps: number }
export interface Budget { consume(units?: number): void; readonly remaining: number }
export interface ActionHandle { readonly kind: 'inform-action'; readonly id: string }
export interface BindingHandle { readonly kind: 'inform-binding'; readonly id: string; readonly name: string }
export interface ElementNode { readonly type: 'element'; readonly typeName: string; readonly props: Readonly<Record<string, unknown>>; readonly partial: boolean; readonly statementId?: string; readonly bindings?: Readonly<Record<string, BindingHandle>> }
export type Validation = {ok: true; value: Record<string, unknown>} | {ok: false; issues: readonly Issue[]};
export interface Rule {
  orderedProps?: readonly string[];
  childSlots?: readonly string[];
  bindingProps?: readonly string[];
  actionProps?: readonly string[];
  validateProps(props: unknown, options?: {phase?: 'static' | 'evaluated'; budget?: Budget; isActionHandle?: (value: unknown) => boolean}): Validation;
}
export interface RuntimeOptions {
  schema?: { properties?: Record<string, unknown>; $defs?: Record<string, {properties?: Record<string, unknown>; required?: readonly string[]; [key: string]: unknown}> };
  root: string;
  componentRules: Readonly<Record<string, Rule>>;
  dataShapeRules?: Readonly<Record<string, Rule>>;
  limits?: Partial<Limits>;
}
export interface Snapshot { readonly revision: number; readonly tree: ElementNode; readonly state: Readonly<Record<string, unknown>>; readonly phase: 'ready' }
export type Result = {ok: true; snapshot: Snapshot} | {ok: false; issues: readonly Issue[]};
export interface Preview { readonly phase: 'preview'; readonly tree: ElementNode | null; readonly issues: readonly Issue[]; readonly interactive: false; readonly incomplete: boolean }
export interface OperationOptions { signal?: AbortSignal }
export interface Runtime {
  preview(source: string, options?: OperationOptions): Preview;
  commit(source: string, options?: OperationOptions): Result;
  setState(patch: unknown, options?: OperationOptions): Result;
  setBinding(handle: BindingHandle, value: unknown, options?: OperationOptions): Result;
  dispatchLocal(handle: ActionHandle, options?: OperationOptions): Result;
  isActionHandle(value: unknown): boolean;
  isBindingHandle(value: unknown): boolean;
  getSnapshot(): Snapshot | null;
  subscribe(listener: (snapshot: Snapshot) => void): () => void;
  dispose(): void;
}
