export function fakeClock(win, initialWall = Date.parse('2026-10-09T23:59:59Z')) {
  let mono = 0, wall = initialWall, serial = 0, wallReads = 0;
  const pending = new Map();
  Object.defineProperty(win.performance, 'now', { configurable: true, value: () => mono });
  win.Date.now = () => { wallReads++; return wall; };
  win.setTimeout = (fn, delay = 0) => { const id = ++serial; pending.set(id, { at: mono + Math.max(0, Number(delay)), fn }); return id; };
  win.clearTimeout = id => pending.delete(id);
  const stepTo = time => { wall += time - mono; mono = time; };
  return {
    get wallReads() { return wallReads; }, get pending() { return pending.size; }, get now() { return mono; }, get wall() { return wall; },
    setWall(value) { wall = value; },
    advance(ms, delayed = false) {
      const target = mono + ms;
      if (delayed) {
        stepTo(target);
        const due = [...pending.entries()].filter(([, item]) => item.at <= mono);
        for (const [id, item] of due) { if (pending.delete(id)) item.fn(); }
      } else {
        for (;;) {
          const next = [...pending.entries()].filter(([, item]) => item.at <= target).sort((a, b) => a[1].at - b[1].at)[0];
          if (!next) break;
          const [id, item] = next; stepTo(item.at); pending.delete(id); item.fn();
        }
        stepTo(target);
      }
    },
  };
}
