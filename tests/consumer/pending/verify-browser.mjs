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
export const sourceRevision = '5c7f334a975b75b0a70f58b5570b2ea567aed9dc';
export const executionOwner = 'core:scripts/run-batch-consumers.mjs';
export const examples = Object.freeze([
  {
    "name": "carousel-basic",
    "lang": "zh-CN",
    "canonicalIds": [
      "base-carousel"
    ],
    "sha256": "9bdbbbcb68dde0ebe50b5f676952fbaa42f2a4aeb5f2407aa8d9843dad456cfe"
  },
  {
    "name": "carousel",
    "lang": "en",
    "canonicalIds": [
      "base-carousel"
    ],
    "sha256": "62b3cac7dcdfcfc6f7687375bb0377ee0ccc51b7b4cb264ba02c325c40e392cc"
  },
  {
    "name": "code",
    "lang": "en",
    "canonicalIds": [
      "code-block"
    ],
    "sha256": "7d25bee2c2f3e8c5f8b70e445d7478203b9e64bf6e647591a606585a6dfbffc7"
  },
  {
    "name": "pie",
    "lang": "en",
    "canonicalIds": [
      "base-pie-chart"
    ],
    "sha256": "c8fd2a6a95706c525be0d5c0c8809873e67c6df9576a5728fe2866d4acc75b6d"
  },
  {
    "name": "checkbox-practice",
    "lang": "zh-CN",
    "canonicalIds": [
      "base-checkbox"
    ],
    "sha256": "b290013320ebe7560c1e92d3e19d3454852093c62a08000427cca50e1498c297"
  },
  {
    "name": "markdown-subset",
    "lang": "en",
    "canonicalIds": [
      "base-markdown"
    ],
    "sha256": "72f06da11ac69bc95214d7c369779f9485f3cdc7f9d1934aceeedf18061b35a5"
  },
  {
    "name": "date-practice",
    "lang": "zh-CN",
    "canonicalIds": [
      "base-date-picker"
    ],
    "sha256": "8f921053244394ccfe4dac8fc3d8d6528a72dc945a1da90978f5bc4069346ca0"
  },
  {
    "name": "tabs",
    "lang": "zh-CN",
    "canonicalIds": [
      "tab-group"
    ],
    "sha256": "90452ae01385d959e7b50d152e40f4232350720e4cd335a5b571b822e53455b6"
  },
  {
    "name": "tabs-local-state",
    "lang": "zh-CN",
    "canonicalIds": [
      "tab-group"
    ],
    "sha256": "db58e48630836a73022aedf52fb0e93d4e2c3ecfe1492d89d05d8384c9b2a8c0"
  },
  {
    "name": "fill-blank-practice",
    "lang": "zh-CN",
    "canonicalIds": [
      "learning-fill-blank-card"
    ],
    "sha256": "7727b6dc7fc3fb6aee1b1de12a3f13792ea369f5a19b89dfba1abcaaec8d50d4"
  },
  {
    "name": "sentence-builder",
    "lang": "zh-CN",
    "canonicalIds": [
      "learning-sentence-builder-card"
    ],
    "sha256": "6b99215fceaafd94681c1930160f764952262eeb4cd2d252f17071bf23963e8d"
  },
  {
    "name": "checklist",
    "lang": "zh-CN",
    "canonicalIds": [
      "checklist"
    ],
    "sha256": "c5570457a098e07012ea4a47c63ae0d627faed11d3ba3a3476edb063eeba53ff"
  },
  {
    "name": "checklist-form",
    "lang": "zh-CN",
    "canonicalIds": [
      "checklist"
    ],
    "sha256": "e301430d5ee8df81a1030d4d078fbf7204d8a4ee85e1bd93c5fccd3894574283"
  },
  {
    "name": "vocab-card",
    "lang": "en",
    "canonicalIds": [
      "learning-vocab-card"
    ],
    "sha256": "d4c646a2a2b8ee34a0a949f1d3c7a3125dbf9b778245230b8a67a8f0a400ea95"
  },
  {
    "name": "rating",
    "lang": "zh-CN",
    "canonicalIds": [
      "rating"
    ],
    "sha256": "e17dcaca6ebc422b78a692bbc4cc2741fff6517fb9813775563062c97f828b9a"
  },
  {
    "name": "favicon",
    "lang": "zh-CN",
    "canonicalIds": [
      "base-favicon"
    ],
    "sha256": "2efcc04ebf1a220126777e5bd37741b05a8fd9e9dfa3761aa3d2dcd4a93f9d68"
  },
  {
    "name": "agenda",
    "lang": "zh-CN",
    "canonicalIds": [
      "calendar-agenda"
    ],
    "sha256": "c283ddc5005fa0c7e9465e14ad791628ae598524697e19678a3a9f919302974f"
  },
  {
    "name": "button-actions",
    "lang": "en",
    "canonicalIds": [
      "base-button"
    ],
    "sha256": "229aa8348b5ca7d13af1b5be91496370e07a5be69015d83cd94989abe42c64d3"
  },
  {
    "name": "restaurant-menu",
    "lang": "zh-CN",
    "canonicalIds": [
      "restaurant-menu"
    ],
    "sha256": "44029f7b482a7f0889efe8301ba65097dc0bb82ef557634721d80430b0ebfe62"
  },
  {
    "name": "prompt-suggestions",
    "lang": "en",
    "canonicalIds": [
      "prompt-suggestions"
    ],
    "sha256": "30ffba1fedb1ac803933edc7279119ecec1cef5825316a5ea4b416068da0a491"
  },
  {
    "name": "field-labels",
    "lang": "zh-CN",
    "canonicalIds": [
      "base-label"
    ],
    "sha256": "5e880fb34f11dcfd4fa365d5292b8914cc40638a2f1b3d5deb575da9f1a62715"
  },
  {
    "name": "person-profile",
    "lang": "en",
    "canonicalIds": [
      "person-profile"
    ],
    "sha256": "b9953ee7eb878c2ec6701d8122e630757fd9bbfc764d7b4f64408314a356cdf7"
  },
  {
    "name": "writing-block",
    "lang": "en",
    "canonicalIds": [
      "writing-block"
    ],
    "sha256": "9a4cb5f85ad658eabb38c9b4ca4c5ec3bee2160228d56615a24fe87c73244cfb"
  },
  {
    "name": "news-article",
    "lang": "zh-CN",
    "canonicalIds": [
      "news-article"
    ],
    "sha256": "0fe3014f77bb8e8711d9500073edc6d94630c8048123f56bcd72f2a5d10026b2"
  },
  {
    "name": "entity-reviews",
    "lang": "en",
    "canonicalIds": [
      "entity-reviews"
    ],
    "sha256": "3110ff0a7d7c3f99163c1bc8f91cce56e1180c8cff420a057fc7766fafaba022"
  },
  {
    "name": "restaurant-availability",
    "lang": "en",
    "canonicalIds": [
      "restaurant-availability"
    ],
    "sha256": "2fdbe7fbf7ba52ab0f9720e0c3178e6619bd635b4a4f0d436d829d5f235b1ec2"
  },
  {
    "name": "reddit-thread-card",
    "lang": "en",
    "canonicalIds": [
      "reddit-thread-card"
    ],
    "sha256": "c731fa907f7f7a4ff5d6cbf0c1aff28f8491ee125615e9e6d87b6f86cd8b9d50"
  },
  {
    "name": "motion",
    "lang": "en",
    "canonicalIds": [
      "base-animate",
      "base-celebration"
    ],
    "sha256": "6507e34ffd1a7a5393cb90ba0071b8d63d0a7d293a9c4161f0daddc9be261094"
  },
  {
    "name": "email-draft",
    "lang": "en",
    "canonicalIds": [
      "email-draft"
    ],
    "sha256": "212e9225d8fab7b93f026d2b3a57be7d498684c6398bdcdebf87b3ca2eb144c5"
  },
  {
    "name": "task-expansion-card",
    "lang": "en",
    "canonicalIds": [
      "task-expansion-card"
    ],
    "sha256": "43159c25c41b9a4c21ba949a5066c3bc9584a2740360d529c57e1cd61b4b8ae0"
  },
  {
    "name": "location-choice-request",
    "lang": "en",
    "canonicalIds": [
      "location-choice-request"
    ],
    "sha256": "179643391d8c819c10d4fb4680a70dd9b52cba50c32740168a5d506f4e4fcb0a"
  },
  {
    "name": "business-gallery",
    "lang": "en",
    "canonicalIds": [
      "business-gallery"
    ],
    "sha256": "e49b06edd496298b8c9413782a8951c660afa371b460bf1bb77abe80942b47a2"
  }
].map(Object.freeze));
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
async function carousel(page, entry, expect) {
  const shell = page.locator('.iui-carousel-shell').first();
  const rail = shell.locator('.iui-carousel');
  const previous = shell.locator('.iui-carousel-previous'), next = shell.locator('.iui-carousel-next');
  await expect(previous).toHaveAttribute('aria-disabled', 'true');
  const initial = await rail.evaluate(el => el.scrollLeft);
  await key(page, previous, 'Enter', expect);
  await page.keyboard.press('Space');
  await nativePointer(page, previous, expect);
  expect(await rail.evaluate(el => el.scrollLeft)).toBe(initial);
  await expect(previous).toBeFocused();
  const geometry = await rail.evaluate(el => ({width:el.clientWidth, max:el.scrollWidth-el.clientWidth}));
  expect(geometry.max).toBeGreaterThan(0);
  await key(page, next, 'Enter', expect);
  await expect.poll(() => rail.evaluate(el => el.scrollLeft)).toBeCloseTo(Math.min(geometry.width, geometry.max), 0);
  await expect(next).toBeFocused();
  // Finite rail, no autoplay or wrapping. Bound iterations by its supplied extent.
  for (let i = 0; i <= Math.ceil(geometry.max/geometry.width) && await next.getAttribute('aria-disabled') === 'false'; i++) {
    await nativePointer(page, next, expect);
  }
  await expect(next).toHaveAttribute('aria-disabled', 'true');
  const end = await rail.evaluate(el => el.scrollLeft);
  await key(page, next, 'Space', expect);
  await nativePointer(page, next, expect);
  expect(await rail.evaluate(el => el.scrollLeft)).toBe(end);
  await expect(next).toBeFocused();
  for (let i = 0; i <= Math.ceil(geometry.max/geometry.width) && await previous.getAttribute('aria-disabled') === 'false'; i++) {
    await nativePointer(page, previous, expect);
  }
  await expect(previous).toHaveAttribute('aria-disabled', 'true');
  await expect.poll(() => rail.evaluate(el => el.scrollLeft)).toBe(0);
  if (entry.name === 'carousel') {
    await expect(page.locator('[id$="-empty-rail"] .iui-carousel-position')).toHaveText('No items');
    await expect(page.locator('[id$="-single-rail"] button')).toHaveCount(0);
    const field = shell.getByLabel('Quantity');
    await field.fill('9'); await field.blur();
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await key(page, next, 'Enter', expect);
    await key(page, previous, 'Enter', expect);
    await expect(field).toHaveValue('9');
    await expect(field).toHaveAttribute('aria-invalid', 'true');
  }
}
async function tabs(page, entry, expect) {
  const first = page.getByRole('tab', {name:'概览', exact:true});
  const last = page.getByRole('tab', {name:'参考与代码', exact:true});
  await expect(page.getByRole('tab', {name:'暂不可用', exact:true})).toBeDisabled();
  if (entry.name === 'tabs-local-state') await page.getByRole('spinbutton').fill('3');
  await key(page, first, 'ArrowRight', expect);
  await expect(last).toBeFocused(); await expect(last).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Home'); await expect(first).toBeFocused();
  await expect(first).toHaveAttribute('aria-selected', 'true');
  if (entry.name === 'tabs-local-state') {
    await expect(page.getByRole('spinbutton')).toHaveValue('3');
    await page.getByRole('button', {name:'练习说明', exact:true}).click();
    await expect(page.locator('.iui-overlay-popover')).toHaveAttribute('data-open', 'true');
    await last.click();
    await expect(page.locator('.iui-overlay-popover')).toHaveAttribute('data-open', 'false');
    await expect(last).toBeFocused();
    await page.keyboard.press('Home');
  }
  await key(page, first, 'End', expect); await expect(last).toBeFocused();
  await last.click(); await last.click();
  await expect(page.getByRole('tabpanel')).toHaveCount(1);
  await page.keyboard.press('Home'); await expect(first).toBeFocused();
}

