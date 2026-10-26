# Automatic production release contract — PR88

## Scope and activation boundary

The incident release `2b2795d` is already live (parent verification). This branch
must not replace or roll it back while policy/merge actions remain pending.
The earlier review-rejection design is removed. There are no cancellation,
review-rejection, credential-creation, or permission-expansion operations here.

Owner direction: routine trusted-main releases must not depend on personal browser
sessions or an owner's response. Actual Production environment inspection found:
required reviewer `codychin` ON; main-only deployment branch (one branch, no tags);
admin bypass OFF; wait timer OFF; environment-bound `VERCEL_TOKEN` present.
Removing only Required reviewers is a separately pending platform action. Keep
all other restrictions and the existing token in this same environment. Until
that exact policy change is applied and verified, unattended release acceptance
is BLOCKED. This branch cannot change GitHub environment settings.

The workflow reads `vars.BRIEF_RELEASE_MODE` and requires `promote`; it does not
silently default to promotion when configuration is absent. `BRIEF_RELEASE_CANARY_FAIL`
must be unset/false for normal release. Verify exact configured variable names,
not just the `RELEASE_MODE` process variable shown in a job.

## Actors, gates, queues, and evidence

| Stage | Actor / authority | Queue or gate | Deadline, reconciliation, alert |
| --- | --- | --- | --- |
| Approve code and merge protected main | Authorized maintainer/agent, interactive connection | Existing branch protection and PR checks | Security/admin authority remains separate. This PR does not change branch rules. |
| Required integrity and image checks | GitHub Actions service identity | Hosted runner capacity, dependency install, browser QA | Existing CI jobs; watchdog alerts when checks are unresolved after 45 minutes or terminally fail. PR87 separately owns CI speed/timeouts. |
| Build exact main SHA | Existing Vercel Git integration | Vercel build queue/checks | Exact READY production build required; poll at most 10 minutes. Wrong SHA/project/target/checks fail closed. |
| Admit candidate | GitHub Actions ephemeral token, contents/checks read | No global concurrency, no Production environment | Three-minute job. Only successful push-to-main workflow events from this repository; current main and both latest exact-SHA GitHub Actions checks required. |
| Check completion order | GitHub workflow_run service event | Either integrity or image-gate completion | Both workflows trigger admission. If the other check is pending, skip; its eventual success triggers admission again. Failure becomes an incident. No dispatch token or polling writer. |
| Serialize promotion | GitHub concurrency service | Job-only `ordinarybrief-production-promotion`, cancel-in-progress false | Only eligible candidates enter. Never cancel an executing promotion. Newest pending candidate can replace an older pending candidate; main is checked again under the lock. |
| Production access | GitHub environment gate and environment-bound existing Vercel credential; ephemeral OIDC for staged routes | Main-only branch restriction; no reviewer after separately approved change | Thirty-minute job timeout; monitor alerts on overdue queue/execution. No secret relocation, broader grant or personal browser. |
| Stage and promote | Existing Vercel credential + GitHub read/OIDC identities | Exact main/checks, provider checks, six staged routes, manual assignment false | Receipt records candidate, predecessor, SHA and phases. Promotion POST at most once within an execution. Request failure triggers reads, not another POST. |
| Provider operation | Vercel alias service | `lastAliasRequest` and actual domain identity | Active/unknown/failed operation blocks new POST; bounded four-minute reconciliation. Same candidate already live is verified without POST. Unresolved state is an incident, not permission to retry blindly. |
| Assignment-policy restoration | Same Vercel service credential | Mandatory finally after POST | Verify manual assignment false. Interrupted-success recovery may restore only when provider says this exact candidate succeeded and is already live. Unknown policy changes fail closed. |
| Public verification | Actions public HTTP client | Actual custom-domain routes, all three editions | Existing six-route retry loop. Receipt becomes `verified` only after alias AND public routes pass; persisted as artifact with run/attempt identity. |
| Release and public health | Existing 15-minute GitHub monitor and existing issues-write token | Public route checks plus public GitHub release metadata | CI 45m, eligible release not started 15m, promotion queue/execution 35m. Existing schedule raises/updates/closes a distinct release incident. API/rate-limit failure also alerts. No new schedule or token. |
| Security/admin changes and rollback | Explicit authorized operator | Platform per-action controls; exact target scope | Not routine release work. Rollback decision tested in isolation only; production mutation remains disabled pending exact incident authority. |

