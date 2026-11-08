import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {selectChecks, focusedPaths} from '../scripts/operations/select-release-checks.mjs';
test('release tooling changes use focused contracts without branch-specific authority', () => {
  assert.equal(selectChecks([...focusedPaths].map(path=>({status:'M',path}))), 'release-tooling');
});
for(const path of ['app/globals.css','app/components/MobileNav.jsx','public/sw.js','public/reels/movie.mp4','scripts/restore-week9-previews.mjs','package-lock.json','next.config.mjs','.github/workflows/unrecognized.yml']) {
 test(`${path} retains broad protection even in a mixed change`,()=>assert.equal(selectChecks([{status:'M',path:'scripts/operations/monitor-release-state.mjs'},{status:'M',path}]),'full'));
}
test('missing, deleted, renamed and unknown changes fail closed',()=>{
 assert.equal(selectChecks([]),'full');
 for(const status of ['D','R100','unknown'])assert.equal(selectChecks([{status,path:'scripts/operations/monitor-release-state.mjs'}]),'full');
});
test('workflow preserves exact-run authority and focused selection is not branch-named',()=>{
 const yml=fs.readFileSync('.github/workflows/release-integrity.yml','utf8');
 assert.match(yml,/needs: \[select-checks, media-preparation\]/);
 assert.match(yml,/needs\.select-checks\.result == 'success'/);
 assert.match(yml,/needs\.media-preparation\.result == 'skipped'/);
 assert.match(yml,/node --test tests\/release-check-selection.test.mjs/);
 assert.match(yml,/VALIDATION_IDENTITY.*GITHUB_SHA:\$GITHUB_RUN_ID:\$GITHUB_RUN_ATTEMPT:\$GITHUB_WORKFLOW_REF/);
 assert.match(yml,/git diff --name-status --no-renames/);
});
