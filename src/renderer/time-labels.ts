/** Original labels. The integrator passes these through presentationLabels(host).time. */
export interface TimeLabels {
  locale: string;
  clock: string; stopwatch: string; timer: string;
  live: string; snapshot: string; deviceTime: string; snapshotNote: string;
  inPageNote: string; start: string; pause: string; resume: string; restart: string; reset: string;
  lap: string; laps: string; noLaps: string; lapNumber: string; total: string; split: string;
  ready: string; running: string; paused: string; complete: string; limit: string; lapLimit: string;
  lapSaved: string; elapsed: string; remaining: string; durationFormat: string;
  hours: string; minutes: string; seconds: string;
}
export const timeEnglish: TimeLabels = {
  locale: 'en-US', clock: 'Clock', stopwatch: 'Stopwatch', timer: 'Timer', live: 'Live', snapshot: 'Snapshot',
  deviceTime: 'Current device time in the selected time zone. Not network-synchronized.',
  snapshotNote: 'Fixed supplied instant. This snapshot does not advance.',
  inPageNote: 'In-page timing only. Device suspension may interrupt timing; no alarm after closing this page.',
  start: 'Start', pause: 'Pause', resume: 'Resume', restart: 'Restart', reset: 'Reset',
  lap: 'Lap', laps: 'Laps', noLaps: 'No laps recorded.', lapNumber: 'Lap', total: 'Total elapsed', split: 'Split',
  ready: 'Ready', running: 'Running', paused: 'Paused', complete: 'Timer complete.',
  limit: 'Maximum duration reached: 168 hours.', lapLimit: '100-lap limit reached. Reset to record a new set.',
  lapSaved: 'Lap recorded.', elapsed: 'Elapsed', remaining: 'Remaining', durationFormat: 'Hours : minutes : seconds . hundredths',
  hours: 'hours', minutes: 'minutes', seconds: 'seconds',
};
export const timeChinese: TimeLabels = {
  locale: 'zh-CN', clock: '时钟', stopwatch: '秒表', timer: '倒计时', live: '实时', snapshot: '快照',
  deviceTime: '显示设备当前时间及所选时区，不提供网络校时。',
  snapshotNote: '显示调用方提供的固定时刻，快照不会推进。',
  inPageNote: '仅在页面内计时。设备休眠可能影响计时，关闭页面后不会提醒。',
  start: '开始', pause: '暂停', resume: '继续', restart: '重新开始', reset: '重置',
  lap: '计圈', laps: '分圈记录', noLaps: '暂无分圈记录。', lapNumber: '圈次', total: '累计用时', split: '本圈用时',
  ready: '准备就绪', running: '正在计时', paused: '已暂停', complete: '倒计时结束。',
  limit: '已达到最长计时：168 小时。', lapLimit: '已达到 100 圈上限。重置后可重新记录。',
  lapSaved: '已记录本圈。', elapsed: '已用时间', remaining: '剩余时间', durationFormat: '小时 : 分钟 : 秒 . 百分之一秒',
  hours: '小时', minutes: '分钟', seconds: '秒',
};
