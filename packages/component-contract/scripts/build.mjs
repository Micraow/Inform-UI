import { build } from 'esbuild';
await build({ entryPoints: ['src/index.ts'], bundle: true, format: 'esm', platform: 'neutral', outfile: 'dist/index.mjs', target: 'es2022', sourcemap: true });
