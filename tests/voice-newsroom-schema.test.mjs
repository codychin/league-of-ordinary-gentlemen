import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Static draft-contract checks only. These do NOT execute a migration or prove
// runtime SQL syntax, RLS, locking, concurrent cap enforcement, or JWT auth.
const sql = readFileSync(new URL('../docs/voice-newsroom-schema.sql', import.meta.url), 'utf8');
const code = sql.replace(/--[^\n]*/g, '');

test('SQL remains an explicitly unapplied draft with fixed private boundary', () => {
  assert.match(sql, /UNAPPLIED DRAFT/);
  assert.match(code, /create schema brief_voice_private;/);
  assert.match(code, /revoke all on schema brief_voice_private from public, anon, authenticated/);
  for (const table of ['rooms', 'budget', 'operations']) {
    assert.match(code, new RegExp(`alter table brief_voice_private\\.${table} enable row level security`));
  }
  assert.doesNotMatch(code, /create\s+(role|policy|extension)|cron\.|service_role|grant\s+all/i);
});

test('RPC is fixed-search-path, owner checked, private internals inaccessible', () => {
  assert.equal((code.match(/set search_path = ''/g) || []).length, 2);
  assert.match(code, /v_owner is null or public\.brief_manage_is_owner\(\) is not true/);
  assert.match(code, /where id = p_room and owner_id = v_owner for update/);
  assert.match(code, /where id = p_operation and owner_id = v_owner for update/);
  assert.match(code, /revoke all on function brief_voice_private\.room_action[\s\S]*?from public, anon, authenticated/);
  assert.match(code, /grant execute on function public\.brief_voice_room\(text,uuid,uuid,text,text,bigint,uuid\) to authenticated/);
});

test('room expiry, turn invalidation, allowed voices and heard-only transcript', () => {
  assert.match(code, /interval '20 minutes'/);
  assert.match(code, /v_room\.expires_at <= clock_timestamp\(\)/);
  assert.match(code, /p_speaker not in \('rika','maude','hollis','marnie'\)/);
  assert.match(code, /v_room\.current_turn is distinct from p_turn/);
  assert.match(code, /current_turn = v_turn, current_speaker = p_speaker,\s*pending_text = null/);
  assert.match(code, /p_action = 'heard'[\s\S]*?transcript = transcript \|\|/);
  assert.match(code, /p_action = 'interrupt'[\s\S]*?current_turn = null/);
  assert.doesNotMatch(code, /bytea|audio|storage\./i);
});

test('lifetime budget atomically serializes immutable operation IDs, no refunds', () => {
  assert.match(code, /total_micro_usd between 0 and 20000000/);
  assert.match(code, /from brief_voice_private\.budget where id = true for update/);
  assert.match(code, /v_total > 20000000 - p_amount/);
  assert.match(code, /Operation already reserved/);
  assert.match(code, /total_micro_usd = total_micro_usd \+ p_amount/);
  assert.match(code, /v_operation\.state <> 'reserved'/);
  assert.match(code, /set state = 'started'/);
  assert.doesNotMatch(code, /delete from brief_voice_private\.(operations|budget)|total_micro_usd\s*=\s*total_micro_usd\s*-/);
  assert.doesNotMatch(code, /references\s|on delete cascade/i);
});
