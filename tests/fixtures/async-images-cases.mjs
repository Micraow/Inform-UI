export function buildCases(input) {
  const edit = fn => { const d = structuredClone(input); fn(...d.body); return d; };
  const positives = [
    ['original inline two-image and three-image collections', structuredClone(input)],
    ['pending supplied status', edit((...nodes) => nodes.forEach(n => { n.status = 'pending'; }))],
    ['failed empty supplied collections', edit((...nodes) => nodes.forEach(n => { n.status = 'failed'; n.images = []; }))],
    ['noninteractive and disabled reading', edit((...nodes) => nodes.forEach(n => { n.interactive = false; n.disabled = true; }))],
    ['finite carousel collection', edit((single, group) => { group.layout = 'carousel'; group.size = 'lg'; group.images = Array.from({ length: 20 }, (_, i) => ({ ...structuredClone(group.images[i % 3]), title: 'Supplied image ' + i })); })]
  ];
  const negative = (name, fn, code = 'SCHEMA', path) => [name, edit(fn), code, path];
  const negatives = [
    negative('unsupported status value', single => { single.status = 'waiting'; }, 'ASYNC_IMAGE_STATUS', '/body/0/status'),
    negative('boolean status is not a phase', (single, group) => { group.status = false; }, 'ASYNC_IMAGE_STATUS', '/body/1/status'),
    negative('unsafe supplied source', single => { single.images[0].content_url = 'javascript:untrusted()'; }, 'UNSAFE_URL', '/body/0/images/0/content_url'),
    negative('zero textual ratio', (single, group) => { group.aspectRatio = '1:0'; }, 'ASYNC_IMAGE_RATIO', '/body/1/aspectRatio'),
    negative('too many supplied images', (single, group) => { group.images = Array.from({ length: 21 }, () => structuredClone(group.images[0])); }),
    negative('images cannot be null', single => { single.images = null; }),
    negative('unknown group layout', (single, group) => { group.layout = 'masonry'; }),
    negative('group item height must be positive', (single, group) => { group.itemHeight = 0; }),
    negative('disabled is a literal boolean', single => { single.disabled = { $: 'mediaStatus' }; }),
    negative('search endpoint is not part of finite data', (single, group) => { group.endpoint = 'https://example.org/search'; }),
    negative('unbounded alternative text', single => { single.alt = 'x'.repeat(2001); })
  ];
  return { positives, negatives };
}
