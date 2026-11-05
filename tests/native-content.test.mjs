import test from 'node:test';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {readFileSync} from 'node:fs';import {validateLiveSnapshot} from '../native/brief/src/live-snapshot.mjs';
test('website build emits a complete public reader feed with current lead and versioned local media',()=>{
 execFileSync(process.execPath,['scripts/generate-native-feed.mjs']);
 const feed=JSON.parse(readFileSync('lib/generated/native-feed.json','utf8'));validateLiveSnapshot(feed);
 const authoredLead=readFileSync('app/components/SharedEditorialFront.js','utf8').match(/href=\{root\+"\/articles\/([a-z0-9-]+)/)?.[1];
 assert.ok(authoredLead);assert.equal(feed.home[0].cards[0].slug,authoredLead);
 assert.equal(feed.readers.length,feed.cards.length);assert.ok(feed.cards[0].image.includes('brief_rev='));
 assert.ok(!feed.cards.some(c=>c.slug==='conrad-white-coaches-lose-individually'));
 for(const mutate of [f=>f.complete=false,f=>f.cards.pop(),f=>f.readers[0].league_id='secret',f=>f.readers[0].blocks.push({id:'invalid',type:'script'})]){const bad=structuredClone(feed);mutate(bad);assert.throws(()=>validateLiveSnapshot(bad));}
});
