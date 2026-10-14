import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {deflateSync} from 'node:zlib';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const width = 320, height = 180, fps = 8, seconds = 8;
const mediaDirectory = 'showcase/assets/video';
const captionText = `WEBVTT

00:00.000 --> 00:02.500
A blue dot moves across three rising bars.

00:02.500 --> 00:05.000
The bars gently change height as the dot travels.

00:05.000 --> 00:08.000
The dot returns to its starting point.
`;

// Every pixel comes from these elementary shapes. No captured or third-party media.
function frame(index) {
  const pixels = Buffer.alloc(width * height * 3);
  const phase = index / (fps * seconds), t = phase * Math.PI * 2;
  const circleX = 58 + (1 - Math.cos(t)) * 99, circleY = 45 + Math.sin(t) * 12;
  const bars = [0, 1, 2].map(i => ({x: 58 + i * 73, h: 32 + i * 20 + Math.sin(t + i) * 9}));
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    let color = [246 - Math.floor(y / 22), 248 - Math.floor(y / 25), 253 - Math.floor(y / 32)];
    if (x >= 28 && x < 292 && y >= 144 && y < 146) color = [202, 210, 227];
    for (const [i, bar] of bars.entries()) if (x >= bar.x && x < bar.x + 44 && y >= 140 - bar.h && y < 140) color = [[139, 165, 230], [106, 138, 219], [78, 108, 197]][i];
    if ((x - circleX) ** 2 + (y - circleY) ** 2 < 12 ** 2) color = [65, 95, 183];
    if (y >= 164 && y < 168 && x >= 28 && x < 292) color = x < 28 + phase * 264 ? [78, 108, 197] : [221, 227, 239];
    const offset = (y * width + x) * 3;
    pixels[offset] = color[0]; pixels[offset + 1] = color[1]; pixels[offset + 2] = color[2];
  }
  return pixels;
}

function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) {crc ^= byte; for (let n = 0; n < 8; n++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);}
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(name, data) {
  const type = Buffer.from(name), length = Buffer.alloc(4), checksum = Buffer.alloc(4);
  length.writeUInt32BE(data.length); checksum.writeUInt32BE(crc32(Buffer.concat([type, data])));
  return Buffer.concat([length, type, data, checksum]);
}
function png(pixels) {
  const header = Buffer.alloc(13); header.writeUInt32BE(width); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 2;
  const scanlines = Buffer.alloc(height * (width * 3 + 1));
  for (let y = 0; y < height; y++) pixels.copy(scanlines, y * (width * 3 + 1) + 1, y * width * 3, (y + 1) * width * 3);
  return Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), chunk('IHDR', header), chunk('IDAT', deflateSync(scanlines)), chunk('IEND', Buffer.alloc(0))]);
}

export function createVideoExample(videoBytes, posterBytes, captions = captionText, mime = 'video/mp4') {
  if (!['video/mp4', 'video/webm'].includes(mime)) throw Error('Use a supported local video MIME type.');
  if (!Buffer.isBuffer(videoBytes) || !videoBytes.length || videoBytes.length > 100000) throw Error('Use the bounded supplied video asset.');
  if (!Buffer.isBuffer(posterBytes) || !posterBytes.length || posterBytes.length > 10000) throw Error('Use the bounded supplied PNG poster.');
  const videoURI = `data:${mime};base64,${videoBytes.toString('base64')}`;
  const posterURI = `data:image/png;base64,${posterBytes.toString('base64')}`;
  const captionsURI = `data:text/vtt;base64,${Buffer.from(captions).toString('base64')}`;
  // html-view's existing media policy permits data sources. This example adds no
  // URL/schema permission and never accepts a remote URL or interpolated markup.
  const html = `<style>
*{box-sizing:border-box}body{margin:0;padding:14px;font:14px/1.5 system-ui,sans-serif;color:#65718a;background:transparent}h2{margin:0 0 10px;font-size:16px;font-weight:600;color:#677798}video{display:block;width:100%;max-height:260px;aspect-ratio:16/9;object-fit:contain;background:#eaf0fb;border-radius:12px}video:focus-visible,summary:focus-visible{outline:3px solid #6488ed;outline-offset:3px}p{margin:9px 0 0;font-size:12px}#video-error{padding:8px 10px;color:#9b2943;background:#fff1f3;border-radius:8px}details{margin-top:8px;font-size:12px}summary{cursor:pointer}details p{margin-top:4px}::cue{background:rgba(20,30,55,.85);color:white;font:13px system-ui}
</style>
<h2>Motion study · 8 seconds</h2>
<video id="local-video" controls playsinline preload="metadata" crossorigin="anonymous" poster="${posterURI}" aria-label="Original geometric motion study" aria-describedby="video-description" tabindex="0">
  <source src="${videoURI}" type="${mime}">
  <track id="video-captions" kind="captions" label="English" srclang="en" src="${captionsURI}" default>
  Your browser does not support native video playback.
</video>
<p id="video-description">Original silent clip. Use the player to play, pause, seek, or toggle captions.</p>
<p id="video-status" role="status" aria-live="polite">Loading local video…</p>
<p id="video-error" role="alert" hidden>This browser could not play the embedded video. The transcript remains available below.</p>
<details><summary>Read transcript</summary><p>A blue dot moves across three rising bars. The bars gently change height as the dot travels. The dot returns to its starting point.</p></details>
<script>
(() => {
  const video=document.getElementById('local-video'),status=document.getElementById('video-status'),error=document.getElementById('video-error');
  const fail=()=>{error.hidden=false;status.textContent='Video unavailable';};
  video.addEventListener('loadedmetadata',()=>{error.hidden=true;status.textContent='Ready · 8 seconds · stored in this file';});
  video.addEventListener('play',()=>{status.textContent='Playing · local video';});
  video.addEventListener('pause',()=>{if(!video.error)status.textContent=video.ended?'Finished · replay with the player':'Paused · local video';});
  video.addEventListener('ended',()=>{status.textContent='Finished · replay with the player';});
  video.addEventListener('error',fail);
  video.querySelector('source').addEventListener('error',fail);
  if(video.readyState>=1)status.textContent='Ready · 8 seconds · stored in this file';
})();
</script>`;
  if (html.length > 200000) throw Error('Video example exceeds the existing html-view bound.');
  return {version: 'iui/1', title: 'Local video playback', body: [{type: 'html-view', id: 'local-video-example', title: 'Local video playback', width: '100%', height: 430, html}]};
}

