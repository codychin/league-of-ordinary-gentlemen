#!/usr/bin/env node
// No cancellation endpoint: a workflow may start promotion between two reads.
import assert from 'node:assert/strict';
import {appendFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

export async function reconcile({api, sha, runId, apply=false}) {
  assert.match(sha || '', /^[0-9a-f]{40}$/);
  const current = await api('/actions/runs/' + runId);
  const main = async () => (await api('/branches/main')).commit.sha;
  if (await main() !== sha) return {eligible:false, reason:'superseded', blockers:[]};
  const blockers=[];
  // Pagination prevents silently missing a long-lived waiting run.
  for(let page=1;;page++) {
    const {workflow_runs:runs} = await api(`/actions/workflows/${current.workflow_id}/runs?per_page=100&page=${page}`);
    assert.ok(Array.isArray(runs), 'Missing workflow runs');
    for(const summary of runs) {
      if(summary.id===Number(runId) || summary.status==='completed') continue;
      const run=await api('/actions/runs/'+summary.id);
      // Unknown/executing states and other event types are never mutated.
      // In particular, a rollback or a promotion restoring policy must finish.
      if(run.status!=='waiting' || run.event!=='workflow_run' || run.head_branch!=='main' ||
         run.workflow_id!==current.workflow_id || run.head_sha===sha) continue;
      const pending=await api(`/actions/runs/${run.id}/pending_deployments`);
      assert.ok(Array.isArray(pending), 'Missing pending deployment state');
      const production=pending.find(p=>p.environment?.name?.toLowerCase()==='production');
      if(!production) continue;
      if(await main()!==sha) return {eligible:false, reason:'superseded', blockers};
      const blocker={runId:run.id, url:run.html_url, canReview:production.current_user_can_approve===true};
      if(!apply || !blocker.canReview) { blockers.push(blocker); continue; }
      // GitHub's pending-review endpoint is the state boundary. If approval won
      // the race, reject must fail; never fall back to cancelling the run.
      await api(`/actions/runs/${run.id}/pending_deployments`, {
        method:'POST', body:JSON.stringify({environment_ids:[production.environment.id],
          state:'rejected', comment:`Superseded by verified main candidate ${sha}.`})
      });
    }
    if(runs.length<100) break;
  }
  if(await main()!==sha) return {eligible:false, reason:'superseded', blockers};
  return {eligible:blockers.length===0, reason:blockers.length?'review-required':'current', blockers};
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  const repo=process.env.GITHUB_REPOSITORY;
  assert.equal(repo,'codychin/league-of-ordinary-gentlemen');
  // Inspection is the default. Enabling rejection also requires a separately
  // authorized reviewer identity and deployment-review API write capability.
  const apply=process.argv.includes('--reject-obsolete-reviews');
  const api=async(path, options={})=>{
    const response=await fetch(`https://api.github.com/repos/${repo}${path}`, {
      ...options,redirect:'error',signal:AbortSignal.timeout(20000),
      headers:{Authorization:`Bearer ${process.env.GH_TOKEN}`,Accept:'application/vnd.github+json','Content-Type':'application/json'}
    });
    assert.ok(response.ok, `Queue inspection/review HTTP ${response.status}; no cancellation attempted`);
    return response.json();
  };
  const result=await reconcile({api,sha:process.env.RELEASE_SHA,runId:process.env.GITHUB_RUN_ID,apply});
  console.log(JSON.stringify(result));
  if(process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT,`eligible=${result.eligible}\n`);
  if(result.reason==='review-required') throw Error('Obsolete Production review must be rejected by an authorized reviewer; see blocker URLs above');
}
