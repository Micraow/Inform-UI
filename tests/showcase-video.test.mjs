import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {JSDOM} from 'jsdom';
import {validateDocument} from '../dist/index.js';
import {createVideoExample} from '../scripts/generate-showcase-video.mjs';

const example = JSON.parse(await readFile('showcase/examples/video.json', 'utf8'));
const media = await readFile('showcase/assets/video/motion-study.mp4');
const poster = await readFile('showcase/assets/video/motion-study.png');
const captions = await readFile('showcase/assets/video/motion-study.vtt', 'utf8');
const manifest = JSON.parse(await readFile('showcase/assets/video/manifest.json', 'utf8'));
const supplied = () => new JSDOM(example.body[0].html);
const dataBytes = (value, mime) => {
  assert.match(value, new RegExp(`^data:${mime};base64,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$`));
  const decoded = Buffer.from(value.slice(value.indexOf(',') + 1), 'base64');
  assert.ok(decoded.length > 0); return decoded;
};

test('video composition reuses html-view without adding a wire type or changing YouTube', () => {
  const result = validateDocument(example);
  assert.equal(result.ok, true, JSON.stringify(result.issues));
  assert.equal(example.body.length, 1); assert.equal(example.body[0].type, 'html-view');
  assert.equal(example.body[0].title, 'Local video playback');
  assert.deepEqual(example, createVideoExample(media, poster, captions));
  assert.ok(example.body[0].html.length < 200000);
  assert.equal(validateDocument({version: 'iui/1', body: [{type: 'youtube', label: 'Supplied synthetic video ID', videoId: 'abcdefghijk', loadMode: 'on-demand'}]}).ok, true);
  assert.equal(validateDocument({version: 'iui/1', body: [{type: 'video', src: 'data:video/mp4;base64,AA=='}]}).ok, false);
});

test('native controls and bounded embedded MP4, PNG and WebVTT bytes match their source assets', () => {
  const dom = supplied(), doc = dom.window.document, video = doc.querySelector('video');
  try {
    assert.equal(doc.querySelectorAll('video').length, 1);
    assert.ok(video.hasAttribute('controls')); assert.ok(video.hasAttribute('playsinline'));
    assert.equal(video.getAttribute('preload'), 'metadata'); assert.equal(video.hasAttribute('autoplay'), false);
    assert.equal(video.getAttribute('aria-label'), 'Original geometric motion study');
    assert.deepEqual(dataBytes(video.querySelector('source').src, 'video/mp4'), media);
    assert.deepEqual(dataBytes(video.poster, 'image/png'), poster);
    const track = video.querySelector('track');
    assert.equal(track.kind, 'captions'); assert.equal(track.srclang, 'en'); assert.equal(track.default, true);
    assert.equal(dataBytes(track.src, 'text/vtt').toString(), captions);
    assert.equal(captions.match(/-->/g).length, 3);
    assert.equal(doc.querySelectorAll('iframe,script[src],link,form,object,embed').length, 0);
    for (const node of doc.querySelectorAll('[src],[poster],[href]')) for (const name of ['src', 'poster', 'href']) {
      if (node.hasAttribute(name)) assert.match(node.getAttribute(name), /^data:/);
    }
    assert.doesNotMatch(example.body[0].html, /https?:\/\/|document\.cookie|localStorage|fetch\(|XMLHttpRequest|navigator\./);
    assert.equal(doc.querySelector('#video-error').hidden, true);
    assert.equal(doc.querySelector('#video-error').getAttribute('role'), 'alert');
    assert.match(doc.querySelector('details').textContent, /three rising bars/);
  } finally {dom.window.close();}
});

test('supplied video is a tiny self-contained MP4 with complete metadata and a pinned digest', () => {
  assert.equal(media.length, manifest.bytes); assert.ok(media.length < 50000);
  assert.equal(createHash('sha256').update(media).digest('hex'), manifest.sha256);
  assert.deepEqual([manifest.width, manifest.height, manifest.fps, manifest.seconds, manifest.audio], [320, 180, 8, 8, false]);
  const boxes = [];
  for (let offset = 0; offset < media.length;) {
    const size = media.readUInt32BE(offset), type = media.toString('ascii', offset + 4, offset + 8);
    assert.ok(size >= 8 && offset + size <= media.length); boxes.push(type); offset += size;
  }
  assert.equal(boxes[0], 'ftyp'); assert.ok(boxes.includes('moov')); assert.ok(boxes.includes('mdat'));
  assert.ok(boxes.indexOf('moov') < boxes.indexOf('mdat'), 'fast-start metadata precedes the video payload');
  assert.equal(poster.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(poster.readUInt32BE(16), 320); assert.equal(poster.readUInt32BE(20), 180);
  assert.throws(() => createVideoExample(Buffer.alloc(0), poster), /bounded/);
  assert.throws(() => createVideoExample(Buffer.alloc(100001), poster), /bounded/);
  assert.throws(() => createVideoExample(media, Buffer.alloc(10001)), /bounded/);
});

test('local status and failure fallback track native media events', () => {
  const dom = new JSDOM(example.body[0].html, {runScripts: 'dangerously'}), doc = dom.window.document;
  try {
    const video = doc.querySelector('video'), status = doc.querySelector('#video-status'), error = doc.querySelector('#video-error');
    const fire = (target, name) => target.dispatchEvent(new dom.window.Event(name));
    fire(video, 'loadedmetadata'); assert.match(status.textContent, /^Ready/);
    fire(video, 'play'); assert.match(status.textContent, /^Playing/);
    fire(video, 'pause'); assert.match(status.textContent, /^Paused/);
    fire(video, 'ended'); assert.match(status.textContent, /^Finished/);
    fire(video.querySelector('source'), 'error'); assert.equal(error.hidden, false); assert.equal(status.textContent, 'Video unavailable');
    fire(video, 'loadedmetadata'); assert.equal(error.hidden, true);
    fire(video, 'error'); assert.equal(error.hidden, false);
  } finally {dom.window.close();}
});
