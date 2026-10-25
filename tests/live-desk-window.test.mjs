import test from 'node:test';
import assert from 'node:assert/strict';
import {LIVE_DESK_ENABLED, isSundayLiveWindow, isSundayDeskScheduledWindow as uiWindow} from '../lib/live-desk-state.js';
import {sharedDesk, isSundayDeskScheduledWindow as workerWindow} from '../supabase/functions/brief-editorial-worker/shared.ts';

const cases = [
  ['fall Sunday close', '2026-11-02T05:00:00Z', false],
  ['fall Sunday before close', '2026-11-02T04:59:59Z', true],
  ['weekday', '2026-10-26T18:00:00Z', false],
  ['summer before opening', '2026-10-18T14:29:59Z', false],
  ['summer opening', '2026-10-18T14:30:00Z', true],
  ['winter before opening', '2026-12-06T15:29:59Z', false],
  ['winter opening', '2026-12-06T15:30:00Z', true],
  ['spring transition before opening', '2026-03-08T14:29:59Z', false],
  ['spring transition opening', '2026-03-08T14:30:00Z', true],
  ['fall transition before opening', '2026-11-01T15:29:59Z', false],
  ['fall transition opening', '2026-11-01T15:30:00Z', true],
  ['Sunday night in New York despite Monday UTC', '2026-10-19T03:59:59Z', true],
  ['Monday midnight New York', '2026-10-19T04:00:00Z', false],
  ['Saturday after opening hour', '2026-10-17T18:00:00Z', false],
  ['today opening', '2026-10-25T14:30:00Z', true],
  ['Sunday midnight', '2026-10-18T04:00:00Z', false],
];

for (const [label, timestamp, expected] of cases) {
  test(`UI and worker agree: ${label}`, () => {
    const now = new Date(timestamp);
    assert.equal(uiWindow(now), expected);
    assert.equal(workerWindow(now), expected);
  });
}

test('UI opens only in the recurring authorized window', () => {
  assert.equal(LIVE_DESK_ENABLED, true);
  for (const [, timestamp, expected] of cases) assert.equal(isSundayLiveWindow(new Date(timestamp)), expected);
});

test('closed worker window performs no database or network operations', async () => {
  const db = new Proxy({}, {get() {throw new Error('Unexpected database operation');}});
  for (const [, timestamp, expected] of cases) {
    if (!expected) assert.deepEqual(await sharedDesk(db, new Date(timestamp)), {ok:true, closed:true});
  }
});

test('opening the intended window does not bypass disabled database control', async () => {
  const calls = [];
  const db = {
    async rpc(name) {calls.push(name); assert.equal(name, 'claim_brief_attempt'); return {data:false};},
    from() {throw new Error('Disabled worker must not read evidence or write posts');},
  };
  assert.deepEqual(await sharedDesk(db, new Date('2026-10-18T14:30:00Z')), {ok:true, idle:true});
  assert.deepEqual(calls, ['claim_brief_attempt']);
});
