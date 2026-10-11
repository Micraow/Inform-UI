import { deflateSync } from 'node:zlib';
const crc32 = data => { let crc = 0xffffffff; for (const byte of data) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); } return (crc ^ 0xffffffff) >>> 0; };
function chunk(name, data) { const tag = Buffer.from(name), size = Buffer.alloc(4), checksum = Buffer.alloc(4); size.writeUInt32BE(data.length); checksum.writeUInt32BE(crc32(Buffer.concat([tag, data]))); return Buffer.concat([size, tag, data, checksum]); }
/** Independently drawn color panels. No imported photograph, screenshot or model output. */
export function drawPanel(width, height, color) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 256 || height > 256) throw new RangeError('Finite panel geometry required.');
  const header = Buffer.alloc(13); header.writeUInt32BE(width); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 2;
  const rows = Buffer.alloc(height * (width * 3 + 1));
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const inside = x >= width / 5 && x < width * 4 / 5 && y >= height / 4 && y < height * 3 / 4;
    const pixel = inside ? color : [245, 247, 249], offset = y * (width * 3 + 1) + 1 + x * 3;
    for (let c = 0; c < 3; c++) rows[offset + c] = pixel[c];
  }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(rows)), chunk('IEND', Buffer.alloc(0))]);
}
/** Neutral fixture data; map it to the author's fixed schema before claiming runtime acceptance. */
export function gridCompletionFixtures() {
  const specs = [['blue', 96, 64, [36, 101, 210]], ['orange', 64, 96, [231, 112, 34]], ['green', 80, 80, [43, 153, 98]], ['purple', 120, 60, [125, 83, 185]], ['yellow', 60, 120, [214, 172, 37]]];
  const images = specs.map(([id, width, height, rgb]) => ({ id, src: 'data:image/png;base64,' + drawPanel(width, height, rgb).toString('base64'), alt: `Original ${id} rectangular panel`, caption: `Original supplied ${width} by ${height} color panel`, width, height }));
  const recommendations = images.slice(0, 4).map(image => ({ id: 'compare_' + image.id, label: `Compare the ${image.id} panel`, query: `Compare only the supplied ${image.id} panel with the other supplied panels.`, thumbnailSrc: image.src }));
  const rows = [
    { aspectRatio: 2.4, tiles: [{ imageId: 'blue', aspectRatio: 1.5, flexGrow: 3 }, { imageId: 'orange', aspectRatio: 2 / 3, flexGrow: 1 }] },
    { aspectRatio: 3, tiles: [{ imageId: 'green', aspectRatio: 1, flexGrow: 1 }, { imageId: 'purple', aspectRatio: 2, flexGrow: 2 }, { imageId: 'yellow', aspectRatio: 0.5, flexGrow: 1 }] }
  ];
  return { images, rows, recommendations, scenarios: ['mosaic two authored rows', 'narrow two recommendations', 'wide three recommendations', 'More/Fewer preserves image elements', 'live first four noninteractive images', 'pending placeholders', 'resolved empty', 'failed explicit fallback', 'canceled viewer intent', 'local previous/next and Escape'] };
}