No workflow-global lock remains. In particular, PR workflow completions fail
admission before they can occupy or replace the promotion queue. A candidate
already admitted can become obsolete while waiting; the protected job and
promotion script both recheck main before any POST. The provider-state check
prevents starting new work while a previous alias operation is still active.

## Failure semantics and recovery

Normal retries do not require a personal browser. A repeated service run sees an
already-live exact candidate and performs verification without another promotion.
A lost POST response is reconciled against provider state and live alias. A
failed/unknown provider operation or a mismatched alias fails closed and emits a
receipt plus a release incident. It must not be treated as a verified nonexecution.

A hard runner kill can prevent `finally` and artifact upload. The next operator
or run must inspect remote provider operation, alias and manual-assignment policy,
not infer outcome from missing local artifacts. Narrow interrupted-success policy
restoration is implemented. Other uncertain cases remain deliberate fail-closed
incidents. We do not claim exactly-once provider API semantics or guaranteed
recovery when Vercel's state itself is unavailable/inconsistent. No automatic
retry loop should be added around promotion POST.

The existing incident workflow creates GitHub issues; human delivery through
GitHub notifications/subscriptions is not yet proven. A blocked scheduler cannot
alert through itself: runner/Actions-wide outages require provider monitoring or
an independently authorized observer. These are acceptance unknowns, not hidden
assumptions. The public metadata watchdog uses no credential/grant expansion;
GitHub rate-limit errors are explicit monitor failures.

## Routine content/data versus code versus security

- Existing score snapshots and approved Live Desk text use their existing scoped
  data/worker contracts. They do not require a website build or personal review.
  Live Desk's Sunday window, model restriction and atomic spend reservations stay
  unchanged. This PR does not generate content or modify scores.
- Repository code, static editorial assets and UI changes follow protected-main
  checks, exact Vercel build, promotion and public verification above.
- Credentials, grants, reviewer policy, branch policy, service connections and
  rollback authorization are security/administrative actions. They cannot be
  smuggled into a routine release or inferred from a successful mock test.

## Rollback boundary

`rollbackDecision` only accepts an explicitly authorized incident, a fully
verified release receipt, the still-current recorded candidate, and its distinct
recorded predecessor from this project/production with READY status. Active or
uncertain provider operations prohibit rollback. The function has no production
mutation wiring. A later authorized rollback must use the same serialization,
provider/alias reconciliation, manual-policy restoration and public verification.
No arbitrary deployment or Git SHA is accepted. Reverting this code affects future
runs only; never cancel an active promotion to revert the workflow.

## Acceptance evidence — do not substitute fixtures for production proof

Implemented isolated tests cover current and obsolete candidates, both check
completion orders, newer/concurrent work, failed/foreign checks, wrong deployment,
lost POST response, interrupted applied promotion/policy restoration, active or
unknown provider operation, no duplicate for an already-live candidate, stalled
release alert classification, and bounded rollback decisions. Existing promotion
and route validation tests continue to run. No tests invoke paid generation or
live promotion/rollback.

Still REQUIRED before claiming the automatic architecture accepted:

1. Capture actual Production policy after the narrow reviewer change; verify
   main-only branches, admin bypass OFF, wait timer OFF, secret location, mode.
2. After the incident release and merge authority are resolved, run the exact
   final-main release with personal browser signed out and no owner response.
   Record both checks, READY candidate, job admission/queue timing, provider
   request identity, manual policy restoration, aliases, public routes and receipt.
3. Exercise obsolete/newer candidate queue behavior in controlled GitHub runs;
   verify unrelated PR completion cannot displace an eligible main promotion.
4. Verify the existing monitor creates and recovers an incident and that the
   designated release operator actually receives it. Confirm Actions runner
   outage monitoring responsibility outside this workflow.
5. Keep destructive rollback and real interrupted-promotion drills isolated until
   exact production incident/drill scope is authorized. Mock coverage alone does
   not prove provider consistency or production recovery.

References: GitHub job concurrency and environment protection documentation;
Vercel project `lastAliasRequest` API and official CLI promote/status implementation.
This contract reduces known failure modes; it does not promise zero future failures.
