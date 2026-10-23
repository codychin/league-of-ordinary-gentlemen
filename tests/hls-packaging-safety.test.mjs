import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { planPackages, generateMissing } from '../scripts/operations/package-missing-hls.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hls-safety-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'public/reels'), { recursive: true });
  for (const id of ['week6', 'week7']) {
    fs.writeFileSync(path.join(root, `public/reels/${id}.mp4`), id);
    const dir = path.join(root, `public/reels-hls/${id}`);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.m3u8'), '#EXTM3U\n#EXT-X-MAP:URI="init.mp4"\n#EXTINF:2,\nseg_000.m4s\n#EXT-X-ENDLIST\n');
    for (const f of ['init.mp4','poster.jpg','seg_000.m4s']) fs.writeFileSync(path.join(dir, f), `${id}:${f}`);
  }
  return root;
}

test('already packaged release requires zero ffmpeg calls and preserves Week6 byte-for-byte', t => {
  const root = fixture(t);
  const before = fs.readFileSync(path.join(root,'public/reels-hls/week6/seg_000.m4s'));
  const plan = planPackages(root, ['public/reels/week7.mp4', 'public/reels-hls/week7/index.m3u8']);
  assert.deepEqual(plan, []);
  generateMissing(root, plan, () => assert.fail('redundant ffmpeg invocation'));
  assert.deepEqual(fs.readFileSync(path.join(root,'public/reels-hls/week6/seg_000.m4s')), before);
});
test('missing new package does not schedule historical packages', t => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root,'public/reels/new.mp4'), 'new');
  assert.deepEqual(planPackages(root, ['public/reels/new.mp4']), ['new']);
  assert.deepEqual(planPackages(root), []);
});
test('changed source without explicit replacement package fails closed', t => {
  assert.throws(() => planPackages(fixture(t), ['public/reels/week7.mp4']), /Source changed/);
});
test('incomplete existing package fails without deleting history', t => {
  const root = fixture(t);
  fs.unlinkSync(path.join(root,'public/reels-hls/week7/seg_000.m4s'));
  assert.throws(() => planPackages(root));
  assert.ok(fs.existsSync(path.join(root,'public/reels-hls/week6/seg_000.m4s')));
});
test('transcode failure leaves existing history and no partial new package', t => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root,'public/reels/new.mp4'), 'new');
  assert.throws(() => generateMissing(root, ['new'], () => { throw Error('ffmpeg failed'); }), /ffmpeg failed/);
  assert.ok(!fs.existsSync(path.join(root,'public/reels-hls/new')));
  assert.deepEqual(fs.readdirSync(path.join(root,'public/reels-hls')).sort(), ['week6','week7']);
});
test('workflow cannot wipe history, rebase stale media, or publish branch media onto main', () => {
  const workflow = fs.readFileSync(new URL('../.github/workflows/transcode-reels-hls.yml', import.meta.url), 'utf8');
  assert.doesNotMatch(workflow, /rm -rf public\/reels-hls/);
  assert.doesNotMatch(workflow, /git pull --rebase/);
  assert.match(workflow, /branches: \[main\]/);
  assert.match(workflow, /github.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /cancel-in-progress: false/);
  assert.match(workflow, /Main advanced; refusing stale media commit/);
});

test('modified source cannot masquerade as replacement through a poster-only change', t => {
  assert.throws(() => planPackages(fixture(t), ['public/reels/week7.mp4', 'public/reels-hls/week7/poster.jpg'], ['public/reels/week7.mp4']), /Existing MP4 bytes changed/);
});
test('successful generation publishes only a validated new package', t => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root,'public/reels/new.mp4'), 'new');
  let calls = 0;
  generateMissing(root, ['new'], (_exe, args) => {
    calls++;
    const out = args.at(-1);
    if (out.endsWith('poster.jpg')) fs.writeFileSync(out, 'poster');
    else {
      fs.writeFileSync(out, '#EXTM3U\n#EXT-X-MAP:URI="init.mp4"\n#EXTINF:2,\nseg_000.m4s\n#EXT-X-ENDLIST\n');
      for (const file of ['init.mp4','seg_000.m4s']) fs.writeFileSync(path.join(path.dirname(out),file), file);
    }
  });
  assert.equal(calls, 2);
  assert.ok(fs.existsSync(path.join(root,'public/reels-hls/new/index.m3u8')));
  assert.deepEqual(planPackages(root), []);
});
