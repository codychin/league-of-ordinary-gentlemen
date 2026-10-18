import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('stale score reads never tick the unauthenticated engine',async()=>{
 let source=fs.readFileSync(new URL('../app/api/live-scores/route.js',import.meta.url),'utf8');
 assert.doesNotMatch(source,/action=tick|isSundayLiveWindow/);
 source=source.replace(/import latestScores[^;]+;/,"const latestScores={week:6,updatedAt:'2026-10-15T00:00:00Z'};").replace(/import completedScores[^;]+;/,"const completedScores={week:5};");
 const {GET}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const previous=globalThis.fetch,calls=[];
 globalThis.fetch=async url=>{calls.push(url);return Response.json({ok:true,week:6,updatedAt:'2026-10-16T00:00:00Z',status:'LIVE',matchups:[{winner:'UNDECIDED'}]});};
 try{const result=await GET();const data=await result.json();assert.equal(data.stale,true);assert.equal(calls.length,1);assert.match(calls[0],/action=scores$/);}finally{globalThis.fetch=previous;}
});
