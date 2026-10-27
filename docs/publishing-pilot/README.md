# Immutable editorial publishing: isolated pilot

Status: implemented for local review; hosted staging verification is blocked by the absence of a verified isolated Supabase target. Do not merge or promote. Rika owns engineering coordination; Cody retains owner decisions on spending and access. Production cutover is separate.

## October 27 preparation update

Reconciled with main `1055efb` (PR87/88/92). Kept current journalism, assets, production workflows and Detroit article rendering changes; the frozen Jay-Z pilot baseline intentionally remains a historical fixture, not a copy of today's homepage. No production publication occurred.

The pilot now supports a narrow technical session bootstrap: POST `/api/publishing-pilot/session` with the exact preview Origin and `{op:"bootstrap",access_token,refresh_token}` from an **already authenticated isolated-branch user**. It validates the confirmed identity, persists SSR cookies, returns no tokens, and does not provision users or use admin credentials. `{op:"refresh"}` refreshes an existing session. Pilot-only proxy handling persists rotated cookies on page/API requests; `/manage` remains separate. Disabled/production-target configuration rejects bootstrap before network access. Do not send tokens in URLs, logs or committed fixtures. The operator still needs an authorized real branch sign-in path; no hosted session has been obtained.

`test-session-browser.mjs` exercises actual local Next/SSR cookie transport: wrong origin, revoked refresh without persisted cookies, expired-session bootstrap, authenticated page read, automatic proxy rotation, and explicit refresh. The SDK unit tests also reject unconfirmed identities and disabled/production targets. Synthetic transport is not hosted Supabase Auth proof. No real credentials or test identities were created.

The bounded verifier now uses `verify-routes.mjs`, with independent expected copy, six route checks, exact digest/renderer, no-store and redirect/offline/unavailable rejection before any attestation. Negative tests fail the final route and assert zero attestation writes. `verify-local.mjs` remains LOCAL ONLY: a hosted operator adapter must supply real user-authenticated transport and verifier RPC, without service-role credentials or a protection bypass.

Fresh read-only account inspection still finds zero branches for The Brief and only the unrelated fantasy-draft-room project. No existing no-new-cost hosted isolation target is available; disposable local Postgres is available. Hosted proof still needs a consolidated decision covering isolated environment lifecycle/spend, branch-only test users and sessions, preview-only publishable configuration, protected browser/verifier access, and cleanup. The earlier proposed $1 limit is withdrawn: it cannot be enforced. A 24-hour cleanup deadline is an operator obligation, not a configured automatic TTL; billing visibility is via the existing organization dashboard, not a usage-meter connector. Do not provision until the execution/access and monitoring paths are resolved.

Run the existing local suites, then `node scripts/publishing-pilot/test-session-browser.mjs`; Node tests include the new session/verifier negatives. The previous dated JSON receipts below describe their original build; see `oct27-local-results.json` for this reconciliation. Normal build/hosted checks must not be inferred from local compile-only success.

## What is implemented

The pilot lives under `/publishing-pilot/{loog|sunday-crew|doge}`. It is disabled unless explicitly configured, rejects Vercel production, rejects both known production/unrelated Supabase project refs, and never falls back to the production database. Original publication routes, content, eighteen videos, provider state and release workflows remain in place.

The frozen baseline contains all fifteen current shared-homepage entries plus the explicit West Virginia archive exception. The narrow candidate contract accepts only baseline, staging-only Jay-Z dek correction, staging-only lead insertion with complete overflow, and a DOGE-only isolation fixture. Corrections cannot reorder; no implicit archive cutoff exists. Arbitrary content/media/schema changes fail the independent preflight validator and preview reader. Runtime renderer identity is the actual Next build ID (local) or Vercel deployment ID, checked against the pinned database/attestation identity.

`schema.sql` is deliberately outside production migrations. It defines a separate private schema, user-authenticated RPC, explicit approver/publisher/verifier grants, immutable records, exact digests, revocation, current-permission checks, CAS activation, idempotency and independent verification. The normal publisher button is **Approve and publish**; approval-only remains an RPC operation. UI distinguishes publishing from recoverable failure; only independent verification records verified-live. A replay returns its original outcome, and historical verified requests are identified as superseded after another activation. Rollback is an authorized activation of the retained baseline.

Publisher browser APIs cannot stage candidates or forge verifier attestations. Supabase service-role execution is denied. The database executes commands using the authenticated user's JWT; a server credential is not owner approval. No login/credential provisioning or hosted verifier setup has been performed. The eventual isolated environment must supply real authenticated sessions and narrowly granted approver/publisher/verifier identities before remote proof.

