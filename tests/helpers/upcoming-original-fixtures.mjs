/** Original opaque teaching records; these labels do not represent an account. */
export function upcomingFlowFixtures() {
  const row = (id, title, amountLabel, dateLabel, kind) => ({ id, title, amountLabel, dateLabel, kind });
  const incomingItems = [row('incoming_zero', 'Original zero adjustment', '0 supplied credits', 'Day 9, supplied text', 'income'), row('incoming_unknown', 'Original incomplete incoming record', null, null, 'income')];
  const outgoingItems = [row('outgoing_books', 'Original reading materials', '12 supplied credits', 'Day 11, supplied text', 'expense'), row('outgoing_refund', 'Original refund notation', '-5 supplied credits', null, 'expense')];
  return {
    label: 'Original incoming and outgoing teaching records',
    flows: {
      incoming: { top: row('incoming_top', 'Original scheduled stipend', '120 supplied credits', 'Day 20, supplied text', 'income'), items: incomingItems, expandedItems: [...structuredClone(incomingItems), row('incoming_extra', 'Original additional teaching record', '7 supplied credits', 'Day 24, supplied text', 'income'), row('incoming_last', 'Original last supplied record', null, 'Day 28, supplied text', 'income')] },
      outgoing: { top: row('outgoing_top', 'Original zero scheduled charge', '0 supplied credits', 'Day 7, supplied text', 'expense'), items: outgoingItems, expandedItems: [structuredClone(outgoingItems[0])] }
    },
    scenarios: ['incoming two-to-four replacement', 'same-flow selection keeps expansion', 'flow change collapses', 'outgoing shorter expanded list cannot expand', 'zero and unknown remain distinct', 'pending versus no connected account', 'canceled native reset', 'local detail intent only']
  };
}
/** Pure fixture oracle, not a runtime implementation or source-acceptance claim. */
export function expectedFlowRows(flow, expanded) {
  const canExpand = Array.isArray(flow.expandedItems) && flow.expandedItems.length > flow.items.length;
  return [...(flow.top ? [flow.top] : []), ...(expanded && canExpand ? flow.expandedItems : flow.items)];
}
