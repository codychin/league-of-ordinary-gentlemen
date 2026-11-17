import test from 'node:test';
import assert from 'node:assert/strict';
import {blocks} from '../native/brief/src/article-blocks.mjs';
import {newsroomApologyArticle} from '../app/articles/newsroom-ai-apology.js';
import {existsSync} from 'node:fs';
test('newsroom signatures remain readable in native feed with canonical assets',()=>{
 const result=blocks(newsroomApologyArticle.body);
 const signatures=result.filter(b=>b.id.includes('-signature-'));
 assert.equal(signatures.length,6);
 assert.deepEqual(signatures.map(s=>s.alt),['Hollis Crane','Conrad Sorrell','Marnie Kells','Maude Gannon','Dashiell Pike','Sabine March']);
 for(const signature of signatures){assert.equal(signature.type,'image');assert.ok(existsSync(new URL('../public'+signature.src,import.meta.url)));}
 assert.equal(new Set(result.map(b=>b.id)).size,result.length);
});
