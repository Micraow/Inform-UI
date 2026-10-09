import test from 'node:test'; import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {transform} from 'esbuild';
const built=await transform(await readFile(new URL('../src/renderer/overlay-position.ts',import.meta.url),'utf8'),{loader:'ts',format:'esm',target:'es2022'});
const {positionOverlay}=await import('data:text/javascript;base64,'+Buffer.from(built.code).toString('base64'));
const rect=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height});
test('pure placement flips at top and bottom edges without losing preferred placement when it fits',()=>{
  const view={left:0,top:0,width:390,height:700}, size={width:320,height:120};
  assert.equal(positionOverlay(rect(150,10,100,44),size,view,'top').placement,'bottom');
  assert.equal(positionOverlay(rect(150,640,100,44),size,view,'bottom').placement,'top');
  assert.equal(positionOverlay(rect(150,300,100,44),size,view,'top').placement,'top');
  assert.equal(positionOverlay(rect(150,300,100,44),size,view,'bottom').placement,'bottom');
});
test('390/768/1100 viewport corners and oversize surfaces are clamped, with visual-viewport offsets',()=>{
  for(const width of [390,768,1100]) for(const offset of [0,37]) for(const top of [0,50,600,699]) for(const left of [-25,0,width-5]) for(const preference of ['top','bottom']) {
    const view={left:offset,top:offset,width,height:700};
    for(const size of [{width:280,height:150},{width:2000,height:3000}]) {
      const result=positionOverlay(rect(left+offset,top+offset,90,44),size,view,preference);
      assert.ok(result.left>=offset+8); assert.ok(result.top>=offset+8);
      assert.ok(result.left+Math.min(size.width,result.maxWidth)<=offset+width-8);
      assert.ok(result.top+Math.min(size.height,result.maxHeight)<=offset+700-8);
    }
  }
});