Article metadata and body share one request-memoized immutable snapshot. Protected pilot pages use no-store/noindex, are excluded from the actual service worker and cannot enter offline page caches. PWA shell and article reaction/comment components are suppressed in pilot views to avoid production side effects. A copy of legacy overflow presentation is explicitly pinned to the renderer; this is a temporary read-only adapter, not a second publication authority.

## Local reproduction

Prerequisites: Node, Docker, repository npm dependencies, and system Chromium at `/usr/bin/chromium`. The local container is disposable, network-disabled and uses an in-memory filesystem. It creates only synthetic local database roles/identities. No remote credentials are used.

1. `npm ci --cache /tmp/brief-npm-cache`
2. `npx next build` (compile only; full media-preparation build pipeline was not used)
3. `docker run --name brief-pilot-postgres --rm -d --network none --tmpfs /var/lib/postgresql/data -e POSTGRES_HOST_AUTH_METHOD=trust postgres:17-alpine`
4. Once Postgres is ready: `node scripts/publishing-pilot/local-init.mjs`
5. `node scripts/publishing-pilot/test-database.mjs`
6. In a separate terminal: `node scripts/publishing-pilot/local-gateway.mjs`
7. Start Next with the following local-only environment:

```sh
BRIEF_PILOT_ENABLED=1 \
BRIEF_PILOT_ORIGIN=http://127.0.0.1:4320 \
BRIEF_PILOT_SUPABASE_URL=http://127.0.0.1:4319 \
BRIEF_PILOT_PUBLISHABLE_KEY=local-test-publishable \
BRIEF_PILOT_RENDERER_ID="$(cat .next/BUILD_ID)" \
npx next start --hostname 127.0.0.1 --port 4320
```

8. Run `node scripts/publishing-pilot/test-browser.mjs`, `node scripts/publishing-pilot/test-faults.mjs`, `node scripts/publishing-pilot/test-cold-start.mjs`, then `node scripts/publishing-pilot/measure.mjs` sequentially.
9. Run `node --test tests/*.test.mjs`.
10. Stop local server/gateway and `docker stop brief-pilot-postgres` when finished. The container removes itself. Recreating the container resets the database suite; initialization intentionally refuses to overwrite an existing schema. Rebuild requires reseeding and fresh QA because the renderer identity changes.

The local gateway supplies synthetic Auth responses and forwards commands to real Postgres. It binds only to loopback. Never deploy it. These tests exercise SQL permissions/transactions and Next/browser behavior, but do not establish hosted Supabase Auth, hosted RLS integration, deployment protection, or remote delivery performance.

## Evidence and limits

See the committed JSON evidence alongside this file. The expected homepage/copy fixture is independently authored; candidate-generated snapshots are not the sole oracle. The browser suite checks all three editions, full overflow, exact representative copy, metadata, protected previews, one-action activation, rotation, same-build rollback, client/RSC navigation and real service-worker cache exclusion. Screenshots are local artifacts, not a claim of pixel-perfect visual parity; external media requests were blocked during browser tests.

Database tests cover missing/forged QA, wrong scope, service-role denial, unknown identity, stale renderer, simultaneous CAS, idempotent retry, revoked approval, changed permissions, local isolation, direct-write denial, immutable records, complete reads and independent verified-live status. Fault injection terminates a real backend before transaction commit, blocks a read until the five-second client timeout, pauses the database, and verifies recovery. A fresh Next process verifies durable committed state on cold start. No production availability fallback is implemented; it remains a cutover gate.

The timing harness verifies six affected home/article routes across three editions, alternating exact correction/baseline releases on one build. It records TTFB and workload counts, not database capacity or load-test limits. Twenty successful performance trials do not replace the separately recorded fault and authorization checks. No remote speed or cost savings are claimed.

## Hosted isolation prerequisite and recommended decision

Read-only account inspection found two Supabase projects: The Brief (`dnzdbqycuuoonewcowis`) and unrelated `fantasy-draft-room` (`fptdqutdzcxhrponaykv`). The Brief has zero database branches. Neither existing project is an acceptable pilot write target. Read-only deployed catalog inspection confirmed publication/access tables have RLS, league-scoped management policies exist, mutable article INSERT/UPDATE remain granted to authenticated users, and the public article RPC uses a private security-definer implementation. No secret values or row contents were read.

