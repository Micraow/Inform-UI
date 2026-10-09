import { execFileSync } from 'node:child_process';
const paths = ['src/schema', 'src/renderer/math-style.css', 'cdn'];
try {
  execFileSync('git', ['diff', '--exit-code', '--', ...paths], { stdio: 'inherit' });
  const untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard', '--', ...paths], { encoding: 'utf8' }).trim();
  if (untracked) throw Error('Untracked generated files:\n' + untracked);
  console.log('Generated schema/types/validators/styles/CDN files match the committed snapshot.');
} catch (error) { if (error instanceof Error) console.error(error.message); process.exitCode = 1; }
