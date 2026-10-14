/** Build the DSL-only package. Historical renderer fixtures are built separately. */
import {build} from 'esbuild';
import {mkdir,copyFile,readdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';

// Emit declarations before bundling to keep peak memory bounded.
execFileSync(process.execPath,['scripts/build-public-types.mjs'],{stdio:'inherit'});
await import('./build-v2.mjs');
await mkdir('dist/public',{recursive:true});
const full='createProfile,createDefaultProfile,createRuntime,createBaseProfile,mount,prompt,version';
const core='createBaseProfile,createRuntime,mount,prompt,version';
for(const [name,target,names] of [
 ['index','node.mjs',full],['browser','inform-ui.js',full],
 ['core-node','core-node.mjs',core],['core','inform-core.js',core]
]) await writeFile(`dist/public/${name}.js`,`export {${names}} from '../v2/${target}';\n`);
// Per-icon modules remain independently importable; no JSON authoring API is exposed.
const icons=(await readdir('src/icons',{recursive:true})).filter(name=>name.endsWith('.ts')&&!name.endsWith('.d.ts')&&!name.endsWith('.d.mts')).map(name=>'src/icons/'+name);
await build({entryPoints:icons,outdir:'dist/icons',outbase:'src/icons',bundle:false,target:'es2022',platform:'neutral',format:'esm',legalComments:'inline',logLevel:'info'});
for(const name of ['svg-policy.mjs','catalog.json','manifest.json','LICENSE','bundle-sizes.json']) await copyFile('src/icons/'+name,'dist/icons/'+name);
