import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {HEADER_FILES,HEADER_SOURCE_SHA,APPROVED_ASSET_BINDING_SHA256,week9BindingHash} from './focused-week9-authority.mjs';
import {selectWeek9PreviewCohort} from '../../lib/week9-preview-cohort.mjs';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const config=read('qa/focused-week9-release.json'),rows=read('data/week9-approved-homepage-media.json'),authority=read('qa/week9-owner-playback-waiver.json');
assert.equal(config.authorized,true);assert.equal(config.releaseId,'week9-preview-20261108');
assert.equal(config.headerSourceSha,HEADER_SOURCE_SHA);assert.equal(config.freshHostedPlaybackRequired,true);assert.equal(config.hostedPlaybackWaived,false);
for(const [p,sha] of Object.entries(HEADER_FILES)){const b=readFileSync(p);assert.equal(createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex'),sha,'Approved header changed');}
for(const edition of ['loog','doge','sunday-crew'])assert.equal(selectWeek9PreviewCohort(rows,edition,authority).length,6);
assert.equal(week9BindingHash(rows),APPROVED_ASSET_BINDING_SHA256);
console.log('Focused owner-authorized Week9 candidate: exact approved header and18 media bindings. This is not full-suite evidence; fresh hosted playback remains mandatory.');

if(process.env.GITHUB_HEAD_REF==='release/week9-rollback-shell'){
 const allowed=new Set([...Object.keys(HEADER_FILES),'.github/workflows/release-integrity.yml','scripts/operations/focused-week9-authority.mjs','scripts/operations/verify-focused-week9-candidate.mjs','qa/focused-week9-release.json','qa/tests/pwa-reading-navigation.spec.mjs','scripts/operations/verify-hosted-week9-media.mjs']);
 const files=execFileSync('git',['-c','safe.directory='+process.cwd(),'diff','--name-only','23d549ada48dd20ebd791b26f21ee471e356e066','HEAD'],{encoding:'utf8'}).trim().split('\n');
 assert.ok(files.every(p=>allowed.has(p)),'Unrelated changes cannot use rollback-focused validation');
}
