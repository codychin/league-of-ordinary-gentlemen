import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const workflow=readFileSync('.github/workflows/release-integrity.yml','utf8');
const lane=workflow.split('        id: discovery-source\n')[1].split('      - uses: actions/checkout')[0];
test('discovery checkout never downloads media or manufactures substitute assets',()=>{
 assert.ok(lane.includes("needs.select-checks.outputs.scope == 'discovery'"));
 const patterns=lane.split('          sparse-checkout: |\n')[1].trim().split('\n').map(x=>x.trim());
 assert.deepEqual(patterns,['/app/','/lib/','/package.json','/package-lock.json','/.github/workflows/release-integrity.yml','/scripts/operations/select-staging-checks.mjs','/scripts/operations/classify-newsroom-copy.mjs','/tests/public-sitemap.test.mjs','/tests/staging-check-selection.test.mjs','/tests/release-validation-reuse.test.mjs','/tests/staging-discovery-lane.test.mjs']);
 assert.ok(lane.includes('persist-credentials: false'));
 assert.doesNotMatch(lane,/fetch-depth: 0|filter:/);
});
test('discovery runs actual route contracts directly, never media-restoring pretest',()=>{
 const block=workflow.split('      - name: Verify discovery routes against the actual canonical inventory\n')[1].split('      - if:')[0];
 assert.ok(block.includes("scope == 'discovery'"));
 assert.ok(block.includes('node --test tests/public-sitemap.test.mjs'));
 assert.doesNotMatch(block,/npm test|npm run build|next build|mock|fixture/);
});
test('full app build and both browser environments are retained outside discovery',()=>{
 for(const name of ['Verify article images without score fixture','Verify article image geometry before release']){
  const block=workflow.split('      - name: '+name+'\n')[1].split('      - uses:')[0];
  assert.ok(block.includes("needs.select-checks.outputs.scope == 'full'"));
  assert.ok(block.includes('npx playwright test'));
 }
 assert.match(workflow,/if: [^\n]*scope != 'discovery'[^\n]*\n        run: npm run build/);
 assert.ok(workflow.includes('needs: [integrity, media-preparation, select-checks]'));
});
