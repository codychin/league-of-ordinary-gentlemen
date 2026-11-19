// Dry-run experiment only. Never grants production or media-test bypass authority.
const SHA=/^[a-f0-9]{40}$/;
const REPO='codychin/league-of-ordinary-gentlemen';
const PROJECT='prj_h89MCmxn3Mr3O0wRpnwstM917E0l';
const PATH='app/articles/newsroom-ai-apology.js';
export function evaluateCandidate({baseline,candidate,comparison,copySafe,now=Date.now()}={}) {
 const deny=reason=>({eligibleForCandidateValidation:false,promotable:false,reason});
 if(!baseline||!candidate||!comparison)return deny('missing-evidence');
 // These facts must come directly from authenticated provider/GitHub reads, NOT
 // a PR-supplied JSON file. This pure function alone cannot authenticate a caller.
 if(baseline.source!=='direct-provider-and-github')return deny('untrusted-baseline');
 if(!Number.isFinite(baseline.observedAt)||baseline.observedAt>now||now-baseline.observedAt>300_000)return deny('stale-baseline');
 const {deployment,promotion,integrity}=baseline;
 if(!deployment||deployment.alias!=='www.ordinarybrief.com'||deployment.projectId!==PROJECT||deployment.target!=='production'||deployment.state!=='READY'||!SHA.test(deployment.sha||'')||!deployment.id)return deny('wrong-live-deployment');
 for(const run of [promotion,integrity])if(!run||run.repository!==REPO||run.headBranch!=='main'||run.headSha!==deployment.sha||run.conclusion!=='success'||!Number.isSafeInteger(run.id)||run.id<=0||!Number.isSafeInteger(run.attempt)||run.attempt<=0)return deny('wrong-baseline-run');
 if(promotion.workflowPath!=='.github/workflows/promote-verified-production.yml'||promotion.receipt?.state!=='verified'||promotion.receipt?.sha!==deployment.sha||promotion.receipt?.candidateId!==deployment.id||promotion.receipt?.runId!==String(promotion.id)||promotion.receipt?.attempt!==String(promotion.attempt))return deny('unverified-live-receipt');
 if(integrity.workflowPath!=='.github/workflows/release-integrity.yml'||integrity.event!=='push'||!['integrity','article-image-qa','media-preparation'].every(n=>integrity.jobs?.[n]==='success'))return deny('incomplete-baseline-validation');
 if(!SHA.test(candidate.sha||'')||candidate.sha===deployment.sha||candidate.repository!==REPO)return deny('invalid-candidate');
 if(comparison.baseSha!==deployment.sha||comparison.headSha!==candidate.sha||comparison.complete!==true||comparison.ancestor!==true)return deny('wrong-comparison');
 // Compare the WHOLE candidate tree against LIVE, not parent commit. No harness
 // files or workflow files may be ignored to make a draft qualify.
 if(!Array.isArray(comparison.files)||comparison.files.length!==1||comparison.files[0].path!==PATH||comparison.files[0].status!=='M'||comparison.files[0].oldMode!=='100644'||comparison.files[0].newMode!=='100644')return deny('non-copy-tree-change');
 if(copySafe!==true)return deny('unsafe-copy');
 return {eligibleForCandidateValidation:true,promotable:false,reason:'dry-run-only',baselineSha:deployment.sha,candidateSha:candidate.sha,required:['exact-candidate-build','actual-copy-layout','representative-media-availability','same-sha-run-attempt-aggregate','fresh-live-baseline-recheck','exact-candidate-owner-ui-approval']};
}
