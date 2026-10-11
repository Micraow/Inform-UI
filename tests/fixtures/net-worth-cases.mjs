export function buildCases(input) {
  const edit = fn => { const d = structuredClone(input); fn(d.body[0]); return d; };
  const positives = [
    ['supplied summary differs from final observation', structuredClone(input)],
    ['empty supplied intervals', edit(n => { n.intervals = []; delete n.initialIntervalId; })],
    ['masked and disabled reading', edit(n => { n.masked = true; n.disabled = true; })],
    ['long real elapsed interval', edit(n => { n.intervals[0].points = [{ date: '2028-01-01', value: 0 }, { date: '2028-01-02', value: null }, { date: '2029-01-01', value: 10 }]; })],
    ['literal copy and explicit source', edit(n => { n.label = '<script>literal teaching label</script>'; n.source = { label: 'Supplied teaching note', url: 'https://example.org/synthetic-source' }; })]
  ];
  const negative = (name, fn, code = 'SCHEMA', path) => [name, edit(fn), code, path];
  const negatives = [
    negative('blank main label', n => { n.label = '  '; }, 'NET_WORTH_LABEL', '/body/0/label'),
    negative('duplicate interval ID', n => { n.intervals[1].id = 'month'; }, 'NET_WORTH_INTERVAL', '/body/0/intervals/1/id'),
    negative('unknown initial interval', n => { n.initialIntervalId = 'missing'; }, 'NET_WORTH_INTERVAL', '/body/0/initialIntervalId'),
    negative('impossible supplied date', n => { n.intervals[0].points[3].date = '2028-02-30'; }, 'NET_WORTH_DATE', '/body/0/intervals/0/points/3/date'),
    negative('duplicate observation date', n => { n.intervals[0].points[1].date = '2028-02-01'; }, 'NET_WORTH_ORDER', '/body/0/intervals/0/points/1/date'),
    negative('descending dates', n => { n.intervals[0].points.reverse(); }, 'NET_WORTH_ORDER', '/body/0/intervals/0/points/1/date'),
    negative('unsafe source URL', n => { n.source = { label: 'Unsafe', url: 'javascript:untrusted()' }; }, 'UNSAFE_URL', '/body/0/source/url'),
    negative('lowercase currency', n => { n.currency = 'usd'; }),
    negative('string current value', n => { n.intervals[0].currentValue = '900'; }),
    negative('nonboolean masked', n => { n.masked = 'false'; }),
    negative('too many intervals', n => { n.intervals = Array.from({ length: 9 }, (_, i) => ({ ...structuredClone(n.intervals[0]), id: 'sample' + i })); delete n.initialIntervalId; }),
    negative('unsupported provider connection', n => { n.connectAccount = true; })
  ];
  return { positives, negatives };
}
