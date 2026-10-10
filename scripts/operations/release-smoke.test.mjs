import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const s=readFileSync('scripts/operations/release-smoke.mjs','utf8');
const health=readFileSync('app/api/release-health/route.js','utf8');
test('release sentinel refuses missing commit or base URL',()=>{
 assert.match(s,/BASE_URL and a valid EXPECTED_SHA are required/);
 assert.match(s,/Wrong release:/);
});
test('release sentinel checks exact public domain and every edition',()=>{
 assert.match(s,/www\.ordinarybrief\.com/);
 assert.match(s,/sunday-crew/);
 assert.match(s,/doge/);
 assert.match(s,/ARTICLE_SLUG/);
});
test('release identity endpoint is uncacheable and commit aware',()=>{
 assert.match(health,/VERCEL_GIT_COMMIT_SHA/);
 assert.match(health,/no-store/);
});
