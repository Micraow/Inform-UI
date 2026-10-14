import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {mkdir, rm, writeFile} from 'node:fs/promises';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const configPath = path.join(root, 'tsconfig.public.json');
const loaded = ts.readConfigFile(configPath, ts.sys.readFile);
const formatHost = {
  getCanonicalFileName: file => file,
  getCurrentDirectory: () => root,
  getNewLine: () => '\n',
};
function check(diagnostics) {
  if (diagnostics.length) throw new Error(ts.formatDiagnosticsWithColorAndContext(diagnostics, formatHost));
}
check(loaded.error ? [loaded.error] : []);
const config = ts.parseJsonConfigFileContent(loaded.config, ts.sys, root);
check(config.errors);
const output = config.options.outDir;
const emitted = new Map();
const program = ts.createProgram(config.fileNames, config.options);
check(ts.getPreEmitDiagnostics(program));
const result = program.emit(undefined, (file, contents) => emitted.set(path.resolve(file), contents));
check(result.diagnostics);
// JSON implementation modules are intentionally skipped by declaration-only emit.
if (!emitted.size) throw new Error('Public declaration emit produced no declarations');

const inside = (directory, file) => {
  const relative = path.relative(directory, file);
  return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
};
const declarationPath = file => file.replace(/(?:\.d)?\.(?:[cm]?ts|tsx)$/, match =>
  match.endsWith('.mts') ? '.d.mts' : match.endsWith('.cts') ? '.d.cts' : '.d.ts');
const javascriptPath = file => file.replace(/\.d\.([cm]?)ts$/, (_, kind) => `.${kind}js`);
const toOutput = file => path.join(output, path.relative(root, declarationPath(file)));
const sourcePath = file => path.join(root, path.relative(output, file));
const pending = [
  path.join(output, 'src/public/index.d.ts'),
  path.join(output, 'src/public/core.d.ts'),
  path.join(output, 'src/icons/index.d.ts'),
  path.join(output, 'src/icons/all.d.ts'),
  ...[...emitted.keys()].filter(file => inside(path.join(output, 'src/icons/definitions'), file)),
];
const retained = new Map();
const moduleCache = ts.createModuleResolutionCache(root, file => file, config.options);

// Work from the emitted public dependency closure, not the implementation graph.
// This also copies referenced vendored declarations, which tsc does not re-emit.
while (pending.length) {
  const file = pending.pop();
  if (retained.has(file)) continue;
  const source = sourcePath(file);
  const contents = emitted.get(file) ?? ts.sys.readFile(source);
  if (contents === undefined) throw new Error(`Missing declaration: ${path.relative(root, source)}`);
  const ast = ts.createSourceFile(file, contents, ts.ScriptTarget.Latest, true);
  const replacements = [];
  const rewrite = node => {
    const specifier = node.text;
    const resolved = ts.resolveModuleName(specifier, source, config.options, ts.sys, moduleCache).resolvedModule;
    if (!resolved) {
      if (specifier.startsWith('.') || specifier.startsWith('@inform/')) {
        throw new Error(`Unresolved declaration import ${specifier} in ${path.relative(output, file)}`);
      }
      return;
    }
    if (resolved.isExternalLibraryImport || !inside(root, resolved.resolvedFileName)) return;
    const dependency = toOutput(resolved.resolvedFileName);
    if (!/\.d\.[cm]?ts$/.test(dependency)) {
      throw new Error(`Unsupported public declaration dependency: ${specifier}`);
    }
    pending.push(dependency);
    let relative = path.relative(path.dirname(file), javascriptPath(dependency)).split(path.sep).join('/');
    if (!relative.startsWith('.')) relative = `./${relative}`;
    replacements.push({start: node.getStart(ast), end: node.getEnd(), text: JSON.stringify(relative)});
  };
  const visit = node => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      rewrite(node.moduleSpecifier);
    } else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal)) {
      rewrite(node.argument.literal);
    } else if (ts.isExternalModuleReference(node) && node.expression && ts.isStringLiteral(node.expression)) {
      rewrite(node.expression);
    }
    ts.forEachChild(node, visit);
  };
  visit(ast);
  let rewritten = contents;
  for (const replacement of replacements.sort((a, b) => b.start - a.start)) {
    rewritten = rewritten.slice(0, replacement.start) + replacement.text + rewritten.slice(replacement.end);
  }
  retained.set(file, rewritten);
}

await rm(output, {recursive: true, force: true});
for (const [file, contents] of retained) {
  await mkdir(path.dirname(file), {recursive: true});
  await writeFile(file, contents);
}
console.log(`Built ${retained.size} public declarations in ${path.relative(root, output)}`);
