#!/usr/bin/env node
import assert from 'node:assert/strict';
import {appendFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
export function candidateDecision({sha,main,checks}) {
  if(sha!==main) return {eligible:false,reason:'superseded'};
  for(const name of ['integrity','article-image-qa']) {
    const check=checks.filter(c=>c.name===name&&c.app?.slug==='github-actions'&&c.head_sha===sha).sort((a,b)=>b.id-a.id)[0];
    if(!check||check.status!=='completed') return {eligible:false,reason:'checks-pending',check:name};
    if(check.conclusion!=='success') return {eligible:false,reason:'checks-failed',check:name};
  }
  return {eligible:true,reason:'verified-main'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  const repo=process.env.GITHUB_REPOSITORY,sha=process.env.RELEASE_SHA;
  assert.equal(repo,'codychin/league-of-ordinary-gentlemen');
  assert.match(sha||'',/^[0-9a-f]{40}$/);
  const get=async path=>{
    const r=await fetch(`https://api.github.com/repos/${repo}${path}`,{redirect:'error',signal:AbortSignal.timeout(20000),headers:{Authorization:`Bearer ${process.env.GH_TOKEN}`,Accept:'application/vnd.github+json'}});
    assert.ok(r.ok,`Candidate inspection HTTP ${r.status}`); return r.json();
  };
  const main=(await get('/branches/main')).commit.sha;
  const checks=sha===main?(await Promise.all(['integrity','article-image-qa'].map(async name=>(await get(`/commits/${sha}/check-runs?check_name=${name}&per_page=100`)).check_runs))).flat():[];
  const result=candidateDecision({sha,main,checks});
  console.log(JSON.stringify({sha,...result}));
  appendFileSync(process.env.GITHUB_OUTPUT,`eligible=${result.eligible}\n`);
  appendFileSync(process.env.GITHUB_STEP_SUMMARY,`Candidate ${sha}: **${result.reason}**${result.check?' ('+result.check+')':''}.\n`);
  // Both required workflows trigger this gate. The last successful completion
  // retries eligibility naturally, without polling, write permission or dispatch.
  if(result.reason==='checks-failed') process.exitCode=1;
}
