/** Private retirement control flow. No ordinary error or similarly named Symbol is swallowed. */
const retired = Symbol('retired-render-generation');

export interface RenderGeneration {
  current(): boolean;
  check(): void;
  during<T>(work: () => T): T;
  guard<A extends unknown[], T>(work: (...args: A) => T): (...args: A) => T | undefined;
  own(release: () => void): () => void;
  acquire<T>(create: () => T, release: (resource: T) => void): T;
  listen(target: EventTarget, name: string, listener: EventListener, capture?: boolean): () => void;
  fork(valid?: () => boolean): RenderGeneration;
  dispose(): void;
  readonly size: number;
}

/** One render generation owns its registrations. Retirement is irreversible. */
export function renderGeneration(isCurrent: () => boolean): RenderGeneration {
  let stopped = false;
  const releases = new Set<() => void>();
  const current = () => !stopped && isCurrent() && !stopped;
  const check = () => { if (!current()) throw retired; };
  const during = <T>(work: () => T): T => { check(); const result = work(); check(); return result; };
  const guard = <A extends unknown[], T>(work: (...args: A) => T) => (...args: A): T | undefined => {
    if (!current()) return undefined;
    try { return during(() => work(...args)); }
    catch (error) { if (error !== retired) throw error; return undefined; }
  };
  const own = (release: () => void) => {
    let released = false;
    const once = () => { if (released) return; released = true; releases.delete(once); release(); };
    if (current()) releases.add(once); else once();
    return once;
  };
  const acquire = <T>(create: () => T, release: (resource: T) => void): T => {
    check();
    const resource = create();
    // A host constructor/registration can synchronously replace or dispose us.
    // Register only after it returns; compensate if the owner retired meanwhile.
    own(() => release(resource));
    check();
    return resource;
  };
  const dispose = () => {
    if (stopped) return;
    stopped = true;
    const pending = [...releases]; releases.clear();
    let first: unknown; let failed = false;
    for (const release of pending) {
      try { release(); }
      catch (error) { if (error !== retired && !failed) { failed = true; first = error; } }
    }
    if (failed) throw first;
  };
  const listen = (target: EventTarget, name: string, listener: EventListener, capture = false) => {
    check();
    const callback: EventListener = guard(event => listener.call(target, event));
    try { target.addEventListener(name, callback, capture); }
    catch (error) {
      // Unlike an opaque factory, this resource identity is known even if a
      // host wrapper registers it and then throws before returning.
      try { target.removeEventListener(name, callback, capture); }
      catch (releaseError) { throw new AggregateError([error, releaseError], 'Listener registration and cleanup failed'); }
      throw error;
    }
    const release = own(() => target.removeEventListener(name, callback, capture));
    check(); return release;
  };
  const fork = (valid: () => boolean = () => true): RenderGeneration => {
    const child = renderGeneration(() => current() && valid());
    const detach = own(() => child.dispose());
    try { child.own(detach); }
    catch (error) { detach(); throw error; }
    return child;
  };
  return {current, check, during, guard, own, acquire, listen, fork, dispose, get size() { return releases.size; }};
}