export async function generateShowcaseVideo() {
  await mkdir(mediaDirectory, {recursive: true});
  const frames = Buffer.concat(Array.from({length: fps * seconds}, (_, i) => frame(i)));
  const output = `${mediaDirectory}/motion-study.mp4`;
  // Bounded one-thread encode: 64 tiny frames, 11 MB raw input, no audio/network.
  const result = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pixel_format', 'rgb24', '-video_size', `${width}x${height}`, '-framerate', String(fps), '-i', 'pipe:0', '-an', '-c:v', 'libx264', '-threads', '1', '-preset', 'veryfast', '-crf', '27', '-pix_fmt', 'yuv420p', '-profile:v', 'baseline', '-movflags', '+faststart', '-map_metadata', '-1', '-fflags', '+bitexact', '-flags:v', '+bitexact', output], {input: frames, maxBuffer: 1024 * 1024, timeout: 30000});
  if (result.error || result.status !== 0) throw result.error ?? Error(result.stderr.toString());
  const media = await readFile(output), poster = png(frame(0));
  // VP9 is supported by the lock-pinned open-source Chromium build, which does
  // not include the proprietary H.264 decoder. Preserve MP4 for other consumers.
  const webmOutput = `${mediaDirectory}/motion-study.webm`;
  const webmResult = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pixel_format', 'rgb24', '-video_size', `${width}x${height}`, '-framerate', String(fps), '-i', 'pipe:0', '-an', '-c:v', 'libvpx-vp9', '-threads', '1', '-crf', '32', '-b:v', '0', '-pix_fmt', 'yuv420p', '-map_metadata', '-1', '-fflags', '+bitexact', '-flags:v', '+bitexact', webmOutput], {input: frames, maxBuffer: 1024 * 1024, timeout: 30000});
  if (webmResult.error || webmResult.status !== 0) throw webmResult.error ?? Error(webmResult.stderr.toString());
  const webm = await readFile(webmOutput);
  const document = createVideoExample(webm, poster, captionText, 'video/webm');
  await writeFile(`${mediaDirectory}/motion-study.png`, poster);
  await writeFile(`${mediaDirectory}/motion-study.vtt`, captionText);
  await writeFile('showcase/examples/video.json', JSON.stringify(document, null, 2) + '\n');
  const manifest = {format: 'inform-ui-original-media/1', origin: 'Original generated geometric animation; no captured or third-party imagery', license: 'MIT', generator: 'scripts/generate-showcase-video.mjs', codec: 'H.264 Constrained Baseline', width, height, fps, seconds, audio: false, bytes: media.length, sha256: createHash('sha256').update(media).digest('hex'), webm: {file: 'motion-study.webm', codec: 'VP9', bytes: webm.length, sha256: createHash('sha256').update(webm).digest('hex')}};
  await writeFile(`${mediaDirectory}/manifest.json`, JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await generateShowcaseVideo(), null, 2));
