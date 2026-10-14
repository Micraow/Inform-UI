import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import ts from 'typescript';

function config(file) {
  const loaded = ts.readConfigFile(file, ts.sys.readFile);
  assert.equal(loaded.error, undefined);
  const parsed = ts.parseJsonConfigFileContent(loaded.config, ts.sys, process.cwd());
  assert.deepEqual(parsed.errors, []);
  return parsed;
}

test('legacy declarations keep their public layout without compiling the separate React source tree', () => {
  const legacy = config('tsconfig.json');
  assert.equal(legacy.options.rootDir, path.resolve('src'));
  assert.ok(legacy.fileNames.includes(path.resolve('src/index.ts')));
  assert.ok(legacy.fileNames.includes(path.resolve('src/browser.ts')));
  assert.ok(legacy.fileNames.every(file => !file.startsWith(path.resolve('src/v2') + path.sep)));
});

test('the React source tree retains strict checking with its own JSX and package aliases', () => {
  const next = config('tsconfig.v2.json');
  assert.equal(next.options.strict, true);
  assert.equal(next.options.jsx, ts.JsxEmit.ReactJSX);
  assert.ok(next.fileNames.includes(path.resolve('src/v2/browser.ts')));
  assert.ok(next.fileNames.includes(path.resolve('packages/chart-extension/src/renderers.tsx')));
  assert.ok(next.options.paths['@inform/component-contract']);
});
