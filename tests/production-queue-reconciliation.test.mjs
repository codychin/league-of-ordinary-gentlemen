import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reconcile} from '../scripts/operations/reconcile-production-queue.mjs';
const sha='a'.repeat(40), old='b'.repeat(40);
function fixture({status='waiting',event='workflow_run',canReview=true,head=sha,rejectError=false,drift=false}={}) {
  const calls=[];
  let reads=0;
  const run={id:1,workflow_id:7,status,event,head_branch:'main',head_sha:old,html_url:'https://github.com/example/run/1'};
  const api=async(path,options={})=>{
    calls.push({path,...options});
    if(options.method==='POST') {
      if(rejectError) throw Error('Review no longer pending');
      return [];
    }
    if(path==='/branches/main') return {commit:{sha:drift&&++reads>1?old:head}};
    if(path==='/actions/runs/2') return {workflow_id:7};
    if(path.startsWith('/actions/workflows/7/runs?')) return {workflow_runs:[run]};
    if(path==='/actions/runs/1') return run;
    if(path.endsWith('/pending_deployments')) return [{environment:{name:'Production',id:3},current_user_can_approve:canReview}];
    throw Error('Unexpected API '+path);
  };
  return {api,calls};
}
test('new candidate sees obsolete waiting review without entering global lock',async()=>{
  const f=fixture(); const result=await reconcile({...f,sha,runId:2});
  assert.equal(result.reason,'review-required'); assert.equal(result.eligible,false);
  assert.equal(result.blockers[0].runId,1); assert.equal(f.calls.filter(c=>c.method).length,0);
});
test('authorized cleanup rejects only the obsolete pending environment',async()=>{
  const f=fixture(); const result=await reconcile({...f,sha,runId:2,apply:true});
  assert.equal(result.eligible,true);
  const writes=f.calls.filter(c=>c.method); assert.equal(writes.length,1);
  assert.equal(writes[0].path,'/actions/runs/1/pending_deployments');
  assert.deepEqual(JSON.parse(writes[0].body).environment_ids,[3]);
  assert.equal(JSON.parse(writes[0].body).state,'rejected');
});
for(const status of ['in_progress','queued','pending','unknown','completed']) {
  test(`never cancels or rejects ${status} promotion`,async()=>{
    const f=fixture({status}); await reconcile({...f,sha,runId:2,apply:true});
    assert.equal(f.calls.filter(c=>c.method).length,0);
  });
}
test('missing reviewer authority leaves explicit blocker',async()=>{
  const f=fixture({canReview:false});
  assert.equal((await reconcile({...f,sha,runId:2,apply:true})).reason,'review-required');
  assert.equal(f.calls.filter(c=>c.method).length,0);
});
test('approval wins race: rejection failure never falls back to cancellation',async()=>{
  const f=fixture({rejectError:true});
  await assert.rejects(reconcile({...f,sha,runId:2,apply:true}),/no longer pending/);
  assert.equal(f.calls.filter(c=>c.method).length,1);
  assert.ok(f.calls.every(c=>!c.path.includes('/cancel')));
});
for(const options of [{head:old},{drift:true}]) {
  test('exact SHA drift prevents cleanup and promotion eligibility '+JSON.stringify(options),async()=>{
    const f=fixture(options); const result=await reconcile({...f,sha,runId:2,apply:true});
    assert.equal(result.reason,'superseded'); assert.equal(result.eligible,false);
    assert.equal(f.calls.filter(c=>c.method).length,0);
  });
}
test('rollback dispatch is never classified as obsolete automatic promotion',async()=>{
  const f=fixture({event:'workflow_dispatch'}); await reconcile({...f,sha,runId:2,apply:true});
  assert.equal(f.calls.filter(c=>c.method).length,0);
});
test('workflow keeps protection and non-cancelling serialization after reconciliation',()=>{
  const workflow=readFileSync('.github/workflows/promote-verified-production.yml','utf8');
  assert.ok(!/^concurrency:/m.test(workflow));
  assert.match(workflow,/promote:\n    needs: reconcile/);
  assert.match(workflow,/concurrency:\n      group: ordinarybrief-production-promotion\n      cancel-in-progress: false/);
  assert.match(workflow,/environment: production/);
  assert.ok(!workflow.includes('--reject-obsolete-reviews'));
  assert.ok(!/actions: write|deployments: write/.test(workflow));
  const promotion=readFileSync('scripts/operations/promote-verified-release.mjs','utf8');
  assert.match(promotion,/finally\{/);
  assert.match(promotion,/autoAssignCustomDomains:false/);
});
