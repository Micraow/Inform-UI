import {test,expect} from '@playwright/test';
const ready=async page=>{await page.goto('/#animate');await expect(page.locator('#preview')).toHaveAttribute('data-status','mounted');};
test('animate demonstrates visible content, explicit playback, replay and stop',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});await ready(page);
 const root=page.locator('#preview .iui-animate'),content=root.locator('.iui-motion-content');
 await expect(content).toContainText('An idea comes into view');await expect(root).toHaveAttribute('data-status','idle');
 const json=JSON.parse(await page.locator('#json-code').textContent());expect(json.body[0].children.length).toBeGreaterThan(0);expect(json.body[0].effect).toBe('rise');expect(json.body[0].duration).toBe(800);
 const play=root.locator('.iui-motion-preview'),stop=root.locator('.iui-motion-stop');
 await play.click();await expect(root).toHaveAttribute('data-status','playing');expect(await content.evaluate(node=>node.getAnimations().length)).toBe(1);
 await stop.click();await expect(root).toHaveAttribute('data-status','stopped');expect(await content.evaluate(node=>node.getAnimations().length)).toBe(0);
 await play.click();await expect(root).toHaveAttribute('data-status','completed');await expect(content).toBeVisible();
 await play.click();await expect(root).toHaveAttribute('data-status','playing');await page.locator('#reset').click();await expect(root).toHaveAttribute('data-status','idle');await expect(content).toBeVisible();
});
test('animate respects reduced motion and keeps the content visible',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await ready(page);
 const root=page.locator('#preview .iui-animate');await root.locator('.iui-motion-preview').click();
 await expect(root).toHaveAttribute('data-status','reduced');await expect(root.locator('.iui-motion-content')).toContainText('An idea comes into view');
 expect(await root.locator('.iui-motion-content').evaluate(node=>node.getAnimations().length)).toBe(0);
});
