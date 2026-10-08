/** Original offline host-action fixture. No URLs, fetch, timers, storage, or external services.
 * The host can call completePending() to finish loading and retry the error example.
 * Every listener is removed on settle/abort; mount.update/dispose abort pending operations.
 */
export function createFormsDemoActions() {
  const pending = new Set();
  let failedOnce = false;
  return {
    actions: Object.freeze({
      'demo.pending': ({ signal }) => new Promise((resolve, reject) => {
        const finish = () => { pending.delete(finish); signal.removeEventListener('abort', cancel); resolve(); };
        const cancel = () => { pending.delete(finish); signal.removeEventListener('abort', cancel); reject(new DOMException('Cancelled', 'AbortError')); };
        if (signal.aborted) { cancel(); return; }
        pending.add(finish);
        signal.addEventListener('abort', cancel, { once: true });
      }),
      'demo.failOnce': () => {
        if (!failedOnce) { failedOnce = true; return Promise.reject(new Error('Synthetic first-attempt failure')); }
      }
    }),
    completePending() { for (const finish of [...pending]) finish(); },
    get pendingCount() { return pending.size; }
  };
}
