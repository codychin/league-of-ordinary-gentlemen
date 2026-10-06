import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('staging blocks every production data/function call before network access', async () => {
  const originalFetch=globalThis.fetch;
  const previous=process.env.BRIEF_ENV;
  let calls=[];
  globalThis.fetch=async (...args)=>{calls.push(args);return new Response('ok');};
  process.env.BRIEF_ENV='staging';
  try {
    const {register}=await import('../instrumentation.js');
    await register();
    for(const path of ['/rest/v1/articles','/auth/v1/token','/functions/v1/brief-push?action=send','/functions/v1/brief-sunday-engine?action=tick']){
      await assert.rejects(fetch('https://dnzdbqycuuoonewcowis.supabase.co'+path),/Staging cannot access/);
    }
    assert.equal(calls.length,0);
    await fetch('https://dnzdbqycuuoonewcowis.supabase.co/storage/v1/object/public/brief-media/example.jpg');
    assert.equal(calls.length,1);
  } finally {
    globalThis.fetch=originalFetch;
    if(previous===undefined)delete process.env.BRIEF_ENV;else process.env.BRIEF_ENV=previous;
  }
});

test('staging snapshots keep league identities separate and contain no credentials',async()=>{
  const raw=await readFile(new URL('../data/staging-snapshot.json',import.meta.url),'utf8');
  const snapshot=JSON.parse(raw);
  assert.notEqual(snapshot.editions.doge.league.id,snapshot.editions['sunday-crew'].league.id);
  for(const slug of ['doge','sunday-crew']){
    assert.equal(snapshot.editions[slug].tenant.slug,slug);
    assert.ok(snapshot.editions[slug].snapshots);
  }
  assert.doesNotMatch(raw,/"(?:access_token|refresh_token|service_role|password|email)"\s*:/i);
});
