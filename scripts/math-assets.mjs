/** Bundle the pinned official KaTeX CSS/fonts; no captured styles or external service. */
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
const base=new URL('../node_modules/katex/',import.meta.url);
export async function mathAssets(){
  const original=await readFile(new URL('dist/katex.min.css',base),'utf8');
  const fonts=[...new Set([...original.matchAll(/url\(fonts\/(KaTeX_[A-Za-z0-9-]+\.woff2)\)/g)].map(m=>m[1]))].sort();
  if(fonts.length!==20)throw new Error(`Unexpected KaTeX font inventory: ${fonts.length}`);
  const fontCSS=original.replace(/src:url\(fonts\/([^)]*\.woff2)\) format\("woff2"\),url\([^)]*\) format\("woff"\),url\([^)]*\) format\("truetype"\)/g,'src:url(fonts/$1) format("woff2")');
  const css=fontCSS.replace(/([^{}]+)\{([^{}]*)\}/g,(rule,selectors,body)=>selectors.trim()==='@font-face'?rule:selectors.split(',').map(selector=>selector.trim()==='body'?'.iui-root':'.iui-root '+selector.trim()).join(',')+'{'+body+'}');
  if(/\.woff\)|\.ttf\)/.test(css))throw new Error('Legacy font URL was not removed');
  const files=new Map(await Promise.all(fonts.map(async name=>[name,await readFile(new URL(`dist/fonts/${name}`,base))])));
  const license=await readFile(new URL('LICENSE',base),'utf8');
  const notice='/*! KaTeX 0.18.2 CSS and unmodified WOFF2 fonts.\nCopyright (c) 2018 Khan Academy (KaTeX fonts).\n'+license+'\nVisual selectors scoped to .iui-root; WOFF2-only sources. */\n';
  const inline=notice+css.replace(/url\(fonts\/([^)]*)\)/g,(_,name)=>`url(data:font/woff2;base64,${files.get(name).toString('base64')})`);
  return {fonts,files,external:notice+css,inline};
}
export async function generateMathStyle(){const {inline}=await mathAssets();await writeFile(new URL('../src/renderer/math-style.css',import.meta.url),inline+'\n');}
export async function writeExternalMath(target){const a=await mathAssets();await mkdir(`${target}/fonts`,{recursive:true});for(const[name,bytes]of a.files)await writeFile(`${target}/fonts/${name}`,bytes);await copyFile(new URL('LICENSE',base),`${target}/fonts/LICENSE.txt`);return a;}
