/** Original offline duration arithmetic. No wall clock, callbacks, DOM, or dependencies. */
export const MAX_DURATION_MS = 604_800_000;
export const MAX_LAPS = 100;
export type DurationKind = 'stopwatch' | 'timer';
export type DurationStatus = 'ready' | 'running' | 'paused' | 'complete' | 'limit';
export interface Lap { readonly totalMs: number; readonly splitMs: number }
export interface DurationParts { hours: number; minutes: number; seconds: number; hundredths: number }
export const clampDuration = (value: number, max = MAX_DURATION_MS): number => Math.min(max, Math.max(0, value));

/** Countdown rounds up: a positive sub-centisecond remainder never displays zero. */
export function durationParts(milliseconds: number, roundUp = false): DurationParts {
  const cents = (roundUp ? Math.ceil : Math.floor)(clampDuration(milliseconds) / 10);
  return { hours: Math.floor(cents / 360_000), minutes: Math.floor(cents / 6_000) % 60, seconds: Math.floor(cents / 100) % 60, hundredths: cents % 100 };
}
export function formatDuration(milliseconds: number, roundUp = false): string {
  const p = durationParts(milliseconds, roundUp), pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(p.hours)}:${pad(p.minutes)}:${pad(p.seconds)}.${pad(p.hundredths)}`;
}
export function durationISO(milliseconds: number): string {
  return `PT${Number((clampDuration(milliseconds) / 1_000).toFixed(6))}S`;
}

/** All timestamps are supplied by the owning window's monotonic performance clock. */
export class DurationSession {
  readonly kind: DurationKind;
  readonly initialMs: number;
  readonly limitMs: number;
  private baseMs: number;
  private baseline = 0;
  private state: DurationStatus = 'ready';
  private records: Lap[] = [];
  private lapBaseline: number;
  constructor(kind: DurationKind, initialMs: number) {
    if (!Number.isInteger(initialMs) || initialMs < (kind === 'timer' ? 1 : 0) || initialMs > MAX_DURATION_MS) throw new RangeError('Invalid duration');
    this.kind = kind; this.initialMs = initialMs; this.limitMs = kind === 'timer' ? initialMs : MAX_DURATION_MS;
    this.baseMs = kind === 'stopwatch' ? initialMs : 0;
    this.lapBaseline = this.baseMs;
    if (this.baseMs === this.limitMs) this.state = 'limit';
  }
  get status(): DurationStatus { return this.state; }
  get laps(): readonly Lap[] { return this.records; }
  private elapsed(now: number): number {
    return clampDuration(this.baseMs + (this.state === 'running' ? Math.max(0, now - this.baseline) : 0), this.limitMs);
  }
  /** Delayed rendering catches up from the baseline and crosses the terminal boundary once. */
  sample(now: number): number {
    const elapsed = this.elapsed(now);
    if (this.state === 'running' && elapsed >= this.limitMs) {
      this.baseMs = this.limitMs; this.state = this.kind === 'timer' ? 'complete' : 'limit';
    }
    return this.kind === 'timer' ? this.limitMs - elapsed : elapsed;
  }
  start(now: number): boolean {
    if (this.state === 'running' || this.state === 'complete' || this.state === 'limit') return false;
    this.baseline = now; this.state = 'running'; return true;
  }
  pause(now: number): boolean {
    if (this.state !== 'running') return false;
    this.sample(now);
    if (this.state === 'running') { this.baseMs = this.elapsed(now); this.state = 'paused'; }
    return true;
  }
  reset(): void {
    this.baseMs = this.kind === 'stopwatch' ? this.initialMs : 0; this.baseline = 0; this.records = [];
    this.lapBaseline = this.baseMs; this.state = this.baseMs === this.limitMs ? 'limit' : 'ready';
  }
  lap(now: number): Lap | null {
    if (this.kind !== 'stopwatch' || this.state !== 'running' || this.records.length >= MAX_LAPS) return null;
    const totalMs = this.sample(now);
    if (this.state !== 'running') return null;
    const item = Object.freeze({ totalMs, splitMs: totalMs - this.lapBaseline });
    this.records.push(item); this.lapBaseline = totalMs; return item;
  }
}
