import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const baseline = JSON.parse(await readFile(new URL('./controls-presentation-baseline.json', import.meta.url)));
// Keep independent exact guards: adding Code token scopes must not silently
// approve an unrelated global or Finance presentation change.
for (const [label, path, key] of [
  ['global controls', 'src/renderer/style.css', 'globalStyleSha256'],
  ['Code grammar token presentation', 'src/renderer/code-block.css', 'codePanelStyleSha256'],
  ['Finance status presentation', 'src/renderer/finance-status.css', 'financeStatusStyleSha256'],
]) {
  test(label + ' matches its reviewed exact CSS baseline', async () => {
    const bytes = await readFile(new URL('../' + path, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), baseline[key], path);
  });
}
