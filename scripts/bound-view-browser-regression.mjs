// Original synthetic fixtures. Build with npm run build:next before running.
// Usage: node scripts/bound-view-browser-regression.mjs [report.json]
// Uses Playwright's installed Chromium; CHROMIUM_PATH can select a system binary.
// INFORM_BASELINE_RUNTIME optionally adds a baseline comparison. A failing baseline
// is diagnostic; candidate failures and infrastructure errors always exit nonzero.
import {fileURLToPath} from 'node:url';
import {resolve, dirname} from 'node:path';
import http from 'node:http';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';

const repo = fileURLToPath(new URL('..', import.meta.url));
const output = resolve(process.argv[2] ?? resolve(repo, 'output/next/bound-view-browser-regression.json'));
const port = Number(process.env.INFORM_TEST_PORT ?? 4182);
const versions = process.env.INFORM_TEST_VERSION
  ? [process.env.INFORM_TEST_VERSION]
  : process.env.INFORM_BASELINE_RUNTIME ? ['baseline', 'candidate'] : ['candidate'];
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('INFORM_TEST_PORT must be an integer from 0 to 65535.');
if (versions.some(version => !['baseline', 'candidate'].includes(version))) throw new Error('INFORM_TEST_VERSION must be baseline or candidate.');

const {chromium} = createRequire(resolve(repo, 'package.json'))('playwright');
const definitions = {
  SegmentedView: {
    initial: '"a"',
    view: 'SegmentedView({label:"Pick",options:[{label:"A",value:"a"},{label:"B",value:"b"},{label:"C",value:"c"}]},$pick)',
    expected: 'c',
  },
  RatingView: {initial: '1', view: 'RatingView({label:"Rating"},$pick)', expected: 3},
};
const report = {
  transport: 'Real HTTP and keyboard; original synthetic DSL only',
  runtimeHashes: {},
  cases: [],
  errors: [],
  pass: false,
};
const bytes = {};
const server = http.createServer((request, response) => {
  const [version, name] = (request.url ?? '').split('?')[0].slice(1).split('/');
  if (!Object.hasOwn(bytes, version)) {response.writeHead(404).end(); return;}
  if (name === 'runtime.js') {
    response.setHeader('Content-Type', 'application/javascript');
    response.end(bytes[version]);
    return;
  }
  if (!Object.hasOwn(definitions, name)) {response.writeHead(404).end(); return;}
  const definition = definitions[name];
  const config = {
    source: '$pick=' + definition.initial + '\n$other=0\nroot=Stack([' + definition.view + ',Text("Other: "+$other),Button("Other",@Set($other,$other+1))])',
    select: ['base/layout', 'base/text', 'base/controls', 'views/content'],
    viewNames: [name],
  };
  response.setHeader('Content-Type', 'text/html;charset=utf-8');
  response.end('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><main></main>' +
    '<script src="/' + version + '/runtime.js"></script><script>window.errors=[];' +
    'window.app=InformUI.mount(document.querySelector("main"),Object.assign(' + JSON.stringify(config) +
    ',{onError:issues=>window.errors.push(...issues)}));</script>');
});

let browser;
try {
  for (const version of versions) {
    const runtime = version === 'baseline'
      ? process.env.INFORM_BASELINE_RUNTIME ?? resolve(repo, 'cdn/next/inform-ui.global.js')
      : resolve(repo, 'dist/v2/inform-ui.global.js');
    bytes[version] = await readFile(runtime);
    report.runtimeHashes[version] = createHash('sha256').update(bytes[version]).digest('hex');
  }
  await new Promise((accept, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {server.off('error', reject); accept();});
  });
  browser = await chromium.launch({
    ...(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}),
    headless: true,
    args: ['--disable-dev-shm-usage'],
    timeout: 15000,
  });
  for (const version of versions) for (const name of Object.keys(definitions)) for (const width of [390, 1440]) {
    const item = {version, name, width, errors: [], pass: false};
    report.cases.push(item);
    const page = await browser.newPage({viewport: {width, height: 900}});
    page.setDefaultTimeout(15000);
    page.on('pageerror', error => item.errors.push(error.message));
    try {
      const response = await page.goto('http://127.0.0.1:' + server.address().port + '/' + version + '/' + name);
      if (!response?.ok()) throw new Error('Fixture HTTP request failed.');
      await page.waitForSelector('.if-root[data-phase=ready]');
      await page.evaluate(() => {
        window.radios = [...document.querySelectorAll('input[type=radio]')];
        window.events = [];
        document.addEventListener('change', event => {
          if (window.radios.includes(event.target)) window.events.push({trusted: event.isTrusted, value: event.target.value});
        }, true);
        window.radios[0].focus();
      });
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');
      item.keyboard = await page.evaluate(() => {
        const current = [...document.querySelectorAll('input[type=radio]')];
        return {
          value: window.app.getSnapshot().state.$pick,
          same: current.length === window.radios.length && current.every((element, index) => element === window.radios[index]),
          focusIndex: window.radios.indexOf(document.activeElement),
          currentFocusIndex: current.indexOf(document.activeElement),
          events: window.events,
        };
      });
      await page.getByRole('button', {name: 'Other', exact: true}).click();
      item.sibling = await page.evaluate(() => {
        const current = [...document.querySelectorAll('input[type=radio]')];
        return {
          same: current.length === window.radios.length && current.every((element, index) => element === window.radios[index]),
          value: window.app.getSnapshot().state.$pick,
          other: window.app.getSnapshot().state.$other,
          errors: window.errors,
          pageOverflow: document.documentElement.scrollWidth > innerWidth + 1,
        };
      });
      item.pass = item.keyboard.same && item.keyboard.focusIndex === 2 &&
        item.keyboard.value === definitions[name].expected &&
        item.keyboard.events.length >= 2 && item.keyboard.events.every(event => event.trusted) &&
        item.sibling.same && item.sibling.value === definitions[name].expected && item.sibling.other === 1 &&
        !item.sibling.errors.length && !item.sibling.pageOverflow && !item.errors.length;
    } catch (error) {
      item.errors.push(String(error?.stack ?? error));
      throw error;
    } finally {
      await page.close();
    }
  }
  report.pass = report.cases.length > 0 && report.cases.filter(item => item.version === 'candidate').every(item => item.pass);
} catch (error) {
  report.errors.push(String(error?.stack ?? error));
} finally {
  try {await browser?.close();} catch (error) {report.errors.push(String(error));}
  if (server.listening) await new Promise(accept => server.close(accept));
  if (report.errors.length) report.pass = false;
  await mkdir(dirname(output), {recursive: true});
  await writeFile(output, JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify(report));
if (!report.pass) process.exitCode = 1;
