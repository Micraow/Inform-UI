export function buildCases(input) {
  const edit = fn => { const d = structuredClone(input); fn(d.body[0]); return d; };
  const positives = [
    ['independent supplied totals and display labels', structuredClone(input)],
    ['no supplied ranges', edit(n => { n.ranges = []; delete n.initialRangeId; })],
    ['masked disabled reading', edit(n => { n.masked = true; n.disabled = true; })],
    ['literal display copy', edit(n => { n.ranges[0].transactions[0].displayName = '<script>literal charge</script>'; n.ranges[0].transactions[0].amountLabel = '<img src=untrusted>'; })],
    ['negative supplied total without inferred direction', edit(n => { n.ranges[0].totalPaid = -25; n.ranges[0].totalPaidLabel = 'Supplied refund USD 25'; n.ranges[0].transactions[0].amountTone = 'positive'; })]
  ];
  const negative = (name, fn, code = 'SCHEMA', path) => [name, edit(fn), code, path];
  const negatives = [
    negative('blank main label', n => { n.label = ' '; }, 'FEE_INTEREST_LABEL', '/body/0/label'),
    negative('duplicate range ID', n => { n.ranges[1].id = 'month'; }, 'FEE_INTEREST_RANGE', '/body/0/ranges/1/id'),
    negative('missing initial range', n => { n.initialRangeId = 'missing'; }, 'FEE_INTEREST_RANGE', '/body/0/initialRangeId'),
    negative('duplicate transaction in one range', n => { n.ranges[0].transactions[1].id = 'supplied0'; }, 'FEE_INTEREST_TRANSACTION', '/body/0/ranges/0/transactions/1/id'),
    negative('blank total display label', n => { n.ranges[0].totalPaidLabel = ' '; }, 'FEE_INTEREST_LABEL', '/body/0/ranges/0/totalPaidLabel'),
    negative('blank amount label', n => { n.ranges[0].transactions[0].amountLabel = ' '; }, 'FEE_INTEREST_LABEL', '/body/0/ranges/0/transactions/0/amountLabel'),
    negative('unsafe logo', n => { n.ranges[0].transactions[0].logoUrl = 'javascript:untrusted()'; }, 'UNSAFE_URL', '/body/0/ranges/0/transactions/0/logoUrl'),
    negative('string total is not a number', n => { n.ranges[0].totalPaid = '900'; }),
    negative('nonboolean mask', n => { n.masked = 'false'; }),
    negative('unsupported amount tone', n => { n.ranges[0].transactions[0].amountTone = 'derived'; }),
    negative('nine ranges exceed the finite contract', n => { n.ranges = Array.from({ length: 9 }, (_, i) => ({ ...structuredClone(n.ranges[0]), id: 'range' + i })); delete n.initialRangeId; }),
    negative('provider endpoint is not authored data', n => { n.endpoint = 'https://example.org/bank'; })
  ];
  return { positives, negatives };
}
