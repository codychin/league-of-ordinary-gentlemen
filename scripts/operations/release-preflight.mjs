#!/usr/bin/env node
// Offline evidence checker. This does not grant permission or contact a provider.
import {createHash, randomUUID} from 'node:crypto';
import {readFileSync, mkdirSync, openSync, writeFileSync, fsyncSync, closeSync, renameSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const hash = (algorithm, bytes) => createHash(algorithm).update(bytes).digest('hex');
const sha = /^[a-f0-9]{40}$/;
function requireValue(condition, message) { if (!condition) throw new Error(message); }
function fresh(at, now, maxAgeMs) {
  const time = Date.parse(at);
  return Number.isFinite(time) && time <= now && now - time <= maxAgeMs;
}
export function assetIdentity(bytes) {
  return {bytes: bytes.length, sha256: hash('sha256', bytes),
    gitBlobSha: hash('sha1', Buffer.concat([Buffer.from(`blob ${bytes.length}\0`), bytes]))};
}
function validPath(path) {
  return typeof path === 'string' && path.length > 0 && !path.startsWith('/') &&
    !path.includes('\\') && !path.split('/').some(p => !p || p === '.' || p === '..');
}

// Call immediately after EACH successful remote read, not at the end of a batch.
// Directory must be retained outside ephemeral session storage and backed up by operator.
export function recordReceipt(directory, {releaseId, repository, targetRef, path, identity, remote}, now = Date.now()) {
  requireValue(typeof releaseId === 'string' && releaseId.length > 0, 'releaseId required');
  requireValue(typeof repository === 'string' && /^[^/]+\/[^/]+$/.test(repository), 'repository required');
  requireValue(typeof targetRef === 'string' && targetRef.startsWith('refs/heads/') && targetRef.length > 11,
    'intended targetRef required');
  requireValue(validPath(path), 'relative asset path required');
  requireValue(identity && Number.isSafeInteger(identity.bytes) && identity.bytes >= 0 &&
    /^[a-f0-9]{64}$/.test(identity.sha256) && sha.test(identity.gitBlobSha), 'invalid identity');
  requireValue(remote?.status === 'found' && remote.sha === identity.gitBlobSha &&
    fresh(remote.observedAt, now, 300000), 'fresh matching remote blob read required; approval is not execution');
  // A blob can exist without being reachable from any commit. Never claim publication here.
  const receipt = {version: 1, scope: 'git-blob-only', releaseId, repository, targetRef, path, identity, remote, recordedAt: new Date(now).toISOString()};
  mkdirSync(directory, {recursive: true});
  const destination = resolve(directory, hash('sha256', Buffer.from(`${releaseId}\0${repository}\0${targetRef}\0${path}`)) + '.json');
  const temporary = destination + '.' + randomUUID() + '.tmp';
  const fd = openSync(temporary, 'wx', 0o600);
  try { writeFileSync(fd, JSON.stringify(receipt, null, 2) + '\n'); fsyncSync(fd); } finally { closeSync(fd); }
  renameSync(temporary, destination);
  const dir = openSync(dirname(destination), 'r');
  try { fsyncSync(dir); } finally { closeSync(dir); }
  return {receipt, destination};
}

// Supply a NEW remote read on resume, even if a receipt exists. Never guess from filenames.
export function resumeDecision({identity, approval, remote}, now = Date.now()) {
  requireValue(identity && sha.test(identity.gitBlobSha), 'invalid identity');
  if (!remote || !fresh(remote.observedAt, now, 300000)) return 'read-remote-first';
  if (remote.status === 'found') return remote.sha === identity.gitBlobSha ? 'already-present' : 'stop-byte-conflict';
  if (remote.status !== 'not_found') return 'read-remote-first';
  // accepted/requested/visible are not approval, let alone successful execution.
  return approval === 'approved' ? 'eligible-for-authorized-upload' : 'wait-for-authorization';
}

export function checkPreflight(snapshot, now = Date.now()) {
  const errors = [];
  if (!snapshot || snapshot.version !== 1) return ['version 1 snapshot required'];
  if (!fresh(snapshot.observedAt, now, 300000)) errors.push('fresh remote snapshot required (maximum 5 minutes)');
  if (!sha.test(snapshot.expectedMain || '') || snapshot.currentMain !== snapshot.expectedMain)
    errors.push('main moved or exact expected main is missing');
  if (snapshot.taskKind !== 'engineering-release') errors.push('isolated engineering-release task required');
  for (const gate of ['assetUpload', 'previewVerification', 'productionPromotion']) {
    if (snapshot.releasePath?.[gate] !== 'verified') errors.push(`release path unverified: ${gate}`);
  }
  if (!Array.isArray(snapshot.workflows) || snapshot.workflowScanComplete !== true) {
    errors.push('complete workflow snapshot required');
  } else {
    for (const run of snapshot.workflows) {
      if (!run || typeof run !== 'object' || typeof run.id !== 'string' || typeof run.writesReleaseState !== 'boolean' ||
        !['queued', 'in_progress', 'waiting', 'pending', 'requested', 'completed'].includes(run.status)) {
        errors.push('unclassified workflow run');
      } else if (run.writesReleaseState && run.status !== 'completed') {
        errors.push(`conflicting writer workflow ${run.id}: ${run.status}`);
      }
    }
  }
  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const [command, file, directory] = process.argv.slice(2);
    if (command === 'hash') console.log(JSON.stringify(assetIdentity(readFileSync(file)), null, 2));
    else {
      const evidence = JSON.parse(readFileSync(file, 'utf8'));
      if (command === 'check') {
        const errors = checkPreflight(evidence);
        console.log(JSON.stringify({ok: errors.length === 0, errors}, null, 2));
        if (errors.length) process.exitCode = 1;
      } else if (command === 'resume') {
        const decision = resumeDecision(evidence);
        console.log(decision);
        if (!['already-present', 'eligible-for-authorized-upload'].includes(decision)) process.exitCode = 1;
      }
      else if (command === 'record' && directory) console.log(recordReceipt(directory, evidence).destination);
      else throw new Error('Usage: release-preflight.mjs hash FILE | check SNAPSHOT | resume EVIDENCE | record EVIDENCE RECEIPT_DIR');
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
