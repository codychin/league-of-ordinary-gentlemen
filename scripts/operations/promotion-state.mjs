import assert from 'node:assert/strict';
// Remote state is authoritative after a lost HTTP response or interrupted job.
export function promotionDecision({request,live,candidateId,sha}) {
  if(request) {
    assert.ok(['pending','in-progress','succeeded','failed','skipped'].includes(request.jobStatus),'Unknown provider promotion state; reconcile before another request');
    if(['pending','in-progress'].includes(request.jobStatus)) return {action:'wait',reason:'provider-operation-active'};
    if(request.jobStatus==='failed') return {action:'stop',reason:'provider-operation-failed'};
  }
  if(live.id===candidateId) {
    assert.equal(live.meta?.githubCommitSha,sha,'Live candidate SHA mismatch');
    assert.equal(live.readyState,'READY','Live candidate is not READY');
    return {action:'verify',reason:'already-live'};
  }
  if(request?.toDeploymentId===candidateId) return {action:'stop',reason:'candidate-request-exists-but-alias-mismatches'};
  return {action:'promote',reason:'new-verified-candidate'};
}

// Deliberately not wired to production mutations. A rollback is bounded to the
// recorded predecessor and requires explicit incident authority, not an arbitrary SHA.
export function rollbackDecision({authorized,receipt,live,target,providerRequest}) {
  assert.equal(authorized,true,'Rollback authority required');
  assert.equal(receipt.state,'verified','A verified release receipt is required');
  assert.equal(live.id,receipt.candidateId,'Production changed since this release');
  assert.ok(receipt.previousId&&receipt.previousId!==receipt.candidateId,'Distinct recorded predecessor required');
  assert.equal(target.id,receipt.previousId,'Rollback target must be recorded predecessor');
  assert.equal(target.projectId,receipt.projectId,'Rollback target project mismatch');
  assert.equal(target.target,'production'); assert.equal(target.readyState,'READY');
  assert.ok(!providerRequest||['succeeded','skipped'].includes(providerRequest.jobStatus),'Provider operation requires reconciliation');
  return {action:'rollback',from:live.id,to:target.id};
}
