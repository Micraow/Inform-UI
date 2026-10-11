import {defineConfig} from '@playwright/test';
import baseline from './playwright.config.mjs';
// These suites intentionally consume historical remote pins. They remain intact
// and are not evidence that the newly built checkout passed browser acceptance.
export default defineConfig(baseline,{
 testIgnore:['**/*cdn*.spec.mjs','**/blind-cache*.spec.mjs','**/schema-discovery.spec.mjs'],
 outputDir:'test-results/recovery-current',
 reporter:[['list'],['html',{open:'never',outputFolder:'playwright-report/recovery-current'}]],
});
