import {expect} from '@playwright/test';

/** Same user gestures for offline output and the fixed-CDN file shell. */
export async function exerciseCurrentDemo(page) {
  const form=page.getByRole('form',{name:'检查合成计划'}),hours=form.getByRole('spinbutton',{name:'每周练习小时'});
  await expect(form.locator('.iui-metric-value')).toHaveText(['24小时','1920CNY','80CNY']);
  await hours.fill('12.5');await expect(form.locator('.iui-metric-value')).toHaveText(['50小时','4000CNY','-2000CNY']);
  for(const draft of ['-1','21','0.1','']) {
    await hours.fill(draft);await form.getByRole('button',{name:'检查当前草稿'}).click();
    await expect(form).toHaveAttribute('data-status','invalid');await expect(hours).toBeFocused();
    await expect(form.locator('.iui-metric-value')).toHaveText(['50小时','4000CNY','-2000CNY']);
  }
  await form.getByRole('button',{name:'恢复6小时'}).click();await expect(hours).toHaveValue('6');
  await expect(form.locator('.iui-metric-value')).toHaveText(['24小时','1920CNY','80CNY']);
  const trigger=page.getByRole('button',{name:'为什么输入和指标可能不同？'});await trigger.click();
  const dialog=page.getByRole('dialog',{name:'草稿、状态与提交'});await expect(dialog).toBeVisible();
  await dialog.getByRole('button',{name:'关闭',exact:true}).click();await expect(trigger).toBeFocused();await expect(dialog).toBeHidden();
  const stopwatch=page.locator('.iui-time[data-kind=stopwatch]');
  await stopwatch.getByRole('button',{name:'开始',exact:true}).click();await expect(stopwatch).toHaveAttribute('data-status','running');
  await expect(stopwatch.getByRole('button',{name:'暂停',exact:true})).toBeFocused();
  await stopwatch.getByRole('button',{name:'暂停',exact:true}).click();await expect(stopwatch).toHaveAttribute('data-status','paused');
  await expect(page.locator('.iui-time[data-kind=timer]')).toHaveAttribute('data-status','ready');
  await expect(page.locator('td[rowspan="2"],th[rowspan="2"]')).toHaveCount(1);
  await expect(page.locator('.iui-time-date')).toHaveAttribute('datetime','2026-10-10');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
}
