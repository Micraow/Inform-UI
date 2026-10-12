import {string,short,number,bool,integer,choice,array,object,ref,key,color,weight,align,children,scalar} from '../primitives.mjs';
import {timestamp} from '../primitives.mjs';
export function install({node,defs}) {
// Original in-page time controls. No OS alarms, remote synchronization or persistence.
node('clock', { title: short, timezone: short, mode: choice('live', 'snapshot'), at: timestamp, hourCycle: choice('h12', 'h23'), seconds: bool }, ['timezone', 'mode'], 'time');
const { at: _snapshotOnly, ...liveClock } = defs.ClockNode.properties;
defs.ClockNode.oneOf = [
  object({ ...liveClock, mode: { const: 'live' } }, ['mode']),
  object({ ...defs.ClockNode.properties, mode: { const: 'snapshot' } }, ['mode', 'at'])
];
node('stopwatch', { title: short, elapsedMs: integer(0, 604800000), laps: bool }, [], 'time');
node('timer', { title: short, durationMs: integer(1, 604800000) }, ['durationMs'], 'time');

}
