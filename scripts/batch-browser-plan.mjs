/** Original read-only manifest for the accumulated browser gate. Discovery never means execution. */
import assert from 'node:assert/strict';
import {readFile,readdir,lstat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const requiredRecoveryPaths=Object.freeze([
 'scripts/prepare-test-font.mjs','tests/assets/fonts/noto-cjk-sc/NotoSansCJKsc-Regular.otf',
 'tests/assets/fonts/noto-cjk-sc/OFL.txt','tests/assets/fonts/noto-cjk-sc/font-lock.json',
 'tests/browser/pinned-cjk-font.spec.mjs','tests/native-select-capture.test.mjs',
 'tests/browser/entity-reviews.spec.mjs','tests/browser/availability.spec.mjs',
 'tests/browser/converters.spec.mjs','tests/browser/agenda.spec.mjs','tests/browser/sports.spec.mjs',
 'tests/consumer/pending/verify-browser.mjs'
]);
const inputRoots=['tests/browser','tests/assets/fonts/noto-cjk-sc','examples','playwright.config.mjs',
 'scripts/build-examples.mjs','scripts/serve-tests.mjs','scripts/prepare-test-font.mjs',
 'tests/native-select-capture.test.mjs','tests/consumer/pending/verify-browser.mjs',
 'scripts/consumer-skill-inputs.mjs','scripts/batch-browser-plan.mjs','scripts/prepare-batch-lock.mjs','scripts/run-batch-consumers.mjs','scripts/run-skill-acceptance.mjs',
 'package.json','package-lock.json','.github/workflows/ci.yml'];
export function parseDiscovery(text){const matches=[...text.matchAll(/^Total: (\d+) tests? in (\d+) files?[ \t]*\r?$/gm)];assert.equal(matches.length,1,'Expected one Playwright discovery total');const result={tests:Number(matches[0][1]),files:Number(matches[0][2])};assert.ok(Object.values(result).every(n=>Number.isSafeInteger(n)&&n>0),'Positive bounded discovery counts required');return result;}
export async function browserInputHashes(root){
 const rootState=await lstat(root);assert.ok(rootState.isDirectory()&&!rootState.isSymbolicLink(),'Real browser input root required');
 const hashes={};async function walk(relative){const file=path.join(root,relative),state=await lstat(file);assert.equal(state.isSymbolicLink(),false,'Browser input symlink refused: '+relative);if(state.isDirectory()){for(const name of (await readdir(file)).sort())await walk(relative+'/'+name);}else{assert.ok(state.isFile());hashes[relative]=createHash('sha256').update(await readFile(file)).digest('hex');}}
 for(const relative of inputRoots)await walk(relative);return Object.fromEntries(Object.entries(hashes).sort(([a],[b])=>a.localeCompare(b)));
}
export async function createBrowserPlan(root=process.cwd()){
 const hashes=await browserInputHashes(root);for(const required of requiredRecoveryPaths)assert.ok(hashes[required],'Missing required recovery '+required);
 const result=spawnSync(process.execPath,[path.join(root,'node_modules/@playwright/test/cli.js'),'test','--list'],{cwd:root,encoding:'utf8',timeout:120000});assert.equal(result.error,undefined);assert.equal(result.status,0,result.stderr);const discovered=parseDiscovery(result.stdout);
 assert.equal(Object.keys(hashes).filter(p=>/^tests\/browser\/.*\.spec\.mjs$/.test(p)).length,discovered.files);
 return{format:'inform-ui-browser-plan/1',preparedOnly:true,command:'npm run test:browser',discovered,requiredRecoveries:[...requiredRecoveryPaths],inputSha256:hashes};
}
export async function verifyBrowserPlan(root,plan){assert.deepEqual(await createBrowserPlan(root),plan,'Browser inputs or discovery changed after the reviewed lock');return plan.discovered;}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);assert.equal(args.length,2);assert.equal(args[0],'--lock');assert.match(args[1],/^tests\/consumer\/batch-lock-115\.json$/);const lock=JSON.parse(await readFile(args[1],'utf8'));assert.equal(lock.format,'inform-ui-batch-lock/1');assert.ok(lock.canonicalBrowser);console.log(JSON.stringify({verifiedPreparedPlan:await verifyBrowserPlan(process.cwd(),lock.canonicalBrowser),browserExecuted:false}));
}
