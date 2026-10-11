export function buildCases(input) {
  const edit = fn => { const d = structuredClone(input); fn(d.body[0]); return d; };
  const positives = [
    ['two supplied provider records', structuredClone(input)],
    ['omitted items with default pending', edit(n => { delete n.items; delete n.status; })],
    ['explicit pending empty collection', edit(n => { n.items = []; n.status = 'pending'; })],
    ['resolved empty collection', edit(n => { n.items = []; n.status = 'resolved'; })],
    ['failed supplied phase with local copy', edit(n => { n.status = 'failed'; })],
    ['disabled no-hover reading', edit(n => { n.disabled = true; n.hoverPreview = false; })],
    ['finite twenty-record bound', edit(n => { n.items = Array.from({ length: 20 }, (_, i) => ({ ...structuredClone(n.items[i % 2]), title: 'Supplied syntax-only record ' + i })); })]
  ];
  const negative = (name, fn, code = 'SCHEMA', path) => [name, edit(fn), code, path];
  const negatives = [
    negative('unsupported phase', n => { n.status = 'waiting'; }, 'ASYNC_VIDEO_STATUS', '/body/0/status'),
    negative('literal null is not a phase', n => { n.status = null; }, 'ASYNC_VIDEO_STATUS', '/body/0/status'),
    negative('invalid YouTube identifier', n => { n.items[0].videoId = 'short'; }, 'ASYNC_VIDEO_ID', '/body/0/items/0/videoId'),
    negative('TikTok identifier must be numeric', n => { n.items[1].videoId = 'not-numeric'; }, 'ASYNC_VIDEO_ID', '/body/0/items/1/videoId'),
    negative('blank title', n => { n.items[0].title = ' '; }, 'ASYNC_VIDEO_TITLE', '/body/0/items/0/title'),
    negative('provider URL must match supplied ID', n => { n.items[0].url = 'https://www.youtube.com/watch?v=OtherID0123'; }, 'ASYNC_VIDEO_URL', '/body/0/items/0/url'),
    negative('provider URL excludes credentials', n => { n.items[0].url = 'https://user:pass@www.youtube.com/watch?v=AbCdEf012_-'; }, 'ASYNC_VIDEO_URL', '/body/0/items/0/url'),
    negative('insecure canonical URL', n => { n.items[1].url = 'http://www.tiktok.com/@inform_fixture/video/9000000000000000001'; }, 'ASYNC_VIDEO_URL', '/body/0/items/1/url'),
    negative('ambiguous duplicate video query', n => { n.items[0].url += '&v=AbCdEf012_-'; }, 'ASYNC_VIDEO_URL', '/body/0/items/0/url'),
    negative('unsafe supplied thumbnail', n => { n.items[1].thumbnailUrl = 'javascript:untrusted()'; }, 'ASYNC_VIDEO_THUMBNAIL', '/body/0/items/1/thumbnailUrl'),
    negative('YouTube does not accept arbitrary thumbnail overrides', n => { n.items[0].thumbnailUrl = n.items[1].thumbnailUrl; }, 'ASYNC_VIDEO_THUMBNAIL', '/body/0/items/0/thumbnailUrl'),
    negative('unsupported provider', n => { n.items[0].provider = 'other'; }),
    negative('twenty-one records exceed finite bound', n => { n.items = Array.from({ length: 21 }, () => structuredClone(n.items[0])); }),
    negative('provider search is outside supplied data', n => { n.searchQuery = 'Find more videos'; })
  ];
  return { positives, negatives };
}
