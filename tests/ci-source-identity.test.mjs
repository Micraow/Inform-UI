import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
test('CI verifies current source and keeps the historical 115-node lock immutable', async () => {
 const historical = await readFile('.github/workflows/historical-115.yml', 'utf8');
 const portability = await readFile('.github/workflows/ci.yml', 'utf8');
 const current = await readFile('.github/workflows/recovery-validation.yml', 'utf8');
 assert.match(historical, /name: Historical prepared 115 reproduction \(4e13fae\)/);
 assert.match(historical, /on:\n  workflow_dispatch:\npermissions:/);
 assert.doesNotMatch(historical, /(?:push|pull_request|schedule):/);
 assert.match(portability, /branches: \[main\]/);
 assert.match(portability, /  pull_request:/);
 assert.doesNotMatch(portability, /\n          ref:/);
 for (const entry of ['ubuntu-latest, node: 24', 'windows-latest, node: 22', 'macos-latest, node: 22']) assert.ok(portability.includes(entry), entry);
 for (const command of ['npm run build', 'node scripts/verify-platform-smoke.mjs']) assert.ok(portability.includes(command), command);
 assert.match(historical, /ref: 4e13fae4bf6416865bb93aa92056df6917d231b9/);
 assert.ok(historical.indexOf('run: npm run check') < historical.indexOf('run: node scripts/batch-browser-plan.mjs'));
 assert.equal(createHash('sha256').update(await readFile('tests/consumer/batch-lock-115.json')).digest('hex'), '8c25b5988c0a40cf5fe9e2cecd6e17919acbba7a5f8db8ff9670a79a87267f3d');
 assert.match(current, /branches: \[main\]/);
 assert.match(current, /  pull_request:/);
 assert.doesNotMatch(current, /\n          ref:/);
 for (const command of ['npm run check', 'node scripts/check-generated.mjs', 'npm run test:showcase', 'test --config playwright.recovery.config.mjs']) assert.ok(current.includes(command), command);
 assert.doesNotMatch(historical + current + portability, /continue-on-error:\s*true/);
});

test('automatic current-source checks do not launch browsers', async () => {
 const current = await readFile('.github/workflows/recovery-validation.yml', 'utf8');
 assert.match(current, /workflow_dispatch:\n    inputs:\n      browsers:/);
 assert.match(current, /type: boolean\n        default: false/);
 const optIn = "if: ${{ github.event_name == 'workflow_dispatch' && inputs.browsers }}";
 for (const name of ['Install the lock-pinned Playwright Chromium build', 'Install the exact licensed test font', 'Build and verify the complete component studio', 'Run synthetic browsers against this checkout']) {
  assert.ok(current.includes('- name: ' + name + '\n        ' + optIn), name);
 }
 assert.ok(current.includes('run: npm run check'));
 assert.ok(current.includes('node scripts/check-generated.mjs'));
});

test('focused foundation and code workflows also require explicit browser opt-in',async()=>{
 const optIn="if: ${{ github.event_name == 'workflow_dispatch' && inputs.browsers }}";
 for(const [file,names] of [
  ['foundation-layout.yml',['Install the lock-pinned browser and licensed CJK font','Check foundation layout serially']],
  ['code-highlighting.yml',['Install lock-pinned Chromium','Verify actual colors and trusted copy serially']]
 ]){
  const text=await readFile('.github/workflows/'+file,'utf8');
  assert.match(text,/workflow_dispatch:\n    inputs:\n      browsers:/);assert.match(text,/type: boolean\n        default: false/);
  for(const name of names)assert.ok(text.includes('- name: '+name+'\n        '+optIn),name);
  assert.match(text,/node --test/);
 }
});
