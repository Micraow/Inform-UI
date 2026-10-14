import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/browser',testMatch:'foundation-layout.spec.mjs',
 fullyParallel:false,workers:1,retries:0,
 use:{baseURL:'http://127.0.0.1:4173',browserName:'chromium',viewport:{width:1100,height:900}},
 webServer:{command:'node scripts/prepare-foundation-tests.mjs && node scripts/serve-tests.mjs',url:'http://127.0.0.1:4173/mount.html',reuseExistingServer:false},
 outputDir:'test-results/foundation-focused',reporter:[['list']],
});