export async function smokeExample(page, entry, document, expect) {
  switch (entry.name) {
    case 'carousel-basic': case 'carousel': await carousel(page, entry, expect); break;
    case 'tabs': case 'tabs-local-state': await tabs(page, entry, expect); break;
    case 'checkbox-practice': {
      const form=page.getByRole('form', {name:'练习设置'}), field=form.getByRole('checkbox', {name:'启用本次练习'});
      await expect(field).not.toBeChecked(); await form.getByRole('button', {name:'保存设置'}).click();
      await expect(form).toHaveAttribute('data-status','invalid'); await expect(field).toBeFocused();
      await page.keyboard.press('Space'); await expect(field).toBeChecked();
      await form.getByRole('button', {name:'保存设置'}).click(); await expect(form).toHaveAttribute('data-status','success');
      await form.getByRole('button', {name:'恢复初值'}).click(); await expect(field).not.toBeChecked();
      await expect(field).toHaveAttribute('aria-invalid','false'); break;
    }
    case 'checklist': case 'checklist-form': {
      const boxes=page.locator('.iui-checklist input[type=checkbox]');
      await expect(boxes).toHaveCount(3); await expect(boxes.last()).toBeDisabled();
      await key(page, boxes.first(), 'Space', expect); await expect(boxes.first()).toBeChecked();
      await expect(boxes.first()).toBeFocused();
      if (entry.name==='checklist') {
        const toggle=page.getByRole('checkbox', {name:'锁定这份清单'});
        await toggle.click(); for (const box of await boxes.all()) await expect(box).toBeDisabled();
        await toggle.click(); await expect(boxes.first()).toBeChecked();
        await page.getByRole('button', {name:'恢复全部初值'}).click();
      } else {
        await page.getByRole('button', {name:'检查并保存本页'}).click();
        await expect(page.getByRole('form')).toHaveAttribute('data-status','success');
        await page.getByRole('button', {name:'取消并恢复'}).click();
      }
      await expect(boxes.first()).not.toBeChecked(); await expect(boxes.last()).toBeDisabled(); break;
    }
    case 'date-practice': {
      const form=page.getByRole('form', {name:'本地日期练习'}), field=form.locator('input[data-bind=practiceDate]');
      const label=page.locator(`label[for="${await field.getAttribute('id')}"]`);
      await label.click(); await expect(field).toBeFocused();
      await field.fill(''); await form.getByRole('button', {name:'检查日期'}).click();
      await expect(form).toHaveAttribute('data-status','invalid'); await expect(field).toBeFocused();
      await field.fill('2024-12-31'); await form.getByRole('button', {name:'检查日期'}).click();
      await expect(form).toHaveAttribute('data-status','success');
      await field.fill('2025-01-01'); await form.getByRole('button', {name:'检查日期'}).click();
      await expect(form).toHaveAttribute('data-status','invalid');
      await form.getByRole('button', {name:'恢复初值'}).click(); await expect(field).toHaveValue('2024-02-29');
      await page.getByRole('checkbox', {name:'停用可选日期'}).click();
      await expect(form.locator('input[data-bind=optionalDate]')).toBeDisabled(); break;
    }
    case 'code': {
      const main=page.locator('[id$="-main-code"]'), pre=main.locator('pre');
      expect(await pre.locator('code').textContent()).toBe(document.body.find(n=>n.id==='main-code').value);
      await key(page, pre, 'ArrowRight', expect);
      await expect.poll(()=>pre.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0); await expect(pre).toBeFocused();
      const unknown=page.locator('[id$="-unknown-code"]');
      expect(await unknown.locator('code').textContent()).toBe(document.body.find(n=>n.id==='unknown-code').value);
      await expect(unknown.locator('script,img')).toHaveCount(0);
      // No OS clipboard action. Copy/pending lifecycle is owned by canonical code specs.
      break;
    }
    case 'markdown-subset': {
      const root=page.locator('[data-iui=markdown]');
      await expect(root.locator('h1,h2,h3,h4,h5,h6')).toHaveCount(6);
      await expect(root.locator('img,script')).toHaveCount(0);
      await expect(root).toContainText('![Images remain literal]');
      const link=root.getByRole('link', {name:'Example source'});
      await link.focus(); await expect(link).toBeFocused(); await expect(link).toHaveAttribute('href','https://example.test/read'); break;
    }
    case 'pie': {
      const figure=page.locator('.iui-pie').first(), graphic=figure.locator('svg'), output=figure.locator('output');
      await key(page, graphic, 'Home', expect); await expect(output).toContainText('Alpha');
      await page.keyboard.press('End'); await expect(output).toContainText('Missing');
      await page.keyboard.press('ArrowLeft'); await expect(output).toContainText('Zero'); await expect(graphic).toBeFocused();
      await figure.locator('summary').click(); await expect(figure.locator('tbody tr')).toHaveCount(4);
      await expect(page.locator('.iui-pie').nth(1).locator('path')).toHaveCount(1); break;
    }
    case 'fill-blank-practice': {
      const root=page.locator('.iui-fill-blank'), fields=root.getByRole('textbox');
      await root.getByRole('button', {name:'检查答案',exact:true}).click();
      await expect(root).toHaveAttribute('data-state','incomplete'); await expect(fields.first()).toBeFocused();
      await page.keyboard.insertText('合成'); await page.keyboard.press('Tab'); await expect(fields.nth(1)).toBeFocused();
      await page.keyboard.insertText('参考'); await page.keyboard.press('Tab'); await expect(fields.nth(2)).toBeFocused();
      await page.keyboard.insertText('不同'); await page.keyboard.press('Enter');
      await expect(root.getByRole('status')).toContainText('3 / 3');
      await page.getByRole('button',{name:'只更新其他状态'}).click(); await expect(fields.nth(1)).toHaveValue('参考');
      await root.getByRole('button',{name:'查看参考答案'}).click(); await expect(root).toHaveAttribute('data-state','reference');
      await expect(root.getByRole('button',{name:'重新开始'})).toBeFocused(); await page.keyboard.press('Enter');
      await expect(fields.first()).toBeFocused(); for (const input of await fields.all()) await expect(input).toHaveValue(''); break;
    }
    case 'sentence-builder': {
      const root=page.locator('.iui-sentence-builder').first();
      for (const id of document.body[0].answer) await key(page,root.locator(`[data-sentence-action=add][data-token-id=${id}]`),'Enter',expect);
      await root.locator('[data-sentence-action=check]').click(); await expect(root).toHaveAttribute('data-attempt','correct');
      const earlier=root.locator('[data-sentence-action=earlier]').first(); await expect(earlier).toHaveAttribute('aria-disabled','true');
      await key(page,earlier,'Space',expect); await nativePointer(page,earlier,expect);
      expect(await root.locator('.iui-sentence-builder-chosen > li').evaluateAll(nodes=>nodes.map(n=>n.dataset.tokenId))).toEqual(document.body[0].answer);
      await root.locator('[data-sentence-action=retry]').click(); await expect(root.locator('.iui-sentence-builder-chosen > li')).toHaveCount(0);
      await expect(root.locator('[data-sentence-action=add]').first()).toBeFocused(); break;
    }
    case 'vocab-card': {
      const root=page.locator('.iui-vocab-card'), action=name=>root.locator(`[data-vocab-action=${name}]`);
      await key(page,action('reveal'),'Enter',expect); await expect(root.locator('.iui-vocab-details')).toBeVisible();
      await key(page,action('again'),'Space',expect); await expect(action('again')).toHaveAttribute('aria-pressed','true');
      await action('familiar').click(); await page.keyboard.press('Enter'); await expect(action('familiar')).toHaveAttribute('aria-pressed','true');
      await page.getByRole('button',{name:'Change unrelated state'}).click(); await expect(action('familiar')).toHaveAttribute('aria-pressed','true');
      await key(page,action('reset'),'Enter',expect); await expect(action('reset')).toBeFocused();
      await expect(root.locator('.iui-vocab-details')).toBeHidden(); break;
    }
    case 'rating': {
      const root=page.getByRole('group',{name:'清晰程度',exact:true}), radios=root.getByRole('radio'), clear=root.getByRole('button');
      await radios.nth(2).click(); await expect(radios.nth(2)).toBeChecked();
      await page.keyboard.press('ArrowRight'); await expect(radios.nth(3)).toBeChecked(); await expect(radios.nth(3)).toBeFocused();
      await clear.click(); await expect(clear).toHaveAttribute('aria-disabled','true');
      await page.keyboard.press('Space'); await nativePointer(page,clear,expect);
      await expect(root.locator('input:checked')).toHaveCount(0); await expect(clear).toBeFocused();
      await page.getByRole('checkbox',{name:'暂时停用清晰程度评分'}).click();
      for (const radio of await radios.all()) await expect(radio).toBeDisabled();
      await page.getByRole('button',{name:'恢复初始评分'}).click(); await expect(radios.first()).toBeEnabled(); break;
    }
    case 'favicon': {
      const icons=page.locator('.iui-favicon'); await expect(icons).toHaveCount(4);
      await expect(icons.nth(1)).toHaveAttribute('data-state','loaded');
      const remote=icons.last(); await expect(remote).toHaveAttribute('data-state','fallback'); await expect(remote.locator('img')).toHaveCount(0);
      await page.getByRole('button',{name:'仅更新其他状态'}).click(); await expect(remote).toHaveAttribute('data-state','fallback');
      await remote.getByRole('button').focus(); await expect(remote.getByRole('button')).toBeFocused();
      // Deliberately do not activate the remote-image consent control.
      break;
    }
    case 'agenda': {
      const root=page.locator('.iui-agenda').first(), select=root.locator('select'), details=root.locator('[data-event-id=discussion] details');
      await disclosure(page,details,expect);
      await key(page,select,'Home',expect); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
      await expect(select).toHaveValue('2026-10-09'); await expect(select).toBeFocused();
      // Enter may open Chromium's native select popup after arrow selection.
      // Dismiss it through the keyboard before later selection and capture;
      // the committed value and native focus must survive dismissal.
      await page.keyboard.press('Escape');
      await expect(select).toHaveValue('2026-10-09'); await expect(select).toBeFocused();
      await expect(root.locator('[data-event-id=review]')).toBeHidden();
      await select.selectOption('2026-10-16'); await select.selectOption('2026-10-09'); await expect(details).toHaveAttribute('open','');
      await select.selectOption(''); await expect(root.locator('.iui-agenda-date:not([hidden])')).toHaveCount(2); break;
    }
    case 'button-actions': {
      const set=page.getByRole('button',{name:'Set count to two',exact:true});
      await key(page,set,'Enter',expect); await page.keyboard.press('Space'); await expect(page.locator('.iui-metric-value')).toHaveText('2');
      await page.getByRole('checkbox',{name:'Disable actions'}).click(); await expect(set).toBeDisabled();
      await nativePointer(page,set,expect); await expect(page.locator('.iui-metric-value')).toHaveText('2');
      await page.getByRole('button',{name:'Reset document state',exact:true}).click(); await expect(set).toBeEnabled(); await expect(page.locator('.iui-metric-value')).toHaveText('1');
      const host=page.getByRole('button',{name:'Run host action',exact:true}); await key(page,host,'Enter',expect);
      await expect(page.locator('.iui-button-host')).toHaveAttribute('data-status','unavailable'); await expect(host).toBeFocused(); break;
    }
    case 'restaurant-menu': {
      const root=page.locator('.iui-menu'), search=root.getByRole('searchbox'), select=root.getByRole('combobox'), clear=root.getByRole('button',{name:'清除搜索'});
      await root.locator('summary').click(); await search.fill('香草'); await expect(root.locator('.iui-menu-item:visible')).toHaveCount(2);
      await select.selectOption('drinks'); await expect(root.locator('.iui-menu-item:visible')).toHaveCount(1);
      await key(page,clear,'Space',expect); await expect(search).toBeFocused(); await expect(search).toHaveValue('');
      await expect(select).toHaveValue(''); await expect(root.locator('details')).toHaveAttribute('open','');
      await expect(root.locator('[data-item-id=water] .iui-menu-price')).toHaveText('0 CNY');
      await expect(root.locator('[data-item-id=soup] .iui-menu-price')).toHaveText('未提供价格'); break;
    }
    case 'prompt-suggestions': {
      const root=page.locator('.iui-suggestions'), choices=root.locator('.iui-suggestions-choice'), more=root.locator('[data-suggestions-action=expand]'), clear=root.locator('[data-suggestions-action=clear]');
      await page.evaluate(()=>{window.pendingEvents=[];document.getElementById('iui').addEventListener('iui:suggestion',e=>window.pendingEvents.push({detail:e.detail,cancelable:e.cancelable}));});
      await key(page,choices.first(),'Space',expect); await expect(choices.first()).toHaveAttribute('aria-pressed','true');
      expect(await page.evaluate(()=>window.pendingEvents)).toEqual([{detail:{componentId:'reading-ideas',suggestionId:'outline',text:document.body[0].items[0].text},cancelable:true}]);
      await key(page,more,'Enter',expect); await choices.last().click();
      await key(page,more,'Space',expect); await expect(choices.last()).toBeHidden(); await expect(choices.last()).toHaveAttribute('aria-pressed','true');
      await key(page,clear,'Enter',expect); await expect(clear).toHaveAttribute('aria-disabled','true');
      await nativePointer(page,clear,expect); await page.keyboard.press('Space');
      expect(await page.evaluate(()=>window.pendingEvents.length)).toBe(2); await expect(clear).toBeFocused(); break;
    }
    case 'field-labels': {
      const labels=page.locator('[data-iui=label]');
      for (const label of await labels.all()) {
        const id=await label.getAttribute('for'); assert.ok(id);
        const field=page.locator(`[id="${id}"]`); await label.click(); await expect(field).toBeFocused();
      }
      const slider=page.getByRole('slider'); await key(page,slider,'End',expect); await expect(slider).toHaveValue('10');
      await expect(page.locator('input[data-bind=consent]')).toBeChecked(); break;
    }
    case 'person-profile': {
      const profiles=page.locator('.iui-person-profile'); await disclosure(page,profiles.first().locator('details'),expect);
      await expect(profiles.nth(1).locator('details')).toHaveAttribute('open','');
      await expect(profiles.first()).toHaveAccessibleName('Alex River (fictional)'); break;
    }
    case 'writing-block': {
      const root=page.locator('[id$="-main-draft"]'), field=root.getByRole('textbox'), original=document.body[0].value.replace(/\r\n?/g,'\n');
      await expect(field).toHaveValue(original); await field.fill('Original local edit 😀'); await expect(root).toHaveAttribute('data-dirty','true');
      await page.getByRole('button',{name:'Unrelated shared state'}).click(); await expect(field).toHaveValue('Original local edit 😀');
      await root.locator('[data-writing-action=select]').click(); await expect(field).toBeFocused();
      expect(await field.evaluate(el=>[el.selectionStart,el.selectionEnd])).toEqual([0,'Original local edit 😀'.length]);
      await root.locator('[data-writing-action=revert]').click(); await expect(field).toHaveValue(original); await expect(field).toBeFocused();
      const readonly=page.locator('[id$="-readonly-draft"] textarea'); await readonly.focus(); await page.keyboard.type('blocked');
      await expect(readonly).toHaveValue(document.body[1].value); break;
    }
    case 'news-article': {
      const articles=page.locator('[data-iui=news-article]'); await disclosure(page,articles.first().locator('details'),expect);
      await expect(articles.nth(1).locator('details')).toHaveCount(0); await expect(articles.nth(2).locator('details')).toHaveAttribute('open','');
      await expect(articles.first().locator('time')).toHaveText('2024-02-29'); break;
    }
    case 'entity-reviews': {
      const root=page.locator('.iui-reviews').first(), filter=root.locator('.iui-reviews-filter'), sort=root.locator('.iui-reviews-sort');
      const details=root.locator('[data-review-id=five] details'); await disclosure(page,details,expect);
      await key(page,filter,'Home',expect); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
      await expect(filter).toHaveValue('rated'); await expect(filter).toBeFocused(); await expect(root.locator('.iui-reviews-item:not([hidden])')).toHaveCount(3);
      await sort.selectOption('lowest'); await expect(root.locator('.iui-reviews-item').first()).toHaveAttribute('data-review-id','one');
      await filter.selectOption('unrated'); await expect(root.locator('.iui-reviews-item:not([hidden])')).toHaveCount(1);
      await expect(root.locator('.iui-reviews-item:not([hidden])')).toHaveAttribute('data-review-id','unrated');
      await filter.selectOption('all'); await expect(details).toHaveAttribute('open',''); break;
    }
    case 'restaurant-availability': {
      const root=page.locator('.iui-availability').first(), select=root.locator('select'), clear=root.locator('.iui-availability-clear');
      const choice=id=>root.locator(`[data-slot-id=${id}] button`);
      await page.evaluate(()=>{window.pendingEvents=[];document.getElementById('iui').addEventListener('iui:reservation-choice',e=>window.pendingEvents.push(e.detail));});
      await expect(choice('unavailable')).toBeDisabled(); await nativePointer(page,choice('unavailable'),expect);
      expect(await page.evaluate(()=>window.pendingEvents.length)).toBe(0);
      await choice('early').click(); await expect(choice('early')).toHaveAttribute('aria-pressed','true');
      await key(page,select,'End',expect); await page.keyboard.press('Enter'); await expect(select).toHaveValue('2026-10-10');
      await expect(choice('early')).toBeHidden(); await expect(root.locator('.iui-availability-selection')).toContainText('2026-10-09 18:00');
      await key(page,choice('next'),'Enter',expect); await page.keyboard.press('Space');
      expect(await page.evaluate(()=>window.pendingEvents.length)).toBe(3);
      await clear.click(); await expect(clear).toHaveAttribute('aria-disabled','true'); await nativePointer(page,clear,expect); await page.keyboard.press('Space');
      expect(await page.evaluate(()=>window.pendingEvents.length)).toBe(3); await expect(clear).toBeFocused();
      await expect(root.locator('.iui-availability-note')).toContainText('no reservation is made'); break;
    }
    case 'reddit-thread-card': {
      const root=page.locator('.iui-thread').first(), top=root.locator('.iui-thread-discussion'), replies=root.locator('.iui-thread-replies');
      await key(page,top.locator(':scope > summary'),'Enter',expect);
      for (const summary of await replies.locator(':scope > summary').all()) await key(page,summary,'Enter',expect);
      await expect(root.locator('details[open]')).toHaveCount(4);
      await top.locator(':scope > summary').click(); await top.locator(':scope > summary').click();
      await expect(root.locator('details[open]')).toHaveCount(4);
      const last=replies.last().locator(':scope > summary'); await key(page,last,'Space',expect); await page.keyboard.press('Space');
      await expect(last).toBeFocused(); await expect(replies.last()).toHaveAttribute('open',''); break;
    }
    case 'motion': {
      const widgets=page.locator('.iui-motion'); await expect(widgets).toHaveCount(3);
      await expect(widgets.nth(2).locator('button')).toHaveCount(0);
      await disclosure(page,widgets.first().locator('details'),expect);
      for(const widget of [widgets.first(),widgets.nth(1)]) {
        const preview=widget.locator('.iui-motion-preview'), stop=widget.locator('.iui-motion-stop');
        await expect(widget).toHaveAttribute('data-status','idle'); await expect(stop).toHaveAttribute('aria-disabled','true');
        await key(page,stop,'Enter',expect); await nativePointer(page,stop,expect); await expect(widget).toHaveAttribute('data-status','idle');
        await key(page,preview,'Enter',expect); await expect(widget).toHaveAttribute('data-status','reduced');
        await page.keyboard.press('Space'); await expect(preview).toBeFocused(); await expect(widget).toHaveAttribute('data-status','reduced');
        await expect(widget.locator('[role=status]')).toHaveText('Reduced motion is on. Content stays static.');
        await expect(stop).toHaveAttribute('aria-disabled','true');
      }
      await expect(widgets.first().locator('details')).toHaveAttribute('open','');
      expect(await page.evaluate(()=>document.getAnimations().filter(animation=>animation.playState==='running').length)).toBe(0);
      // This suite explicitly uses reduced motion. Real WAAPI execution and
      // completion/cancellation belong to the canonical motion browser specs.
      break;
    }
    case 'email-draft': {
      const drafts=page.locator('.iui-email-draft'), first=drafts.first(), body=first.getByRole('textbox');
      const original=document.body[0].body.replace(/\r\n?/g,'\n');
      await expect(drafts).toHaveCount(3); await expect(body).toHaveValue(original);
      expect(await first.locator('.iui-email-recipients').first().locator('li').allTextContents()).toEqual(document.body[0].to);
      await body.fill('Original locally edited body 😀'); await first.locator('[data-writing-action=select]').click();
      await expect(body).toBeFocused(); expect(await body.evaluate(el=>[el.selectionStart,el.selectionEnd])).toEqual([0,'Original locally edited body 😀'.length]);
      await first.locator('[data-writing-action=revert]').click(); await expect(body).toHaveValue(original); await expect(body).toBeFocused();
      await expect(first.locator('.iui-email-subject')).toHaveText(document.body[0].subject);
      await expect(drafts.nth(1).getByRole('textbox')).toHaveValue('');
      const readonly=drafts.nth(2).getByRole('textbox'); await readonly.focus(); await page.keyboard.type('blocked');
      await expect(readonly).toHaveValue(document.body[2].body); await expect(drafts.locator('a')).toHaveCount(0);
      // No Copy activation, Clipboard permission, mail provider or send action.
      break;
    }
    case 'task-expansion-card': {
      const root=page.locator('[id$="-main-plan"]'), boxes=root.getByRole('checkbox'), reset=root.locator('.iui-task-review-reset'), details=root.locator('details').first();
      await expect(boxes).toHaveCount(3); await expect(boxes.first()).toBeChecked(); await expect(boxes.nth(1)).not.toBeChecked();
      await disclosure(page,details,expect); await key(page,boxes.nth(1),'Space',expect); await expect(boxes.nth(1)).toBeChecked();
      await expect(root.locator('.iui-task-review-count')).toHaveText('2 of 3 steps marked reviewed');
      await key(page,reset,'Enter',expect); await expect(reset).toBeFocused(); await expect(boxes.first()).toBeChecked(); await expect(boxes.nth(1)).not.toBeChecked();
      await expect(reset).toHaveAttribute('aria-disabled','true'); await page.keyboard.press('Space'); await nativePointer(page,reset,expect);
      await expect(reset).toBeFocused(); await expect(root.locator('.iui-task-review-count')).toHaveText('1 of 3 steps marked reviewed');
      await expect(details).toHaveAttribute('open',''); await expect(root.locator('[name],[data-bind]')).toHaveCount(0);
      await expect(root.locator('.iui-task-review-note')).toContainText('not that tasks were performed'); break;
    }
    case 'location-choice-request': {
      const root=page.locator('.iui-location-choice'), choices=root.locator('.iui-location-choice-option'), clear=root.locator('.iui-location-choice-clear');
      await page.evaluate(()=>{window.pendingEvents=[];window.pendingCancel=false;document.getElementById('iui').addEventListener('iui:location-choice',event=>{window.pendingEvents.push({detail:event.detail,bubbles:event.bubbles,cancelable:event.cancelable,composed:event.composed});if(window.pendingCancel)event.preventDefault();});});
      await expect(clear).toHaveAttribute('aria-disabled','true'); await key(page,clear,'Space',expect); await nativePointer(page,clear,expect);
      expect(await page.evaluate(()=>window.pendingEvents.length)).toBe(0);
      await choices.first().click(); await expect(choices.first()).toHaveAttribute('aria-pressed','true');
      expect(await page.evaluate(()=>window.pendingEvents[0])).toEqual({detail:{componentId:'places',optionId:'courtyard',label:'Example courtyard',address:'1 Example Lane'},bubbles:true,cancelable:true,composed:false});
      await page.evaluate(()=>window.pendingCancel=true); await key(page,choices.nth(1),'Enter',expect);
      await expect(root).toHaveAttribute('data-status','not-accepted'); await expect(choices.first()).toHaveAttribute('aria-pressed','true');
      await page.evaluate(()=>window.pendingCancel=false); await key(page,choices.first(),'Space',expect); await choices.last().click();
      expect(await page.evaluate(()=>window.pendingEvents.length)).toBe(4); expect(await page.evaluate(()=>window.pendingEvents[3].detail.address)).toBe(null);
      await clear.click(); await expect(clear).toHaveAttribute('aria-disabled','true'); await page.keyboard.press('Space'); await nativePointer(page,clear,expect);
      expect(await page.evaluate(()=>window.pendingEvents.length)).toBe(4); await expect(clear).toBeFocused();
      await expect(root.locator('.iui-location-choice-note')).toContainText('Choosing one only informs this page.'); break;
    }
    case 'business-gallery': {
      const root=page.locator('.iui-business-gallery'), items=root.locator('.iui-business-gallery-item');
      await expect(items).toHaveCount(3); await expect(root.locator('.iui-business-gallery-caption')).toHaveCount(3);
      for(const item of [items.nth(0),items.nth(1)]) {
        await expect(item.locator('img,[src]')).toHaveCount(0);
        const consent=item.locator('.iui-image-consent button'); await consent.focus(); await expect(consent).toBeFocused();
      }
      const inline=items.nth(2).getByRole('img'); await inline.scrollIntoViewIfNeeded(); await expect(inline).toBeVisible();
      await expect(inline).toHaveAttribute('alt',document.body[0].images[2].alt);
      await expect.poll(()=>inline.evaluate(img=>img.complete&&img.naturalWidth===2&&img.naturalHeight===2)).toBe(true);
      await expect(root.locator('img')).toHaveCount(1);
      await expect(root.locator('.iui-business-gallery-note')).toContainText('have not been verified');
      // The smoke never consents to any remote image. Canonical specs separately
      // intercept synthetic media after native consent to test one-item isolation.
      break;
    }
    default: assert.fail('No smoke owner for ' + entry.name);
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
