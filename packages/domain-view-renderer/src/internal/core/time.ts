import type { ClockNode } from '../schema/document.js';
import type { Issue } from './index.js';
import { timestamp, validTimezone } from './extensions.js';

/** Validate supplied clock instants without normalizing invalid civil-time fields. */
export function inspectClock(node: ClockNode, path: string, add: (issue: Issue) => void): void {
  if (!validTimezone(node.timezone)) add({ code: 'TIMEZONE', path: `${path}/timezone`, message: 'Use a recognized IANA time zone.' });
  if (node.mode !== 'snapshot') return;
  const at = node.at;
  const parts = typeof at === 'string' && /^\d{4}-\d{2}-\d{2}T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(?:Z|[+-](\d{2}):(\d{2}))$/.exec(at);
  if (!parts || !Number.isFinite(timestamp(at)) || Number(parts[1]) > 23 || Number(parts[2]) > 59
    || Number(parts[3] ?? 0) > 59 || Number(parts[4] ?? 0) > 23 || Number(parts[5] ?? 0) > 59) {
    add({ code: 'TIME_DATE', path: `${path}/at`, message: 'Snapshot clocks require a valid ISO timestamp with an explicit offset and valid calendar/time fields.' });
  }
}
