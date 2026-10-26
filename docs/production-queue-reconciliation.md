# Draft: production queue reconciliation

This draft is based on verified release `2b2795d`. It must not replace the
already READY release while its protected promotion is being completed.

The defect: workflow-level concurrency is acquired before Production review.
An obsolete waiting review holds the lock, so the latest candidate cannot run
the stale-SHA check that was inside the protected job.

The draft moves candidate reconciliation into an unprotected, read-only job,
before the same non-cancelling promotion lock. Production review, exact-SHA
checks, staged checks, manual-assignment restoration and live verification stay
in the protected promotion job. It reports actionable obsolete review URLs
instead of silently sitting behind them. It does not by itself automatically
clear obsolete reviews. A candidate that becomes stale after reconciliation is
still rejected by the existing exact-main check before promotion.

## Separate capability decision before automatic cleanup

Automatic cleanup is implemented but NOT enabled in the workflow. It rejects
only an obsolete pending Production review through the review endpoint, never
through workflow cancellation. A failed or uncertain rejection stops processing;
there is no cancellation fallback. Executing/unknown runs and rollback dispatches
are untouched, allowing an executing promotion's policy-restoration `finally`
to complete under the retained lock.

Activation needs a verified authorized review identity plus API capability:
Actions read for run/pending-review inspection and deployment-review write for
rejection. The current workflow declares contents read, checks read and OIDC
write only. No permission expansion, reviewer addition, credential creation or
review bypass is included here. `current_user_can_approve:true` observed for the
interactive codychin connector does not establish authority for GITHUB_TOKEN.
Adding a permission alone must not be assumed to grant required-reviewer status.

Until that capability is resolved, this is a draft diagnostic/safe reconciliation
foundation, NOT a complete unattended queue repair and NOT ready to merge.
Inspection API permission failures fail closed with their HTTP status.

Once legitimately available, the same script's `--reject-obsolete-reviews` mode
can be wired in after review of that explicit capability change. Verify on
controlled waiting reviews that approval/rejection races fail atomically; tests
mock this API boundary and do not prove GitHub's production behavior.

## Validation and rollback

Run `node --test tests/production-queue-reconciliation.test.mjs`.
Fixtures cover waiting obsolete/current pending candidates, executing and
uncertain states, review races, absent reviewer authority, main SHA drift and
rollback dispatch exclusion. No remote writes or production generations occur.

Rollback is a code revert for future runs after active promotions finish.
Never blanket-cancel a running promotion to install or revert this change.
Do not restore workflow-global locking while an old review remains waiting.
The promotion script and its manual-assignment restoration remain unchanged.
