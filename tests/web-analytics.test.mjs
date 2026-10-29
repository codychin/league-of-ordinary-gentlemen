import test from 'node:test';
import assert from 'node:assert/strict';
import {analyticsEnabled, beforeSendPageview, OPT_OUT_KEY} from '../lib/web-analytics.mjs';

const production = {NODE_ENV:'production', VERCEL_ENV:'production', VERCEL_PROJECT_ID:'prj_h89MCmxn3Mr3O0wRpnwstM917E0l'};
test('collection requires the live production deployment, never preview, staging or tests', () => {
  assert.equal(analyticsEnabled(production), true);
  for (const override of [{NODE_ENV:'test'},{NODE_ENV:'development'},{VERCEL_ENV:'preview'},{VERCEL_ENV:'development'},{VERCEL_PROJECT_ID:'staging-project'},{BRIEF_ENV:'staging'},{NEXT_PUBLIC_BRIEF_ENV:'staging'}]) {
    assert.equal(analyticsEnabled({...production,...override}), false);
  }
  assert.equal(analyticsEnabled({NODE_ENV:'production'}), false);
});
test('SSR is safe and does not collect', () => {
  assert.equal(beforeSendPageview({type:'pageview',url:'https://ordinarybrief.com/'}), null);
});
test('only public home/article URLs survive; all query strings and fragments are removed', () => {
  global.window = {location:{origin:'https://ordinarybrief.com'},localStorage:{getItem:()=>null}};
  try {
    for (const path of ['/', '/sunday-crew', '/doge', '/articles/one', '/sunday-crew/articles/two', '/doge/articles/three']) {
      assert.equal(beforeSendPageview({type:'pageview',url:`https://ordinarybrief.com${path}?secret=hidden#token`}).url, `https://ordinarybrief.com${path}`);
    }
    for (const path of ['/manage', '/manage/confirm', '/editor/live', '/analytics-preferences', '/teams', '/api/private']) {
      assert.equal(beforeSendPageview({type:'pageview',url:`https://ordinarybrief.com${path}`}), null);
    }
    assert.equal(beforeSendPageview({type:'event',url:'https://ordinarybrief.com/'}), null);
    assert.equal(beforeSendPageview({type:'pageview',url:'https://other.example/'}), null);
    assert.equal(beforeSendPageview({type:'pageview',url:'invalid'}), null);
  } finally {delete global.window;}
});
test('opt-out is read on every event and storage failures fail closed', () => {
  let excluded = null;
  global.window = {location:{origin:'https://ordinarybrief.com'},localStorage:{getItem:key=>{assert.equal(key,OPT_OUT_KEY);return excluded;}}};
  try {
    const event={type:'pageview',url:'https://ordinarybrief.com/articles/one'};
    assert.ok(beforeSendPageview(event));
    excluded='1'; assert.equal(beforeSendPageview(event),null);
    excluded=null; assert.ok(beforeSendPageview(event));
    window.localStorage.getItem=()=>{throw Error('storage blocked');};
    assert.equal(beforeSendPageview(event),null);
  } finally {delete global.window;}
});
