/**
 * Original pending Skill consumer, PREPARED ONLY until an authorized batch executes it.
 * One future owner: core scripts/run-batch-consumers.mjs. No workflow is activated here.
 * Native inputs test compiled example smoke; canonical specs own exhaustive lifecycle,
 * host cancellation/stale completion, accessibility and component acceptance.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {readFile, writeFile, mkdir, mkdtemp, rm, readdir, lstat} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

export const widths = Object.freeze([390, 768, 1100]);
export const themes = Object.freeze(['light', 'dark']);
export const sourceRevision = '6bc30ab8cb15eb4351b1859dacef74e7f8a9a574';
export const executionOwner = 'core:scripts/run-batch-consumers.mjs';
export const examples = Object.freeze([{"name":"create-interactive-poll","lang":"en","canonicalIds":["create-interactive-poll"],"sha256":"79410a06d521a1f5ece89ec072dc175ba0069da7bb98653d1e53d2d8af578396"},{"name":"mail-files","lang":"en","canonicalIds":["email-preview","file-nav-list"],"sha256":"69e6e96dfa40c5fb06061ae16a6b2fb3d8c4a9e84022eb0ee750897210922cff"},{"name":"decision-cards","lang":"en","canonicalIds":["jobs","product-card"],"sha256":"b8767cfb3e75f551512eafb46fd992bcd3af2eb5596e0054fc5c6c625cd1f4d5"},{"name":"related-questions","lang":"en","canonicalIds":["sidebar-people-also-ask"],"sha256":"e07bb1e65e3a2a07c601e8a30f57a5eba9d3a61dbcd89439f325438404883b6a"},{"name":"local-places","lang":"en","canonicalIds":["local-business","restaurant-reviews"],"sha256":"979dc6ea519b8ef3aeb76de1e413e2cec47bd5dc541d1c3ba4b2d07feca83f3a"},{"name":"flight-discovery","lang":"en","canonicalIds":["flight-search-form","flight-results"],"sha256":"17cfc7e6ab0373a9679288e75c4603cc8b3f266803885db2a142a97d71bcfff1"},{"name":"activity-planning","lang":"en","canonicalIds":["shared-activity-planner","event-sidebar"],"sha256":"94500e6f877965eac78d5413c15077a796f591027f0e009f9757eeba400bf06d"},{"name":"vocabulary-tools","lang":"en","canonicalIds":["word-card","copy-words"],"sha256":"715d3f999f434c9db2eb1474cf1ae4a0030cf82103e67f8a99a4504fe6f1bf70"},{"name":"source-citations","lang":"en","canonicalIds":["code-cite","file-cite"],"sha256":"94aea08687c096d173a26c6ea28d2e323121f1e38b6b87a71a8120561fe87c9f"},{"name":"entity-facts","lang":"en","canonicalIds":["sidebar-fact-table","entity-thumbnail-list"],"sha256":"61a8d260b6876dcc504cb289648fbb857fcdd4701c976a816eb8f48f740c5309"}]); // Generated manifest
const directory = path.dirname(fileURLToPath(import.meta.url));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const git = (root, ...args) => {
  const result = spawnSync('git', ['-C', root, ...args], {encoding:'utf8'});
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
};
async function ordinaryFile(root, relative) {
  assert.match(relative, /^[A-Za-z0-9._/-]+$/);
  assert.ok(!path.posix.isAbsolute(relative) && relative.split('/').every(p => p && p !== '.' && p !== '..'));
  let file = path.resolve(root);
  assert.ok((await lstat(file)).isDirectory() && !(await lstat(file)).isSymbolicLink(), 'Real input directory required');
  for (const part of relative.split('/')) {
    file = path.join(file, part);
    assert.equal((await lstat(file)).isSymbolicLink(), false, 'Input symlink refused');
  }
  assert.ok((await lstat(file)).isFile(), 'Ordinary input file required');
  return file;
}
export async function verifyExampleInputs(root = directory) {
  const documents = new Map();
  assert.equal(new Set(examples.map(e => e.name)).size, examples.length, 'Duplicate consumer name');
  for (const entry of examples) {
    assert.match(entry.name, /^[a-z0-9-]{1,100}$/);
    assert.match(entry.sha256, /^[a-f0-9]{64}$/);
    const bytes = await readFile(await ordinaryFile(root, 'examples/' + entry.name + '.json'));
    assert.equal(sha256(bytes), entry.sha256, 'Candidate example changed: ' + entry.name);
    documents.set(entry.name, JSON.parse(bytes));
  }
  return documents;
}

// Raw native mouse input is deliberate at aria-disabled boundaries. Locator.click
// waits for aria-enabled state and would hang rather than exercise the boundary.
async function nativePointer(page, target, expect) {
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  assert.ok(box && box.width > 0 && box.height > 0, 'Visible pointer target required');
  const point = {x:box.x + box.width / 2, y:box.y + box.height / 2};
  expect(await target.evaluate((el, p) => el.contains(el.ownerDocument.elementFromPoint(p.x, p.y)), point)).toBe(true);
  await page.mouse.click(point.x, point.y);
}
async function key(page, target, name, expect) {
  await target.focus();
  await expect(target).toBeFocused();
  await page.keyboard.press(name);
}
async function disclosure(page, details, expect) {
  const summary = details.locator(':scope > summary');
  await key(page, summary, 'Enter', expect);
  await expect(details).toHaveAttribute('open', '');
  await expect(summary).toBeFocused();
  await page.keyboard.press('Space');
  await expect(details).not.toHaveAttribute('open', '');
  await page.keyboard.press('Enter');
  await expect(details).toHaveAttribute('open', '');
}
export async function smokeExample(page, entry, document, expect) {
 const root=page.locator('.iui-root');
 const selectLast=async select=>{const last=await select.locator('option').last().getAttribute('value');await key(page,select,'End',expect);await page.keyboard.press('Enter');await expect(select).toHaveValue(last);await expect(select).toBeFocused();await page.keyboard.press('Escape');await expect(select).toHaveValue(last);await expect(select).toBeFocused();};
 switch(entry.name){
 case 'create-interactive-poll': {const b=root.locator('.iui-poll-prepare');await b.click();await expect(root.locator('.iui-poll')).toHaveAttribute('data-status','ready');await root.locator('.iui-poll-preview-button').click();await expect(root.locator('.iui-poll-preview')).toBeVisible();break;}
 case 'mail-files': {const email=root.locator('.iui-email-preview'),files=root.locator('.iui-file-nav');await email.locator('input').fill('PHOTO');await expect(email.locator('.iui-reader-file:not([hidden])')).toHaveCount(1);await files.locator('[data-entry-id=travel] .iui-file-open-folder').click();await expect(files.locator('.iui-file-folder-title')).toHaveText('Travel notes');await expect(files.locator('.iui-file-folder-title')).toBeFocused();await files.locator('.iui-file-back').click();await expect(files.locator('.iui-reader-file:not([hidden])')).toHaveCount(4);break;}
 case 'decision-cards': {const choice=root.locator('.iui-job-shortlist').first();await choice.click();await expect(choice).toHaveAttribute('aria-pressed','true');const product=root.locator('.iui-product-card');await product.locator('select').selectOption('plain');await product.locator('input').fill('2');await product.locator('.iui-product-review').click();await expect(product.locator('input')).toHaveValue('2');break;}
 case 'related-questions': {const details=root.locator('details').last();await disclosure(page,details,expect);await root.locator('input').fill('MARKUP');await expect(root.locator('details:not([hidden])')).toHaveCount(1);break;}
 case 'local-places': {const day=root.locator('.iui-local-business select');await selectLast(day);await expect(root.locator('.iui-business-day:not([hidden])')).toHaveCount(1);const dining=root.locator('.iui-restaurant-reviews');await dining.locator('input').fill('SOUP');await expect(dining.locator('.iui-dining-review:not([hidden])')).toHaveCount(1);break;}
 case 'flight-discovery': {await root.locator('.iui-flight-prepare').click();const b=root.locator('.iui-flight-result-choose').first();await b.click();await expect(b).toHaveAttribute('aria-pressed','true');const sort=root.locator('.iui-flight-results select').last();await sort.selectOption('departure');await expect(sort).toHaveValue('departure');await expect(root.locator('.iui-flight-results-reset')).toHaveAttribute('aria-disabled','false');await root.locator('.iui-flight-results-reset').click();await expect(sort).toHaveValue('source');await expect(b).toHaveAttribute('aria-pressed','true');break;}
 case 'activity-planning': {await root.locator('.iui-activity-choose').first().click();await root.locator('.iui-activity-review').click();await expect(root.locator('.iui-activity-choose').first()).toHaveAttribute('aria-pressed','true');await root.locator('.iui-event-review').click();await root.locator('.iui-activity-reset').click();await expect(root.locator('.iui-activity-choose').first()).toHaveAttribute('aria-pressed','false');break;}
 case 'vocabulary-tools': {await root.locator('.iui-word-reveal').click();await expect(root.locator('.iui-word-meaning')).toBeVisible();const b=root.locator('[data-mark=known]');await b.click();await expect(b).toHaveAttribute('aria-pressed','true');const preview=root.locator('textarea');await expect(preview).toHaveValue('serendipity\n明亮');await root.locator('.iui-copy-toolbar button').first().click();await expect(preview).toHaveValue('serendipity\ncuriosity\n明亮');/* System clipboard write/permissions remain canonical-browser scope. */break;}
 case 'source-citations': {const blocks=root.locator('.iui-source-citation');await blocks.nth(0).locator('.iui-citation-select').click();const code=document.body[0],expected=code.lines.slice(code.citedStart-code.startLine,code.citedEnd-code.startLine+1).join('\n');await expect(blocks.nth(0).locator('textarea')).toHaveValue(expected);const file=blocks.nth(1);await file.locator('.iui-citation-select').click();await expect(file.locator('textarea')).toBeVisible();await selectLast(file.locator('select'));await expect(file.locator('textarea')).toBeHidden();break;}
 case 'entity-facts': {const facts=root.locator('.iui-sidebar-facts');await facts.locator('input').fill('height');await expect(facts.locator('tbody tr:not([hidden])')).toHaveCount(1);const b=root.locator('.iui-entity-thumbnail-choice').first();await b.click();await expect(b).toHaveAttribute('aria-pressed','true');const list=root.locator('.iui-entity-thumbnails');await list.locator('input').fill('no matching entity');await expect(list.locator('.iui-entity-detail-panel:not([hidden])')).toBeVisible();await expect(list.locator('.iui-entity-selection-status')).toContainText('outside the current filters');break;}
 default: throw Error('Missing authored browser consumer '+entry.name);
 }
}
export function parseOptions(args) {
  assert.equal(args.length,6,'Require --library PATH --revision ACTUAL_SHA --screenshots DIRECTORY');
  const options={}, allowed=new Set(['--library','--revision','--screenshots']);
  for(let i=0;i<args.length;i+=2) {
    assert.ok(allowed.has(args[i]) && !Object.hasOwn(options,args[i]) && args[i+1] && !args[i+1].startsWith('--'),'Unknown, duplicate or empty option');
    options[args[i]]=args[i+1];
  }
  assert.match(options['--revision']??'',/^[a-f0-9]{40}$/,'Actual workflow checkout SHA required');
  return {library:path.resolve(options['--library']),revision:options['--revision'],screenshots:path.resolve(options['--screenshots'])};
}
export async function run({library,revision,screenshots}) {
  assert.equal(git(library,'rev-parse','HEAD'),revision,'Actual core checkout does not match --revision');
  assert.equal(git(library,'status','--porcelain'),'','Clean core checkout required');
  // The unique producer, not this smoke script, owns the reviewed source/build
  // equivalence proof and final asset/core/Skill SHA/tree + script/example lock.
  const documents=await verifyExampleInputs();
  const exampleLanguages=Object.fromEntries(examples.map(entry=>[entry.name,entry.lang]));
  for(const lang of Object.values(exampleLanguages))assert.ok(lang==='en'||lang==='zh-CN','Only en/zh-CN example languages supported');
  const require=createRequire(await ordinaryFile(library,'package.json'));
  const {chromium,expect}=require('@playwright/test');
  const {validateDocument,compileHtml}=await import(pathToFileURL(await ordinaryFile(library,'dist/index.js')).href);
  for(const [name,document] of documents) assert.equal(validateDocument(document).ok,true,'Invalid example: '+name);
  await mkdir(screenshots,{recursive:true});
  assert.equal((await lstat(screenshots)).isSymbolicLink(),false,'Real evidence directory required');
  assert.deepEqual(await readdir(screenshots),[],'Fresh empty evidence directory required; stale output is not evidence');
  const temporary=await mkdtemp(path.join(tmpdir(),'inform-pending-consumer-'));
  let browser,views=0;
  try {
    browser=await chromium.launch({headless:true,...(process.env.IUI_BROWSER_EXECUTABLE?{executablePath:process.env.IUI_BROWSER_EXECUTABLE}:{})});
    for(const entry of examples) for(const theme of themes) for(const width of widths) {
      const document=documents.get(entry.name), label=`${entry.name}-${theme}-${width}`;
      // Only a fresh in-memory display variant gets the requested theme; original
      // JSON bytes and the sourceRevision are never changed or promoted.
      const html=await compileHtml({...structuredClone(document),theme},{backend:'portable',assets:'inline',lang:entry.lang});
      const file=path.join(temporary,label+'.html'), fileURL=pathToFileURL(file).href;
      await writeFile(file,html,{flag:'wx'});
      const context=await browser.newContext({viewport:{width,height:1050},colorScheme:theme,reducedMotion:'reduce',serviceWorkers:'block'});
      const page=await context.newPage(),errors=[],requests=[];
      page.setDefaultTimeout(10_000);
      page.on('pageerror',error=>errors.push(error.message));
      context.on('request',request=>{if(request.url()!==fileURL&&!request.url().startsWith('data:'))requests.push(request.url());});
      // No request interception, offline masking, consent activation or global
      // overflow-hiding styles: an attempted unsolicited request is a failure.
      try {
        await page.goto(fileURL,{waitUntil:'load'});
        await expect(page.locator('.iui-root')).toHaveCount(1);
        await page.evaluate(()=>document.fonts.ready);
        await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
        await expect(page.locator('.iui-root')).toBeVisible();
        await expect(page.locator('.iui-root')).toHaveAttribute('data-theme',theme);
        await expect(page.locator('html')).toHaveAttribute('lang',entry.lang);
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+': initial whole-page overflow');
        await smokeExample(page,entry,document,expect);
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+': interacted whole-page overflow');
        await expect(page.locator('.iui-root')).toHaveCount(1);
        assert.deepEqual(errors,[],label+': page errors'); assert.deepEqual(requests,[],label+': unsolicited requests');
        await page.screenshot({path:path.join(screenshots,label+'.png'),fullPage:true});
        assert.deepEqual(errors,[],label+': page errors during capture'); assert.deepEqual(requests,[],label+': requests during capture');
        views++; console.log('PASS '+label);
      } catch(error) {
        await writeFile(path.join(screenshots,'FAILURE.json'),JSON.stringify({revision,example:entry.name,theme,width,completedViews:views,error:String(error),pageErrors:errors,requests},null,2)+'\n',{flag:'wx'});
        throw error;
      } finally { await context.close(); }
    }
    assert.equal(views,examples.length*widths.length*themes.length);
    assert.equal(git(library,'status','--porcelain'),'','Consumer changed core checkout');
    await verifyExampleInputs();
    // Producer validates this strict report, all expected original PNGs and their
    // hashes before it may create a shared reuse receipt. No receipt is written here.
    await writeFile(path.join(screenshots,'RESULTS.json'),JSON.stringify({revision,browser:'chromium',widths,themes,localCompiledViews:views,publicCdn:'not-run',exampleLanguages},null,2)+'\n',{flag:'wx'});
    console.log(`PASS ${views} candidate inline smoke views. CDN, manual visual, assistive technology and exhaustive lifecycle acceptance are separate.`);
  } finally { await browser?.close(); await rm(temporary,{recursive:true,force:true}); }
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) await run(parseOptions(process.argv.slice(2)));
