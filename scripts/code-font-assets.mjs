/** Embed the pinned, unmodified Adobe Source Code Pro fonts without network access. */
import {createHash} from 'node:crypto';
import {lstat, readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

export const CODE_FONT_COMMIT = '803b7e23ec97ae58b6232ea76519a76d428ba268';
export const CODE_FONT_BASE_URL = `https://raw.githubusercontent.com/adobe-fonts/source-code-pro/${CODE_FONT_COMMIT}/`;
export const CODE_FONT_FILES = Object.freeze([
  Object.freeze({file: 'SourceCodePro-Regular.ttf.woff2', weight: 400, bytes: 74052, sha256: '714eee29b70d191f5bf4b3a06b68f2c50522b1303d31c7d44dcefdcc5f9defd0'}),
  Object.freeze({file: 'SourceCodePro-Semibold.ttf.woff2', weight: 600, bytes: 74132, sha256: '488b2806e8a76192c2ceef29b498ba01e46b697578b200ede1b5cad855c379ba'}),
]);
export const CODE_FONT_LICENSE = Object.freeze({file: 'LICENSE.md', bytes: 4566, sha256: '7c940e28a5388e9bba866cf0e408edda45fe0899ba98665b8f6ab31dc5e4b8ff'});
const sourceDirectory = new URL('../src/renderer/fonts/source-code-pro/', import.meta.url);
const generatedStyle = new URL('../src/renderer/code-font.css', import.meta.url);

async function verifiedBytes(directory, record) {
  const source = new URL(record.file, directory);
  if (!(await lstat(source)).isFile()) throw Error(`Code font assets must be ordinary files: ${record.file}`);
  const bytes = await readFile(source);
  if (bytes.length !== record.bytes) throw Error(`Code font asset byte count differs: ${record.file}`);
  if (createHash('sha256').update(bytes).digest('hex') !== record.sha256) throw Error(`Code font asset hash differs: ${record.file}`);
  return bytes;
}

/** The optional directory is for offline integrity tests, never a download source. */
export async function codeFontAssets(directory = sourceDirectory) {
  // Keep upstream LICENSE.md bytes intact; distributed CSS uses canonical LF.
  const license = (await verifiedBytes(directory, CODE_FONT_LICENSE)).toString('utf8').replace(/\r\n/g, '\n');
  const files = new Map();
  for (const font of CODE_FONT_FILES) {
    const bytes = await verifiedBytes(directory, font);
    if (bytes.toString('ascii', 0, 4) !== 'wOF2') throw Error(`Expected a WOFF2 font: ${font.file}`);
    files.set(font.file, bytes);
  }
  // Include the complete original copyright and OFL in every CSS distribution.
  // This encodes the original font bytes, without subsetting or conversion.
  const notice = `/*! Source Code Pro: unmodified Adobe WOFF2 fonts, SIL Open Font License 1.1.\nSource commit: ${CODE_FONT_COMMIT}\n${license}\n*/\n`;
  const faces = CODE_FONT_FILES.map(font => `@font-face{font-family:"Source Code Pro";font-style:normal;font-weight:${font.weight};font-display:swap;src:url(data:font/woff2;base64,${files.get(font.file).toString('base64')}) format("woff2");}`).join('\n');
  return {files, license, inline: `${notice}${faces}\n`};
}

export async function generateCodeFontStyle() {
  const assets = await codeFontAssets();
  await writeFile(generatedStyle, assets.inline);
  return assets;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  await generateCodeFontStyle();
  console.log(`Generated ${fileURLToPath(generatedStyle)} from two verified local OFL font files.`);
}
