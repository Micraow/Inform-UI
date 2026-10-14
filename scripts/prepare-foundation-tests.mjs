/** Minimal original fixture for the focused foundation browser suite. */
import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('output',{recursive:true});
await writeFile('output/mount.html','<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Foundation test fixture</title><body><main id="host"></main></body></html>\n');
