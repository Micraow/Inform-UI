import {build} from 'esbuild';
await build({entryPoints:['src/index.ts'],bundle:true,platform:'browser',target:'es2022',format:'esm',outfile:'dist/index.mjs',loader:{'.css':'text'},sourcemap:true});
