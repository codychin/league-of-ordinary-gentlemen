# Release workflow: performance and access boundaries

This CI-only patch is rebased on the verified Week 8 video release, main
`2421c13d84758699d6dd93aaf84e63065959fe72`. Its eight-file diff does not change
application behavior, media or approval waivers. A test-isolation correction
retains its assertions and reports each edition separately. Historical
measurements below describe the cited candidates, not release approval for a new
head. A rebuilt or retargeted candidate requires fresh CI.

## What the November 4 investigation established

These are separate failure classes. A green build cannot resolve an authorization
denial, and an authorization grant cannot stand in for CI or deployed verification.

| Measured step | PR 121 | PR 122 | PR 123 final head |
| --- | ---: | ---: | ---: |
| Media-preparation checkout | 216s | 146s | 169s |
| Media prerequisite setup | 52s | 32s | 25s |
| Real media tests | 24s | 20s | 18s |
| Integrity checkout | 167s | 152s | 189s |
| npm install + unit tests + build | 40s | 31s | 36s |
| Main browser suite, one worker | 622s | 423s | 485s |

Sources: [PR 121 run](https://github.com/codychin/league-of-ordinary-gentlemen/actions/runs/41767180479),
[PR 122 run](https://github.com/codychin/league-of-ordinary-gentlemen/actions/runs/41769197337),
[PR 123 run](https://github.com/codychin/league-of-ordinary-gentlemen/actions/runs/41775989937).
Job logs provide timestamps; the connector's job summaries omit durations.

The earlier [PR 123 failed run](https://github.com/codychin/league-of-ordinary-gentlemen/actions/runs/41773402010/job/126389426081)
passed installation, unit tests, build, real media preparation, and unmocked image
checks. Its 15 browser failures were one stale preview-shelf assertion repeated
across three editions and five browser projects, not 15 different application
defects. It spent 12.4 minutes in the browser suite. The final PR 123 test checks
the exact recap IDs and preservation of previews and Week 7 archive history.

There was already one install/build per integrity run, with the article-image
required check consuming only same-run exact-commit evidence. Cross-commit or
PR-to-main build reuse is **not** introduced here. The full integrity checkout
still contains all historical assets because its tests and build consume them.

## Changes and preserved gates

- Media preparation uses a non-cone sparse checkout containing its small code
  dependencies and six real original/HLS fixture packages. These total
  106,713,960 bytes in 126 files at the investigated head, rather than roughly
  3GB of unrelated historical media. All three real decode, interruption and
  resume tests passed from an isolated copy containing only those inputs.
- `scripts/operations/media-ci-inputs.mjs` derives the media paths from the
  fixture manifests. A regression test compares that output to the workflow.
  After changing fixtures, regenerate the paths and run the actual media job.
  Keep checkout's automatic `blob:none` fetch filtering: setting a separate
  `filter` option overrides that fetch filter, though sparse working-tree paths
  still apply. See [actions/checkout](https://github.com/actions/checkout/tree/v4).
  The recap-waiver JSON path also supports historical bases where it did not
  yet exist. Sparse patterns may name a missing optional file; current recap
  releases include it. Missing dependencies still fail the real media job.
- A newer commit cancels only an obsolete run for that same PR. Main and manual
  dispatches have unique groups and never cancel each other or promotion.
- CI uses two browser workers, file-level parallelism, the same five projects,
  the same test list, and zero retries. Local diagnostics remain serial. This
  is a modest concurrency trial, not a promise of a twofold speedup; compare
  actual CI timing and failures before accepting it. The suites use isolated
  browser contexts and test-specific attachment paths.
- CI stops on the first browser failure and rejects focused `test.only` cases.
  Unrun tests are not passes. A real Playwright failure canary confirms the
  command remains nonzero. A successful run still completes the same coverage.
- Integrity retains its dependency on successful real media preparation and
  has a 30-minute bound. Both required check names, same-run identity validation,
  pinned browser image, screenshots/traces on failure, production environment,
  exact-main checks, staging inspection, and alias verification remain intact.
- Release integrity has read-only repository permissions; checkout does not
  retain Git credentials. No new service, payment, token or trust policy is set up.

The tradeoff is slightly higher simultaneous CPU/browser demand. If two workers
cause reproducible resource failures, return the worker count to one while keeping
the sparse checkout and cancellation improvements. Do not add retries or loosen
geometry/navigation assertions to hide a failure. See
[Playwright parallelism](https://playwright.dev/docs/test-parallel) and
[GitHub concurrency](https://docs.github.com/en/actions/using-jobs/using-concurrency).

## Protected preview access is a distinct preflight

The Vercel project uses authentication on deployment URLs. Creating a share URL
is an access change: anyone holding that URL can access the deployment until its
expiry. Fetching a protected URL through a helper can create the same link as a
side effect. Neither action is a read-only workaround for a denied share request.

Before starting a release, record the exact repository, branch, media identities,
Vercel project, approved publication scope, and authorized protected-preview
access method. Bundle foreseeable access questions before expensive generation.
When a concrete immutable deployment exists, bind the verification receipt to
its ID and exact commit. Freeze the candidate after local regression checks and
before requesting temporary preview access where practical. A later commit is a
new candidate even if it changes only a test; old evidence is not relabeled.

The current production workflow already requests short-lived GitHub OIDC identity
for staged route checks. That is preferable to a public share link **where the
existing trust rule demonstrably covers the caller and destination**. It does not
prove PR preview access. Adding or widening a Trusted Source rule is a separate
security change requiring explicit approval; never broaden it to arbitrary PRs
or disable deployment protection to make this workflow pass. See
[Vercel Trusted Sources](https://vercel.com/changelog/trusted-sources-for-deployment-protection).

The repository cannot change an external tool's approval classification, show a
missing approval prompt, or convert an ambiguous response into authorization.
Follow the existing denied/pending/uncertain-operation rules in
`docs/release-contract.md`. Keep a single release owner, and do not launch a
second deployment or route around an access denial.

## Artifact transport

The observed connector request limit was 16MiB **including encoding**, not a
16MiB original video. The released Week 8 solution from PR 123 uses deterministic
4MiB lossless parts and per-part plus reconstructed-file hashes; this CI patch
preserves that transport unchanged. Preserve source and
HLS identities independently. Use an already verified transport route and canary
before a batch; check that both the expanded request and final Git tree are
readable. Native Git being installed is not evidence that push authentication
exists. Missing transport permission is not permission to create credentials.

Do not rerender, drop history, use expiring provider URLs at build time, or rewrite
Git history to improve checkout time. A future media-storage migration needs its
own durable-byte, access, cost and rollback review. This patch does not perform it.


## Release-delay accounting and follow-through

Do not describe the entire elapsed publication window as build time. Separate
editorial/source readiness, generation, transfer, validation/rework, authorization
waits, and promotion. Record start and terminal timestamps for each so the next
release can be compared fairly. A check being green does not mean a blocked
publication step was executed.

For the November 4 video release, the recorded ready/merge authorization wait
was 05:14:13 to 19:29:21 UTC (14h15m08s). The release was merged at 19:31:00,
the exact production alias was verified at 19:50:39, and all 18 live playback
starts plus archive preservation were verified by 19:54:29. This interval must
not be attributed to CI. Sources: [PR 123](https://github.com/codychin/league-of-ordinary-gentlemen/pull/123),
[main validation](https://github.com/codychin/league-of-ordinary-gentlemen/actions/runs/41897673819),
and [gated promotion](https://github.com/codychin/league-of-ordinary-gentlemen/actions/runs/41900743272).

The primary repository-controlled latency is the real-media checkout followed
by serial browser validation, not npm installation or the application build.
The earlier identical-app PR 124 trial reduced media checkout from 169s to 2.45s
and complete validation from 16m27s to 11m04s. A separate main-based trial took
13m23s. These are observations, not a fixed performance guarantee. Successful
trials completed all 240 browser cases: 207 passes and the same 33 intentional
skips. A first-failure stop is only a faster failure report, never a successful
result for unrun tests.

Operational follow-through remains necessary:

- Complete the transport/access canary before paid generation and retain the
  confirmed receipts. Test the actual request-size limit including encoding.
- Freeze application and regression-test expectations together before deployed
  preview verification. Do not reuse an old build's proof for a changed head.
- Keep one release owner and one explicit next step. If authorization is denied,
  report the exact action and its non-executed state once, carry the relevant
  evidence, and distinguish the pending decision from general investigation.
- Preserve release order while a fully validated candidate is waiting. Do not
  advance main with unrelated work and then make the release repeat its checks.
- Verify live output and reconcile asset registries before marking the release
  complete. Keep full listening/playback/perceptual-review limitations explicit.

The CI patch does not solve the platform's authorization-context behavior. The
recorded protected-preview requests and draft-to-ready transition were reviewed
separately from CI. A green check, broader app setting, or faster runner cannot
change those decisions. Escalate inconsistent authorization handling with the
exact action, timestamp, result and relevant approval, rather than relaxing gates
or promising that another repeated confirmation will permanently fix it.

## Exact-head regression found during the refreshed trial

[Run 41902336662](https://github.com/codychin/league-of-ordinary-gentlemen/actions/runs/41902336662)
correctly failed closed. All real-media, unit, build and unmocked-image checks
passed; the browser suite stopped on a collected WebKit JavaScript error. Its
trace showed the Culture styling test's `networkidle` wait returning immediately
because that lifecycle event had already fired. A hard `/doge` to `/sunday-crew`
navigation then overlapped Next prefetch traffic. The error happened during
navigation, not during the final error assertion. There is no evidence that two
workers caused it, and the individual failing request lacked a network snapshot.

The correction gives each edition its own normal Playwright page fixture for
this Culture styling/scrolling test. Every original visual, scrolling, masthead,
screenshot and JavaScript-error assertion remains. Dedicated navigation/history
coverage is unchanged. This removes only an artificial cross-edition document
transition unrelated to the styling contract. A test-list regression checks all
three editions in all five projects. The browser matrix now has 250 cases rather
than 240 because the three edition checks report separately. No error filtering,
prefetch disabling, fixed sleep or retry-to-green is introduced.
