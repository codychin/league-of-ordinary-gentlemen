import test from 'node:test';
import assert from 'node:assert/strict';
import {independentPaths,selectStagingChecks,parseNameStatus} from '../scripts/operations/select-staging-checks.mjs';
const pick = (paths, event='pull_request') => selectStagingChecks({event,changes:paths.map(path=>({status:'M',path}))}).media;
for(const path of independentPaths) test('independent staging input: '+path,()=>assert.equal(pick([path]),'not-required'));
for(const path of [
  'package.json','package-lock.json','next.config.mjs',
  'scripts/restore-week10-recaps.mjs','scripts/operations/prepare-media.mjs',
  'scripts/operations/select-staging-checks.mjs',
  '.github/workflows/release-integrity.yml','data/week7-approved-homepage-media.json',
  'lib/week7-reels.js','lib/new-shared-helper.js',
  'app/components/ReelsShelf.jsx','app/components/EditorialVideo.jsx',
  'app/globals.css','app/articles/data.js','app/articles/writers.js',
  'public/reels/example.mp4','public/reels-hls/example/index.m3u8',
  'media-sources/new.chunk','qa/fixtures/media-preparation.mjs',
  'qa/operations/media-preparation.test.mjs','tests/media-preparation.test.mjs',
  'app/components/Unknown.jsx','unknown.txt','app/../app/sitemap.js',
]) test('potential media, transitive or unknown input forces full: '+path,()=>{
  assert.equal(pick([path]),'required');
  assert.equal(pick(['app/sitemap.js',path]),'required');
});
for(const event of ['push','workflow_dispatch','pull_request_target','',undefined]) test('never relax '+event,()=>assert.equal(selectStagingChecks({event,changes:[{status:'M',path:'app/sitemap.js'}]}).media,'required'));
for(const status of ['D','R100','T','C100','U','',undefined]) test('unsupported/deleted status '+status,()=>assert.equal(selectStagingChecks({event:'pull_request',changes:[{status,path:'app/sitemap.js'}]}).media,'required'));
test('empty/incomplete changes fail closed',()=>{
  for(const changes of [[],null,undefined]) assert.equal(selectStagingChecks({event:'pull_request',changes}).media,'required');
  assert.equal(selectStagingChecks({event:'pull_request',changes:[{status:'M',path:'app/sitemap.js'}],complete:false}).media,'required');
});
test('NUL parser is lossless and cannot smuggle paths',()=>{
  assert.deepEqual(parseNameStatus('M\0app/sitemap.js\0A\0file with\na tab\t.js\0'),[{status:'M',path:'app/sitemap.js'},{status:'A',path:'file with\na tab\t.js'}]);
  for(const input of ['', 'M\0app/sitemap.js','M\0','M\0app/sitemap.js\0trailing\0']) assert.throws(()=>parseNameStatus(input));
  assert.equal(selectStagingChecks({event:'pull_request',changes:parseNameStatus('M\0app/sitemap.js\nM\tapp/robots.js\0')}).media,'required');
});