Recommend one temporary **data-free Micro preview branch**, manually created without Git auto-sync, no production-data inclusion, no merge back, no media migration, no new domain. Inspect inherited schema, functions, jobs and configuration before use; prevent any branch job or integration from writing to production. Apply pilot schema only after target-ref/grants verification. Keep the existing divergent staging branch/domain untouched; a separate protected Vercel preview must use only the verified branch configuration. Production release guards stay unchanged.

Separate approvals required before provisioning:

- **Access/configuration:** authorize the specific temporary branch creation and eventual deletion; first-time branch enablement may require an existing Owner/Administrator and changes project branching metadata. Branch creation generates isolated service credentials. Authorize narrowly scoped staging configuration and test identities, without new broad tokens or persistent role expansion. Do not assume current per-action connector approval permits these actions.
- **Spending:** account `get_cost` quoted $0.01344/hour for a branch. A 24-hour Micro window is $0.32256 compute before other usage. Branch egress/storage/disk can add charges and the provider Spend Cap does not cover branches. Proposed operational limit: one branch for at most 24 hours and a $1 incremental budget, with usage checks and cleanup; this is not a provider-enforced hard cap. If that limit cannot be monitored reliably, stop before provisioning and revise the request.

Rika can present that single bounded setup request. No branch, credentials, paid service, persistent grant, preview configuration or production setting has been created/changed by this work. Hosted publication and hosted authentication remain NOT RUN.

Provider references checked October 24, 2026:
- [Branching usage and costs](https://supabase.com/docs/guides/platform/manage-your-usage/branching)
- [Dashboard branch creation, permissions and default data isolation](https://supabase.com/docs/guides/deployment/branching/dashboard)

Deferred: generalized code/content fencing, production durable fallback/withdrawal rules, media migration, dashboard, notification queues, configurable rules and QA-gate consolidation. Production concurrency requires an agreed recovery owner and tested crash/lost-response/fence/rollback states. The branch is a reviewable pilot, not production-cutover authority.

## Review repair and operator responsibilities

Original review findings and reproduced database counterexamples are retained under `review-evidence/`; the original browser suite did not cover interrupted-operation recovery or preview-to-active mixing. Repaired tests explicitly use a correction preview while the active release is baseline, then follow article → masthead/home and article → return links. Unsupported newsroom navigation and sharing are disabled in pilot article views.

The publisher persists only its operation ID, candidate digest and expected generation in session storage scoped to authenticated viewer and renderer. Reload automatically reconciles status without submitting another approval. Lost responses are reconciled against the activation audit; a confirmed uncommitted failure exposes retry of the same operation ID. Committed/awaiting-verification, verified-live and superseded update automatically. Checking status is not itself labeled publishing. Storage failure prevents a new action rather than losing recovery identity.

QA is now append-only by attestation ID. Activation deterministically selects the newest currently valid attestation covering its changed-edition set, rechecking the verifier's current scope/version. Verification uses the activation's recorded changed editions, not a comparison with its now-current head. Approval ownership authorizes historical revocation even after unrelated edition changes. SQL rejects null capability fields and any verifier who is also an approver/publisher. Hosted grant validation must independently confirm these constraints, actual function execution permissions and intended identities before any hosted proof.

This is still a bounded technical fixture pilot. **Preparation trigger/owner:** Rika assigns a technical operator to seed an allowed scenario and run its independent preflight under the verifier capability before review. **Verification trigger/owner:** after a committed approval (including a recovered response), that operator invokes `node scripts/publishing-pilot/verify-local.mjs <request-id>` for the local demonstration; it checks the six affected routes and records the verifier's attestation. The UI then observes verified-live automatically. No hosted dispatch mechanism or hosted verifier identity has been configured. **Rollback trigger/owner:** a failed verification or an explicit staging rollback decision goes to Rika's assigned publisher operator; the operator activates the retained baseline through the same CAS/idempotent command with current generation and fresh request ID, then runs the same verification. Failure never silently rolls back a later publisher's release.

The performance and browser harnesses automate those operator steps for tests; they do not demonstrate a complete one-decision hosted publisher workflow. No generic orchestrator or dashboard was added. Full visual parity remains unproven because external media was blocked in local browser tests. The small allowlisted scenario set is fixture proof, not general-purpose publishing.

Repair reproduction: run `test-review-database.mjs` after `test-database.mjs`, and `test-review-browser.mjs` after `test-browser.mjs`, before fault/cold-start/timing tests. `reproduce-review-findings.mjs` is retained solely for the original schema; do not include it in the repaired acceptance sequence.
