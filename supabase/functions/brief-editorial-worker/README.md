# Editorial contract and revision gate

This patch addresses retained editorial instructions and the missing review stage
in the automated Live Desk worker. It does not establish that generated prose
meets the editor's standard.

## What is enforced

- Each job pins a versioned contract in packet.editorial_contract before a model call.
- All six model stages receive that same snapshot as instructions.
- At most three pitches; no publication quota.
- The selected writer must survive drafting and revision.
- Written drafts require a separate editorial critique.
- Fixable drafts receive at most two revisions. Each revised draft requires fresh approval.
- Prior draft text and critiques remain in draft.editorial.history.
- Approval must match the contract version and revision being published.
- Invalid reviews and database errors stop processing.
- Existing written jobs receive review rather than bypassing the new gate.

The existing JSON columns hold contract snapshots and revision history; no schema
change is needed. Review and revision each consume their own worker invocation.
Review adds a model request; each revision adds up to two requests (rewrite and
review). Actual cost, latency and prose quality require a controlled live trial.

## Correction procedure

Update contract.ts when an editorial correction becomes a durable rule, preserving
its newsroom or desk scope, and increment CONTRACT_VERSION. Add a regression check
for a machine-checkable failure. Deploy only after tests pass. Jobs already in
progress retain their previous snapshot; explicitly restart a job if a new rule
must apply to it. This is deliberate pinning, not automatic ingestion of chat.

The initial contract records the editor's guidance about analytical depth,
distinct voices, evidence, local context, earned callbacks, revision and names.
It removes the mandatory Hollis story formula: structure must follow the material.
It does not claim to reconstruct the unseen Jameis revision history.

## Still required before expansion

1. League-specific queue, publication destination, identity and memory isolation.
   The current Sunday engine hard-codes ESPN league 310731; worker posts and premise
   memory use shared tables without league columns. A prose instruction is not
   database isolation.
2. Atomic job claims, publication idempotency and bounded retry recovery. The
   existing worker has no exclusive claim; overlapping invocations and a failure
   after insertion can cause duplicate work or publication.
3. Approved audio assets and pronunciation records linked to stable identities,
   speaker settings and approval status. This text-worker patch cannot validate
   synthesized audio or repair video backgrounds.
4. Verified league-local context and curated approved writing examples actually
   loaded into assignments, including lessons extracted from the real revisions.
5. A controlled non-publishing evaluation using real briefs from both leagues,
   comparing old and new outputs. Score factual errors, repeated corrections,
   voice, specificity, duplication, cost and latency.

## Validation

Run npm test. Tests exercise the worker state transitions with a fake database and
capture the actual six model request bodies without spending generation credits.
They prove gate behavior and instruction delivery, not subjective writing quality.

Keep this patch in review until queue concurrency and destination isolation are
resolved and a controlled live trial has assessed the additional model calls.


## Scoped feedback application (November 7, 2026)

Contract `2026-11-07.1` turns the newsroom-wide lessons from article revision into
instructions at discovery, pitching, selection, draft, revision and review. All six
desks retain their own lenses. Sports-centered selection, a controlling observation,
comic development, evidence that earns its space, legible imaginative satire and
preservation of approved strengths are common standards. Article-local corrections,
jokes and endings are not universal templates; latest feedback wins within its scope.

The draft/revision call applies these choices before writing; the existing review
JSON supplies the compact receipt under `checks["feedback-application"].evidence`.
It must cite actual passages, what changed, what was retained and unresolved issues.
When no prior feedback or approved strengths are supplied, review records that absence
and assesses the current craft rules instead of inventing approval. This is not a new
feedback ingestion service: assignment-specific corrections must actually be supplied
in the packet/review. Changing a document does not deliver an article's private edits.

Four added checks cover through-line/escalation, evidence earning space, coherent
satire and feedback application. The existing distinct-voice check asks which actual
choice would change under another byline. Missing or unresolved required checks block
machine approval. Only the new contract receives the expanded review guidance;
already-pinned older contracts retain their rules and schema. No database migration,
extra paid call, model change or revision allowance is introduced.

The reachable capped path still has no revision loop or per-post owner-approval
receipt. A missing per-post receipt is not itself a blocker for scheduled Sunday Live
Desk posts covered by Cody's explicit scoped standing authorization. Machine review
is a quality gate, not the source of publication permission. Other publication needs
approval of the exact version or its own explicit applicable standing authorization;
material revisions outside such authorization need fresh approval. Sunday Live Desk
authorization does not extend to full articles, matchup copy, media or additional
spending. This patch changes no publication gate, schedule, control, deployment or
authorization scope, and does not authorize activation of the proposed contract.
These tests use fake network/database responses and establish instruction delivery and
gates, not funniness, improved prose, internalized taste or production deployment:

`node --test tests/editorial-culture.test.mjs tests/newsroom-worker.test.mjs tests/capped-desk.test.mjs`

A separately authorized non-publishing editorial comparison remains necessary before
claiming better articles. Preserve the existing rollout prerequisites above.
