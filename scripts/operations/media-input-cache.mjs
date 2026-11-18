#!/usr/bin/env node
// Cache only inert, tracked media INPUTS. Never cache .git or post-build output.
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {constants} from 'node:fs';
import {lstat, open, readdir} from 'node:fs/promises';
import {resolve, sep} from 'node:path';
import {pathToFileURL} from 'node:url';

export const MEDIA_ROOTS = Object.freeze(['public/reels', 'public/reels-hls', 'media-sources']);
export const CACHE_VERSION = 'brief-media-inputs-v1';
export class MediaCacheError extends Error {
  constructor(code) { super(code); this.name = 'MediaCacheError'; this.code = code; }
}
const fail = code => { throw new MediaCacheError(code); };
function git(root, args) {
  try {
    return execFileSync('git', ['-c', 'core.fsmonitor=false', '-c', 'safe.directory='+root, '-C', root, ...args], {
      encoding:'utf8', maxBuffer:32 * 1024 * 1024, timeout:30_000,
      stdio:['ignore','pipe','pipe'],
      // Object inspection must never hydrate a missing partial-clone object.
      env:{...process.env, GIT_NO_LAZY_FETCH:'1', GIT_TERMINAL_PROMPT:'0'},
    });
  } catch { fail('GIT_METADATA_UNAVAILABLE'); }
}
function safePath(path) {
  if (typeof path !== 'string' || /[\\\x00-\x1f\x7f]/.test(path) ||
      path.split('/').some(part => !part || part === '.' || part === '..') ||
      !MEDIA_ROOTS.some(prefix => path.startsWith(prefix + '/'))) fail('UNSAFE_TRACKED_PATH');
  return path;
}
function child(root, path) {
  const value = resolve(root, path);
  if (!value.startsWith(root + sep)) fail('PATH_ESCAPES_ROOT');
  return value;
}
export function mediaInputPlan(directory = process.cwd()) {
  const root = resolve(directory);
  const format = git(root, ['rev-parse','--show-object-format']).trim();
  if (!['sha1','sha256'].includes(format)) fail('UNSUPPORTED_OBJECT_FORMAT');
  const hashPattern = new RegExp('^[a-f0-9]{' + (format === 'sha1' ? 40 : 64) + '}$');
  const commit = git(root, ['rev-parse','--verify','HEAD^{commit}']).trim();
  if (!hashPattern.test(commit)) fail('INVALID_COMMIT_IDENTITY');
  const trees = MEDIA_ROOTS.map(path => {
    const sha = git(root, ['rev-parse','--verify',commit + ':' + path]).trim();
    if (!hashPattern.test(sha) || git(root, ['cat-file','-t',sha]).trim() !== 'tree') fail('INVALID_MEDIA_TREE');
    return {path,sha};
  });
  const raw = git(root, ['ls-tree','-r','-z','--full-tree',commit,'--',...MEDIA_ROOTS]);
  if (!raw || !raw.endsWith('\0')) fail('EMPTY_OR_INCOMPLETE_INVENTORY');
  const files = raw.slice(0,-1).split('\0').map(record => {
    const split = record.indexOf('\t');
    if (split < 0) fail('INVALID_GIT_INVENTORY');
    const [mode,type,sha,...extra] = record.slice(0,split).split(' ');
    const path = safePath(record.slice(split+1));
    if (extra.length || type !== 'blob' || !['100644','100755'].includes(mode) || !hashPattern.test(sha)) fail('UNSUPPORTED_TRACKED_TYPE');
    return {path,mode,sha};
  });
  if (new Set(files.map(file=>file.path)).size !== files.length) fail('DUPLICATE_TRACKED_PATH');
  if (MEDIA_ROOTS.some(prefix=>!files.some(file=>file.path.startsWith(prefix+'/')))) fail('EMPTY_MEDIA_TREE');
  return {root,commit,format,trees,files,key:CACHE_VERSION+'-'+format+'-'+trees.map(tree=>tree.sha).join('-')};
}
async function requireDirectory(path) {
  let stat;
  try { stat = await lstat(path); } catch { fail('MISSING_MEDIA_DIRECTORY'); }
  if (stat.isSymbolicLink() || !stat.isDirectory()) fail('UNSAFE_MEDIA_DIRECTORY');
}
async function inspectFile(root, entry, format) {
  let handle;
  try {
    // O_NOFOLLOW rejects a leaf replaced with a symlink between inventory/hash.
    handle = await open(child(root,entry.path), constants.O_RDONLY | constants.O_NOFOLLOW);
    const before = await handle.stat();
    if (!before.isFile() || before.nlink !== 1) fail('UNSAFE_MEDIA_FILE');
    if (Boolean(before.mode & 0o111) !== (entry.mode === '100755')) fail('MEDIA_MODE_MISMATCH');
    const digest = createHash(format).update('blob '+before.size+'\0');
    let bytes = 0;
    for await (const chunk of handle.createReadStream({autoClose:false})) {
      bytes += chunk.length;
      digest.update(chunk);
    }
    const after = await handle.stat();
    if (bytes !== before.size || after.size !== before.size || after.mtimeMs !== before.mtimeMs || after.ctimeMs !== before.ctimeMs) fail('MEDIA_CHANGED_DURING_HASH');
    if (digest.digest('hex') !== entry.sha) fail('MEDIA_CONTENT_MISMATCH');
    return bytes;
  } catch (error) {
    if (error instanceof MediaCacheError) throw error;
    fail('MEDIA_FILE_UNREADABLE');
  } finally { await handle?.close(); }
}
export async function verifyMediaInputs(directory = process.cwd()) {
  const plan = mediaInputPlan(directory);
  const expected = new Map(plan.files.map(entry=>[entry.path,entry]));
  const directories = new Set();
  for (const {path} of plan.files) {
    const parts = path.split('/');
    for (let i=1;i<parts.length;i++) directories.add(parts.slice(0,i).join('/'));
  }
  // Validate every ancestor before traversing restored directories. Other public
  // assets are deliberately outside this cache and need not be inventoried.
  for (const path of directories) await requireDirectory(child(plan.root,path));
  let count=0, bytes=0;
  async function walk(path) {
    const entries = await readdir(child(plan.root,path),{withFileTypes:true});
    for (const entry of entries) {
      const relative=path+'/'+entry.name;
      if (entry.isSymbolicLink()) fail('UNSAFE_MEDIA_FILE');
      if (entry.isDirectory()) {
        if (!directories.has(relative)) fail('UNEXPECTED_MEDIA_PATH');
        await walk(relative);
      } else {
        if (!entry.isFile()) fail('UNSAFE_MEDIA_FILE');
        const tracked=expected.get(relative);
        if (!tracked) fail('UNEXPECTED_MEDIA_PATH');
        bytes+=await inspectFile(plan.root,tracked,plan.format);
        expected.delete(relative);count++;
      }
    }
  }
  try { for (const path of MEDIA_ROOTS) await walk(path); }
  catch(error) { if(error instanceof MediaCacheError)throw error;fail('MEDIA_INVENTORY_UNREADABLE'); }
  if (expected.size) fail('MISSING_MEDIA_FILE');
  return {ok:true,key:plan.key,files:count,bytes};
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const [command,directory,...extra]=process.argv.slice(2);
    if (extra.length || !['key','verify'].includes(command)) fail('USAGE_KEY_OR_VERIFY');
    if (command === 'key') console.log(mediaInputPlan(directory).key);
    else console.log(JSON.stringify(await verifyMediaInputs(directory)));
  } catch(error) {
    // Never print Git stderr, cache contents, or arbitrary filesystem messages.
    console.error('Media input cache: '+(error instanceof MediaCacheError ? error.code : 'VERIFICATION_FAILED'));
    process.exitCode=1;
  }
}
