import test from 'node:test';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {readFileSync} from 'node:fs';import {validateLiveSnapshot} from '../native/brief/src/live-snapshot.mjs';
test('website build emits a complete public reader feed with current lead and versioned local media',()=>{
 execFileSync(process.execPath,['scripts/generate-native-feed.mjs']);
 const feed=JSON.parse(readFileSync('lib/generated/native-feed.json','utf8'));validateLiveSnapshot(feed);
 const chargers=feed.readers.find(r=>r.slug==='hollis-chargers-thought-of-everything');assert.ok(chargers);assert.equal(chargers.blocks.filter(b=>b.type==='xclip').length,11);assert.equal(chargers.blocks.at(-1).text,'McDaniel has some nerve telling us life is short.');assert.ok(chargers.blocks.some(b=>b.type==='rich'&&b.nodes?.[0]?.kind==='em'&&b.nodes[0].children[0].text==='Which brings us back to The Love Boat in 1978.'));
 const authoredLead=readFileSync('app/components/SharedEditorialFront.js','utf8').match(/href=\{root\+"\/articles\/([a-z0-9-]+)/)?.[1];
 assert.ok(authoredLead);assert.equal(feed.home[0].cards[0].slug,authoredLead);
 assert.equal(feed.readers.length,feed.cards.length);const localCards=feed.cards.filter(c=>c.image?.startsWith('/'));assert.ok(localCards.length>0);assert.ok(localCards.every(c=>c.image.includes('brief_rev=')));
 assert.ok(!feed.cards.some(c=>c.slug==='conrad-white-coaches-lose-individually'));
 for(const mutate of [f=>f.complete=false,f=>f.cards.pop(),f=>f.readers[0].league_id='secret',f=>f.readers[0].blocks.push({id:'invalid',type:'script'})]){const bad=structuredClone(feed);mutate(bad);assert.throws(()=>validateLiveSnapshot(bad));}
});
