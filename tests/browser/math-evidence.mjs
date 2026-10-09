import{expect}from'@playwright/test';
async function glyphEvidence(page){
  await page.evaluate(()=>document.fonts.ready);const cdp=await page.context().newCDPSession(page);await cdp.send('DOM.enable');await cdp.send('CSS.enable');const {root}=await cdp.send('DOM.getDocument');const results={};
  for(const selector of ['.katex-html .mathnormal','.katex-html .mathbb','.katex-html .op-symbol','.katex-html .delimsizing']){const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:root.nodeId,selector});expect(nodeId,selector).toBeGreaterThan(0);results[selector]=(await cdp.send('CSS.getPlatformFontsForNode',{nodeId})).fonts;expect(results[selector].some(f=>f.isCustomFont&&f.glyphCount>0&&f.familyName.startsWith('KaTeX_')),JSON.stringify(results)).toBe(true);}
  const faces=await page.evaluate(()=>[...document.fonts].filter(f=>f.family.startsWith('KaTeX')).map(f=>({family:f.family,style:f.style,weight:f.weight,status:f.status})));expect(faces.some(f=>f.family==='KaTeX_Math'&&f.style==='italic'&&f.status==='loaded')).toBe(true);expect(faces.some(f=>f.family==='KaTeX_AMS'&&f.status==='loaded')).toBe(true);
  return {platformFonts:results,fontFaces:faces,computed:await page.locator('.katex-html .mathnormal').first().evaluate(el=>({family:getComputedStyle(el).fontFamily,style:getComputedStyle(el).fontStyle}))};
}

export {glyphEvidence};
