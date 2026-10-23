import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {assetIdentity, recordReceipt, resumeDecision, checkPreflight} from '../scripts/operations/release-preflight.mjs';

const now = Date.parse('2026-10-23T21:00:00Z');
const observedAt = new Date(now).toISOString();
const identity = assetIdentity(Buffer.from('hello\n'));
const remote = {status: 'found', sha: identity.gitBlobSha, observedAt};
const snapshot = () => ({version: 1, observedAt, taskKind: 'engineering-release',
  expectedMain: 'a'.repeat(40), currentMain: 'a'.repeat(40), workflowScanComplete: true,
  workflows: [], releasePath: {assetUpload: 'verified', previewVerification: 'verified', productionPromotion: 'verified'}});

test('identity is deterministic and matches real git hash-object; repackaging changes it', () => {
  const git = spawnSync('git', ['hash-object', '--stdin'], {input: 'hello\n', encoding: 'utf8'});
  assert.equal(git.status, 0);
  assert.equal(identity.gitBlobSha, git.stdout.trim());
  assert.deepEqual(assetIdentity(Buffer.from('hello\n')), identity);
  assert.notEqual(assetIdentity(Buffer.from('hello\r\n')).gitBlobSha, identity.gitBlobSha);
});

test('accepted/pending/visible/denied approval never counts as upload execution or permission', () => {
  for (const approval of ['accepted', 'pending', 'visible', 'denied', undefined]) {
    assert.equal(resumeDecision({identity, approval}, now), 'read-remote-first');
    assert.equal(resumeDecision({identity, approval, remote: {status: 'not_found', observedAt}}, now), 'wait-for-authorization');
  }
});

test('uncertain outcome requires remote read; matching bytes skip and mismatched bytes stop', () => {
  assert.equal(resumeDecision({identity, approval: 'approved'}, now), 'read-remote-first');
  assert.equal(resumeDecision({identity, remote}, now), 'already-present');
  assert.equal(resumeDecision({identity, remote: {...remote, sha: 'b'.repeat(40)}}, now), 'stop-byte-conflict');
  assert.equal(resumeDecision({identity, approval: 'approved', remote: {status: 'not_found', observedAt}}, now), 'eligible-for-authorized-upload');
  assert.equal(resumeDecision({identity, remote: {...remote, observedAt: '2026-10-23T20:00:00Z'}}, now), 'read-remote-first');
  assert.equal(resumeDecision({identity, remote: {...remote, observedAt: '2026-10-23T22:00:00Z'}}, now), 'read-remote-first');
});

test('each verified file has an immediately readable atomic receipt; batch interruption loses none', () => {
  const directory = mkdtempSync(join(tmpdir(), 'brief-receipts-'));
  try {
    const evidence = {releaseId: 'week7', repository: 'codychin/league-of-ordinary-gentlemen', targetRef: 'refs/heads/week7', path: 'public/reels/a.mp4', identity, remote};
    const first = recordReceipt(directory, evidence, now);
    assert.deepEqual(JSON.parse(readFileSync(first.destination)).identity, identity);
    assert.equal(readdirSync(directory).length, 1);
    assert.equal(JSON.parse(readFileSync(first.destination)).scope, 'git-blob-only');
    // Simulate the next upload's ambiguous outcome: it must not create a success receipt.
    assert.throws(() => recordReceipt(directory, {...evidence, path: 'public/reels/b.mp4', remote: {status: 'accepted', observedAt}}, now), /matching remote/);
    assert.equal(readdirSync(directory).length, 1);
    assert.equal(JSON.parse(readFileSync(first.destination)).path, evidence.path);
    assert.equal(recordReceipt(directory, evidence, now).destination, first.destination);
    assert.equal(readdirSync(directory).length, 1);
    assert.throws(() => recordReceipt(directory, {...evidence, remote: {...remote, sha: 'b'.repeat(40)}}, now), /matching remote/);
    assert.throws(() => recordReceipt(directory, {...evidence, path: '../escape'}, now), /relative asset/);
    assert.throws(() => recordReceipt(directory, {...evidence, targetRef: undefined}, now), /targetRef/);
    assert.notEqual(recordReceipt(directory, {...evidence, targetRef: 'refs/heads/other'}, now).destination, first.destination);
  } finally { rmSync(directory, {recursive: true, force: true}); }
});

test('preflight accepts complete evidence, rejects missing gates and task contamination', () => {
  assert.deepEqual(checkPreflight(snapshot(), now), []);
  assert.ok(checkPreflight({...snapshot(), taskKind: 'scheduled-newsroom'}, now).length);
  for (const gate of ['assetUpload', 'previewVerification', 'productionPromotion']) {
    const s = snapshot(); s.releasePath[gate] = 'pending';
    assert.ok(checkPreflight(s, now).some(e => e.includes(gate)));
  }
});

test('preflight fails closed on moved main, stale/incomplete scan, unknown or active writers', () => {
  assert.ok(checkPreflight({...snapshot(), currentMain: 'b'.repeat(40)}, now).length);
  assert.ok(checkPreflight({...snapshot(), workflowScanComplete: false}, now).length);
  assert.ok(checkPreflight({...snapshot(), observedAt: '2026-10-23T20:00:00Z'}, now).length);
  for (const status of ['queued', 'in_progress', 'waiting', 'pending', 'requested']) {
    assert.ok(checkPreflight({...snapshot(), workflows: [{id: '40027334542', writesReleaseState: true, status}]}, now).some(e => e.includes('conflicting writer')));
  }
  assert.ok(checkPreflight({...snapshot(), workflows: [{id: 'unknown', status: 'in_progress'}]}, now).length);
  assert.ok(checkPreflight({...snapshot(), workflows: [null]}, now).length);
  assert.deepEqual(checkPreflight({...snapshot(), workflows: [{id: 'complete', writesReleaseState: true, status: 'completed'}]}, now), []);
});

test('CLI returns nonzero for blocked resume and incomplete preflight', () => {
  const directory = mkdtempSync(join(tmpdir(), 'brief-evidence-'));
  try {
    const file = join(directory, 'evidence.json');
    writeFileSync(file, JSON.stringify({identity, approval: 'accepted'}));
    const resume = spawnSync(process.execPath, ['scripts/operations/release-preflight.mjs', 'resume', file], {encoding: 'utf8'});
    assert.equal(resume.status, 1);
    assert.match(resume.stdout, /read-remote-first/);
    writeFileSync(file, '{}');
    assert.equal(spawnSync(process.execPath, ['scripts/operations/release-preflight.mjs', 'check', file]).status, 1);
  } finally { rmSync(directory, {recursive: true, force: true}); }
});
