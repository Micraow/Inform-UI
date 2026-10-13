import {build} from 'esbuild';
await build({entryPoints:['src/index.ts'],bundle:true,format:'esm',platform:'browser',target:'es2022',outfile:'dist/index.js',sourcemap:true,banner:{js:'/*! Portions derived from OpenUI (c) 2011-2024 Thesys Inc., MIT. See THIRD_PARTY_NOTICES.md and vendor/openui/LICENSE. */'}});
