#!/usr/bin/env node
// Never rewrite existing packages. Changed source bytes require an explicit reviewed package.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export function validatePackage(dir) {
  const playlist = fs.readFileSync(path.join(dir, 'index.m3u8'), 'utf8');
  if (!playlist.startsWith('#EXTM3U') || !playlist.includes('#EXT-X-ENDLIST')) throw Error(`Incomplete VOD: ${dir}`);
  const refs = [...playlist.matchAll(/URI="([^"]+)"/g)].map(m => m[1]);
  refs.push(...playlist.split(/\r?\n/).filter(l => l && !l.startsWith('#')));
  if (!refs.some(f => f.endsWith('.m4s')) || !refs.includes('init.mp4')) throw Error(`Missing segments/init: ${dir}`);
  for (const name of ['poster.jpg', ...refs]) {
    if (name !== path.basename(name) || name.includes('..') || !fs.statSync(path.join(dir, name)).isFile() || fs.statSync(path.join(dir, name)).size === 0) throw Error(`Invalid package file: ${name}`);
  }
}

export function planPackages(root, changedPaths = [], modifiedSources = []) {
  const changed = new Set(changedPaths);
  if (modifiedSources.some(p => p.startsWith('public/reels/') && p.endsWith('.mp4'))) {
    throw Error('Existing MP4 bytes changed: use a new immutable asset ID or a separately reviewed repair.');
  }
  const sources = fs.readdirSync(path.join(root, 'public/reels')).filter(f => f.endsWith('.mp4')).sort();
  const missing = [];
  for (const file of sources) {
    const id = file.slice(0, -4);
    const dir = path.join(root, 'public/reels-hls', id);
    if (!fs.existsSync(dir)) {
      // Historical MP4-only fallbacks are not an invitation to regenerate history.
      if (changed.has(`public/reels/${file}`)) missing.push(id);
      continue;
    }
    validatePackage(dir); // Broken existing packages fail; never delete history to repair them.
    if (changed.has(`public/reels/${file}`) && !changedPaths.some(p => p.startsWith(`public/reels-hls/${id}/`))) {
      throw Error(`Source changed without a replacement package: ${id}. Prepare and review that package explicitly.`);
    }
  }
  return missing;
}

export function generateMissing(root, ids, run = execFileSync) {
  for (const id of ids) {
    const final = path.join(root, 'public/reels-hls', id);
    if (fs.existsSync(final)) throw Error(`Refusing to overwrite ${final}`);
    fs.mkdirSync(path.dirname(final), { recursive: true });
    const tmp = fs.mkdtempSync(path.join(path.dirname(final), '.packaging-'));
    const src = path.join(root, 'public/reels', `${id}.mp4`);
    try {
      run('ffmpeg', ['-y','-ss','0.05','-i',src,'-frames:v','1','-vf',"scale='min(720,iw)':-2",'-q:v','3',path.join(tmp,'poster.jpg')], { stdio: 'inherit' });
      run('ffmpeg', ['-y','-i',src,'-vf',"scale='min(720,iw)':-2:force_original_aspect_ratio=decrease",'-c:v','libx264','-preset','medium','-profile:v','high','-level','4.0','-b:v','2200k','-maxrate','2600k','-bufsize','4400k','-g','60','-keyint_min','60','-sc_threshold','0','-c:a','aac','-b:a','128k','-ar','48000','-hls_time','2','-hls_playlist_type','vod','-hls_segment_type','fmp4','-hls_fmp4_init_filename','init.mp4','-hls_segment_filename',path.join(tmp,'seg_%03d.m4s'),path.join(tmp,'index.m3u8')], { stdio: 'inherit' });
      validatePackage(tmp);
      fs.renameSync(tmp, final);
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = process.cwd();
  const before = process.env.BEFORE_SHA;
  let changed = [];
  if (before && !/^0+$/.test(before)) changed = execFileSync('git', ['diff','--name-only',before,'HEAD'], { encoding: 'utf8' }).trim().split('\n');
  const modified = before && !/^0+$/.test(before)
    ? execFileSync('git', ['diff','--name-only','--diff-filter=M',before,'HEAD'], { encoding: 'utf8' }).trim().split('\n') : [];
  const ids = planPackages(root, changed, modified);
  if (process.argv.includes('--plan')) console.log(JSON.stringify(ids));
  else generateMissing(root, ids);
}
