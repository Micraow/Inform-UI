import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/browser',testMatch:['code-foundation.spec.mjs','code-languages.spec.mjs'],
 fullyParallel:false,workers:1,retries:0,
 use:{baseURL:'http://127.0.0.1:4173',browserName:'chromium',viewport:{width:760,height:850}},
 webServer:{command:'node scripts/prepare-foundation-tests.mjs && node scripts/serve-tests.mjs',url:'http://127.0.0.1:4173/mount.html',reuseExistingServer:false},
 outputDir:'test-results/code-focused',reporter:[['list']],
});
