#!/usr/bin/env node
import {writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {candidateDecision} from './release-candidate.mjs';
export function assessRelease({sha,checks,now=Date.now(),commitTime}) {
  const selected=checks.filter(c=>c.head_sha===sha&&c.app?.slug==='github-actions');
  const decision=candidateDecision({sha,main:sha,checks:selected});
  const age=t=>(now-Date.parse(t||commitTime))/60000;
  if(decision.reason==='checks-failed') return {ok:false,reason:'required-check-failed',owner:'code release maintainer'};
  if(!decision.eligible) return {ok:age(commitTime)<45,reason:'waiting-for-required-checks',owner:'CI service / code release maintainer',deadlineMinutes:45};
  const promote=selected.filter(c=>c.name==='promote'&&c.conclusion!=='skipped').sort((a,b)=>b.id-a.id)[0];
  if(promote?.status==='completed') return {ok:promote.conclusion==='success',reason:promote.conclusion==='success'?'release-verified':'promotion-needs-reconciliation',owner:'release operator',url:promote.details_url};
  const checksComplete=selected.filter(c=>['integrity','article-image-qa'].includes(c.name)&&c.conclusion==='success').map(c=>c.completed_at).filter(Boolean).sort().at(-1)||commitTime;
  const deadlineMinutes=promote?35:15;
  return {ok:age(promote?.started_at||checksComplete)<deadlineMinutes,reason:promote?'promotion-running-or-queued':'eligible-release-not-started',owner:'release operator / GitHub Actions service',deadlineMinutes,url:promote?.details_url};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  let result,sha;
  try{
    // Public metadata only. No Actions permission expansion or new token.
    const get=async path=>{
      const r=await fetch('https://api.github.com/repos/codychin/league-of-ordinary-gentlemen'+path,{redirect:'error',signal:AbortSignal.timeout(20000),headers:{Accept:'application/vnd.github+json'}});
      if(!r.ok)throw Error('Release inspection HTTP '+r.status);return r.json();
    };
    const branch=await get('/branches/main');sha=branch.commit.sha;
    const checks=(await Promise.all(['integrity','article-image-qa','promote'].map(async name=>(await get(`/commits/${sha}/check-runs?check_name=${name}&per_page=100`)).check_runs))).flat();
    result=assessRelease({sha,checks,commitTime:branch.commit.commit.committer.date});
  }catch(e){result={ok:false,reason:e.message,owner:'release monitor maintainer'};}
  const report={scope:'production release contract',checkedAt:new Date().toISOString(),sha,count:1,passed:result.ok?1:0,failures:result.ok?[]:[{path:result.url||'https://github.com/codychin/league-of-ordinary-gentlemen/actions',error:`${result.reason}; owner: ${result.owner}; inspect remote state before retrying. Never cancel an executing promotion.`}],state:result};
  writeFileSync(process.env.REPORT_PATH||'/tmp/brief-release-report.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));if(!result.ok)process.exitCode=1;
}
