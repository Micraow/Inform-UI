import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
test('CI verifies current source and keeps the historical 115-node lock immutable', async () => {
 const historical = await readFile('.github/workflows/ci.yml', 'utf8');
 const current = await readFile('.github/workflows/recovery-validation.yml', 'utf8');
 assert.match(historical, /name: Historical 115-node acceptance \(4e13fae\)/);
 assert.match(historical, /ref: 4e13fae4bf6416865bb93aa92056df6917d231b9/);
 assert.ok(historical.indexOf('run: npm run check') < historical.indexOf('run: node scripts/batch-browser-plan.mjs'));
 assert.equal(createHash('sha256').update(await readFile('tests/consumer/batch-lock-115.json')).digest('hex'), '8c25b5988c0a40cf5fe9e2cecd6e17919acbba7a5f8db8ff9670a79a87267f3d');
 assert.match(current, /branches: \[main, recovery\/portable-124-20261011\]/);
 assert.match(current, /  pull_request:/);
 assert.doesNotMatch(current, /\n          ref:/);
 for (const command of ['npm run check', 'node scripts/check-generated.mjs', 'npm run test:showcase', 'test --config playwright.recovery.config.mjs']) assert.ok(current.includes(command), command);
 assert.doesNotMatch(historical + current, /continue-on-error:\s*true/);
});
