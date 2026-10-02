import test from 'node:test';
import assert from 'node:assert/strict';
import {accessInput, articleInput, memoryInput, sameOrigin} from '../lib/manage-validation.mjs';

test('client-supplied article scope and league cannot redirect a write', () => {
  const row = articleInput({scope: 'global', league_id: 'another-league', slug: 'local-story', title: 'A local story', body_text: 'First paragraph.\n\nSecond paragraph.', writer_slug: 'gannon', status: 'draft'}, 'authorized-league');
  assert.equal(row.scope, 'league');
  assert.equal(row.league_id, 'authorized-league');
  assert.deepEqual(row.body, ['First paragraph.', 'Second paragraph.']);
});
test('client-supplied memory league cannot redirect a write', () => {
  const row = memoryInput({league_id: 'other', subject_type: 'rivalry', memory_key: 'history', content: 'The local rivalry.', status: 'active'}, 'authorized-league');
  assert.equal(row.league_id, 'authorized-league');
});
test('membership roles cannot escalate to platform owner', () => {
  assert.throws(() => accessInput({email: 'member@example.com', role: 'owner'}));
  assert.deepEqual(accessInput({email: 'Member@Example.com', role: 'editor'}), {email: 'member@example.com', role: 'editor'});
});
test('article slugs cannot inject routes or queries', () => {
  for (const slug of ['../other', 'story?scope=global', 'hello/world', '']) {
    assert.throws(() => articleInput({slug, title: 'Story', body_text: 'Body', writer_slug: 'gannon', status: 'draft'}, 'league'));
  }
});
test('writes reject cross-origin and missing-origin requests', () => {
  const req = origin => new Request('https://www.ordinarybrief.com/api/manage', {method: 'POST', headers: origin ? {origin} : {}});
  assert.equal(sameOrigin(req('https://www.ordinarybrief.com')), true);
  assert.equal(sameOrigin(req('https://attacker.example')), false);
  assert.equal(sameOrigin(req()), false);
});
