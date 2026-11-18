import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const y=readFileSync('.github/workflows/release-integrity.yml','utf8');
test('navigation cache keys exact inputs without partial restore or broad caching',()=>{
 const block=y.split('        id: media-source\n')[1].split('      - uses: actions/setup-node@v4')[0];
 for(const p of ['!/media-sources/','!/public/reels/','!/public/reels-hls/'])assert.ok(block.includes(p));
 assert.ok(block.includes('actions/cache/restore@v4'));assert.ok(block.includes('actions/cache/save@v4'));
 assert.doesNotMatch(block,/restore-keys:|\.git\/|node_modules/);
 assert.ok(block.indexOf('hydrate-media-inputs.mjs')<block.indexOf('actions/cache/save'));
 assert.ok(y.indexOf('actions/cache/save')<y.indexOf('run: npm ci'));
});
test('navigation runs actual build and relevant browsers with full hydrated media',()=>{
 const block=y.split('      - name: Verify actual navigation in the complete media-backed app\n')[1].split('      - name: Verify article image geometry')[0];
 assert.ok(block.includes("scope == 'navigation'"));
 for(const spec of ['crates-primary-navigation','nav-circle-alignment','section-anchor-alignment','pwa-reading-navigation'])assert.ok(block.includes(spec+'.spec.mjs'));
 assert.ok(block.includes('test "$ready" = true'));assert.ok(block.includes('npm run start'));
 assert.match(y,/scope != 'discovery'[^\n]*\n        run: npm run build/);
 assert.ok(y.includes('steps.media-source.outputs.commit'));
 assert.doesNotMatch(y,/continue-on-error|restore-keys:/);
});

test('default-branch cache is seeded from verified full-checkout inputs before build',()=>{
 const block=y.split('      - name: Verify main inputs before seeding future PR caches\n')[1].split('      - uses: actions/setup-node')[0];
 assert.ok(block.includes("github.event_name == 'push'"));
 assert.ok(block.includes('media-input-cache.mjs verify'));
 assert.ok(block.indexOf('media-input-cache.mjs verify')<block.indexOf('actions/cache/save'));
 assert.ok(y.includes("lookup-only: ${{ github.event_name == 'push' }}"));
});
