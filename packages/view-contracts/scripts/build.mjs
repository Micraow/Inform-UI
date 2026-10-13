import { build } from 'esbuild';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
const root = existsSync('../component-contract/src/index.ts') ? resolve('../component-contract') : resolve('../inform-v2-component-contract');
await build({ entryPoints:['src/index.ts'], bundle:true, format:'esm', platform:'neutral', outfile:'dist/index.mjs', target:'es2022', sourcemap:true,
  plugins:[{ name:'sibling-contract', setup(b){ b.onResolve({filter:/^@inform\/component-contract(?:\/zod)?$/},args=>({path:resolve(root,args.path.endsWith('/zod')?'src/zod.ts':'src/index.ts')})); } }] });
