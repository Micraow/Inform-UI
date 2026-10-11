export function buildCases(input) {
  const edit = fn => { const d = structuredClone(input); fn(d.body[0], d); return d; };
  const positives = [
    ['original passive dynamic content', structuredClone(input)],
    ['literal disabled state', edit(n => { n.disabled = true; })],
    ['derived boolean disabled state', edit(n => { n.disabled = { op: 'eq', args: [{ $: 'count' }, 0] }; })],
    ['primary intent surface', edit(n => { n.tone = 'primary'; })],
    ['literal action copy', edit(n => { n.label = '<script>Review supplied items</script>'; n.children[0].children[0].value = '<img src=untrusted>'; })]
  ];
  const negative = (name, fn, code = 'SCHEMA', path) => [name, edit(fn), code, path];
  const negatives = [
    negative('interactive child input', (n, d) => { d.state.answer = ''; n.children = [{ type: 'input', kind: 'text', label: 'Nested input', bind: 'answer' }]; }, 'PRESSABLE_CONTENT', '/body/0/children/0'),
    negative('nested interactive text link', n => { n.children[0].children[0] = { type: 'text', runs: [{ value: 'Linked text', href: 'https://example.org' }] }; }, 'PRESSABLE_INTERACTIVE', '/body/0/children/0/children/0/runs/0/href'),
    negative('external image activation is interactive', n => { n.children = [{ type: 'image', src: 'https://example.org/image.png', alt: 'External sample' }]; }, 'PRESSABLE_EXTERNAL_MEDIA', '/body/0/children/0/src'),
    negative('nonboolean disabled value', n => { n.disabled = 'false'; }, 'INPUT_TYPE', '/body/0/disabled'),
    negative('no passive children', n => { n.children = []; }),
    negative('too many direct children', n => { n.children = Array.from({ length: 31 }, () => ({ type: 'text', value: 'Bounded content' })); }),
    negative('missing accessible action label', n => { delete n.label; }),
    negative('invalid action ID', n => { n.actionId = 'not an identifier'; }),
    negative('navigation is not an authored field', n => { n.href = 'https://example.org'; }),
    negative('service callback is not an authored field', n => { n.onClick = 'runService'; })
  ];
  return { positives, negatives };
}
