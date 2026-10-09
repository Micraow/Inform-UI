#!/usr/bin/env node
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSchemaSubset, encodeSchema } from './schema-subsets.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
try {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--help') {
    console.log('node scripts/schema-subset.mjs --groups base,finance [--out output/finance.schema.json]\nProduces a closed Document structural subset. Groups are explicit; add base for headings/layout/controls. Run validateDocument for semantic checks.');
    process.exit(0);
  }
  let groups, output;
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    if (!['--groups', '--out'].includes(flag) || !args[i + 1] || args[i + 1].startsWith('--')) throw Error(`Invalid argument: ${flag}`);
    if (flag === '--groups') { if (groups) throw Error('Pass --groups once.'); groups = args[++i].split(',').map(s => s.trim()); }
    else { if (output) throw Error('Pass --out once.'); output = args[++i]; }
  }
  if (!groups || groups.some(group => !group)) throw Error('Use --groups base,finance (or --help).');
  const full = JSON.parse(await readFile(resolve(root, 'src/schema/iui.schema.json'), 'utf8'));
  const index = JSON.parse(await readFile(resolve(root, 'src/schema/fragments/index.json'), 'utf8'));
  const text = encodeSchema(createSchemaSubset(full, index.nodeOwners, groups));
  if (output) { const target = resolve(output); await mkdir(dirname(target), { recursive: true }); await writeFile(target, text); }
  else process.stdout.write(text);
} catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 2; }
