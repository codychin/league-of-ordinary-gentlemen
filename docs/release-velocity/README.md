# Release velocity recovery — October 23, 2026

Measurements are pinned to approved main SHA `213e900f7ed9da9fe0348dff4fea7bb8b7ab32c9` (PR #70). No deployment, promotion, provider setting or published asset was changed by this investigation. The isolated branch is `qa/release-velocity-recovery`.

## Implemented, reversible changes

- Promotion checks for the required credential **before** fetching the repository. A missing secret still fails closed and is never printed.
- Promotion uses the same pinned checkout action and validated `workflow_run.head_sha`, fetching/materializing only its two standalone release scripts with non-cone sparse checkout. No npm dependencies, application files or media are required by those scripts.
- The independent production-route smoke workflow similarly checks out only its standalone script, bound to the deployment event SHA (or dispatch SHA).
- The exact review branch is disabled in `vercel.json` so opening this draft does not deploy it. Existing main, staging and feature-preview policies are unchanged.
- Regression tests exercise the **unchanged** promotion script with every API request mocked: matching READY SHA/branch, failed/canceled/pending builds, wrong SHA/branch, API rejection, invalid input and mismatched live deployment/SHA. Successful mocked promotion performs no real request.

Release integrity, article geometry checks, promotion concurrency, obsolete-main refusal, exact-SHA READY selection, domain identity confirmation and post-promotion route checks remain required exactly as before. No error suppression, retries, timeout reduction or conditional skipping was introduced.

## Git checkout evidence

The current tracked tree is **2,203,532,669 bytes / 2,871 files**. Of that, MP4s are 1,011,257,260 bytes and HLS is 1,147,592,318 bytes: **98.0% of the tree**. There are another 28,068,291 bytes of checksum-approved source parts. The largest MP4 is 23,299,672 bytes; the top 15 are listed in `repository-size.json`.

Main has 1,160 commits and 6,393 reachable blobs: 3,758,311,677 logical bytes / 3,715,009,506 bytes in their local object representations. All-ref packed storage is approximately 3.57 GiB; it must not be equated to the Vercel transfer payload.

A local Git-aware depth-10 fetch of this SHA produced a 2,192,616,038-byte Git directory. Depth 1 produced 2,192,971,017 bytes. Pack-layout differences explain the small inversion. There is no meaningful shallow-depth payload benefit at this particular SHA. Earlier HLS churn has largely aged out of this snapshot's shallow window; full reachable history is not what Vercel is documented to fetch.

[Vercel documents a default depth-10 checkout](https://vercel.com/docs/builds/configure-a-build). Its logs do not expose the effective per-deployment flags, server-side pack timing, unpack timing or exact wire bytes. We verified source SHA/branch in the clone logs and compared Git-aware fetches; we did not claim to trace Vercel's private checkout implementation.

| Existing production deployment / SHA | Clone | Next compiler | Creation → deployment complete |
| --- | ---: | ---: | ---: |
| `dpl_DKXsFbPW4UCYib35ZjgtU6iMgchK` / `213e900` | 122.123s | 0.586s | 166.429s |
| `dpl_BpbvT9xCpT5Qvxm1xrK4z5eRAc9m` / `5f78afb` | 80.517s | 0.516s | 123.357s |
| `dpl_3FyaQAJ5Ri5LmaisJoPxkzYJnRmo` / `aaf7a34` | 88.462s | 0.639s | 133.783s |

This supports focusing on source acquisition, not compiler tuning. The individual GitHub packing/network contributions remain uncertain. Media migration and history rewriting are unnecessary for the small control jobs optimized here. `.gitignore` or `.vercelignore` cannot remove already tracked blobs from Git acquisition. No undocumented Vercel clone variable was added.

## Demonstrated savings versus expected savings

Two sequential full/sparse pairs used Git-aware `file://` transport (no local-clone hardlinks), depth 1, the same source SHA and identical release-script bytes. The temporary local upload-pack explicitly allowed filtering, including lazy fetches; trials in which the server ignored filtering were discarded. The original repository configuration was never altered.

| Mode | Git directory | Worktree | Total trial 1 | Total trial 2 |
| --- | ---: | ---: | ---: | ---: |
| Full checkout | 2,192,971,017 B | 2,203,532,669 B / 2,871 files | 16.2026s | 16.8303s |
| Filtered sparse checkout | 508,080 B | 5,169 B / 2 files | 0.1230s | 0.1254s |

This demonstrates over **99.97% less Git-directory data** for promotion, saving 16.08–16.70s locally. A fresh GitHub HTTPS filtered fetch + sparse checkout also succeeded: **0.4834s total, 508,070 Git bytes**, correct SHA and the same two files. This is workstation evidence, not a prediction of a hosted runner's exact latency. The pinned [checkout action source](https://github.com/actions/checkout/blob/11bd71901bbe5b1630ceea73d27597364c9af683/src/git-source-provider.ts) enables `blob:none` when sparse checkout is requested; no separate `filter` input is necessary.

The existing promotion checkout took 122s in GitHub Actions. Most of that transfer is avoidable; exact hosted savings need a later successful release. Early missing-credential refusal avoids that entire checkout on the currently failing path. This PR does **not** reduce Vercel's 80–122s full application checkout, and does not claim a measured after-change production release time. The user prohibited deploying this candidate.

Reproduce the filtered HTTPS experiment in a fresh temporary Git repository: configure an `origin` remote, `remote.origin.promisor=true` and `remote.origin.partialclonefilter=blob:none`; fetch the pinned SHA with `--filter=blob:none --no-tags --depth=1`; run `git sparse-checkout init --no-cone` and set the two anchored `/scripts/operations/*.mjs` paths from the workflow, then detach-checkout `FETCH_HEAD`. Use existing Git authentication, never paste credentials. Verify `HEAD`, script hashes, file inventory and Git-directory bytes. The JSON files retain exact timings and counts.

## Both Vercel projects and trigger map

Read-only sample: 30 deployments per project, with identical branch/SHA pairs. Counts are observations within this window, not a statement that all feature branches have identical policy forever.

| Push/event | Production project `prj_h89MCmxn3Mr3O0wRpnwstM917E0l` | Staging project `prj_7rg8CkADuyPW5Um3H2Ubu008X13G` | GitHub builds/checks |
| --- | --- | --- | --- |
| main | 16 READY production builds | 16 canceled after ignored-build step | Release integrity and separate Article image release gate each install/build/test; promotion follows successful main-push integrity |
| staging | 7 READY isolated preview builds | 7 READY isolated staging builds | No direct ordinary push integrity/image trigger; PRs trigger their applicable checks |
| feature branches | 7 READY isolated previews | 7 canceled after ignored-build step | PRs trigger integrity; main-targeting PRs also trigger article-image gate |
| deployment success | No new application build required | No new application build required | Production route workflow listens; sampled run was skipped by its Production-environment condition |

The staging project's canceled `213e900` deployment (`dpl_GdjXmzQngfJj4RhXVnXL3LMvee4w`) cloned for **130.896s before cancellation**. An ignored-build step therefore saves build work but not this clone. Prefer project-specific pre-build branch subscription controls if supported; verify that the staging alias still tracks staging and each required preview exists before changing provider policy. Do not disable shared main/staging branches globally in repository configuration: both projects consume it. Necessary feature previews are preserved by this PR.

Two staging builds for a staging push are candidates for consolidation, not proven interchangeable: projects can have different environment flags and protection. Current `staging.ordinarybrief.com` resolves to staging-project deployment `dpl_BBD8RuW26YHkyQK83dXLA2fWHKKd`, SHA `cce8138ea94c90a0e3bda61fa3790b74024d3c21`. Keep that isolation; no alias was moved.

The standalone Article image release gate repeats the geometry test/build now inside Release integrity. It does not control the promotion workflow's success predicate. Consolidating it can save a build/runner allocation, but removing its status without checking required contexts could weaken review. It is unchanged here.

Packaging workflows for Sunday Crew Week 4, Week 4 recaps and Dashiell run on their workflow-path pushes or manual dispatch. Week 6 packaging and Week 5 preview/recap publishing are main/path-filtered or manual. Week 3 normalization is main/workflow-path filtered. They can commit media to main. `Transcode reels to HLS` listens to MP4/workflow-path pushes on **all branches**, checks out full history and regenerates historical HLS before pushing main. Branch restrictions and incremental approved-input guards deserve separate review; none was changed or executed here. The live production monitor is scheduled/manual and does not build the app. A full trigger inventory is in `workflow-triggers.json`.

During this audit, the existing automatic transcoder independently advanced main to `4decddd3848fef50fdde9fd94f9a304c39f63bf1` (“Generate HLS reel renditions”). Measurements/tests remain pinned to `213e900`; this PR has no media diff and did not start that job. That concurrent mutation reinforces the need for separately reviewed media-workflow isolation.

Before this draft was opened, main advanced again to `770cbfdace6740b4630f5114175a94f1d4b19c4f`, merging [PR #71](https://github.com/codychin/league-of-ordinary-gentlemen/pull/71). That separate change replaces the destructive transcode workflow and adds HLS-packaging safety/release-preflight checks. The trigger/transcode findings above describe the measured `213e900` baseline, not that newer implementation. This draft neither duplicates nor reverts PR #71; its changed files do not overlap those guardrails. Reported test totals remain pinned to the audited source and candidate, not a claimed test of all concurrent main changes.

## Approved merge → verified release critical path

For `213e900`, Vercel and GitHub ran in parallel:

- Vercel deployment created 21:30:59.679 UTC; build READY 21:33:45.907; deployment-completed log 21:33:46.108.
- [Release integrity run 40027334547](https://github.com/codychin/league-of-ordinary-gentlemen/actions/runs/40027334547): created 21:30:57, completed 21:33:59 (**182s**). Checkout 123s; npm ci 9s; build 16s; browser installation 15s; geometry step 8s; Node tests 1s.
- [Promotion run 40027702818](https://github.com/codychin/league-of-ordinary-gentlemen/actions/runs/40027702818): created 21:34:01, completed 21:36:11. Checkout 122s; it then failed immediately because **VERCEL_TOKEN was missing**. No live-route confirmation ran.

The observed merge-triggered check-to-failure interval was 314s, not a successful total-release time. With credentials present and the build already READY, sparse checkout should remove most of the extra promotion checkout from that critical path. API promotion, domain propagation and live-route timings are unknown. A future release must record all of those clocks; READY alone is insufficient. No secret was read, configured or printed during this work.

Important gate limitation: the live domain resolves to `213e900` despite the failed automated promotion. That observation cannot establish when or by whom assignment occurred, but it means this workflow is **not proven to be the exclusive publication gate**. Classic main protection returned 404 and active branch rules returned an empty list. Thus green PR checks are not currently proven mandatory for merging. Provider auto-domain assignment / Deployment Checks and branch protection need owner-reviewed configuration verification. This draft does not mutate those production settings or claim publication is safely gated solely by its workflow edits.

## Browser checks that actually gate versus proposed change-aware gates

Release integrity unconditionally runs Node tests, the full build and `article-image-framing.spec.mjs` (two fixed article fixtures × three viewports). It is a prerequisite for the automatic promotion workflow. It does not run the complete browser suite. Node tests cover carousel count/routing and packaged HLS structure, but do not prove rendered portrait baseline, playback, seeking or approved audio. The separate article-image workflow repeats the same browser fixtures. Publication exclusivity remains subject to the domain/rules caveat above.

The following is a **proposal**, not a new skip policy. Existing mandatory checks remain unconditional in this PR.

| Change surface | Required browser/media gate |
| --- | --- |
| Article catalog, body, hero/image wrappers, shared CSS, image delivery | Existing image geometry fixtures plus every changed article image at 1440/390/360; natural ratio, decode, overflow and approved fit. Do not limit coverage to a fixed historical pair. |
| Matchup portrait/card component, shared card CSS, portrait source mapping | Portrait alignment spec for all three editions and all viewports; bottom/baseline geometry and clipping. |
| Shared homepage, carousel/lead styles, approved release manifest | Homepage lead, exactly three ordered cards, adjacency, mobile overflow and image/JS-error checks across editions/viewports. Use approved manifest, never infer approval from rendering. |
| Article route/catalog/editorial scope, edition routing | All affected slugs in every applicable edition, real content/title, archive reachability, no placeholders; retain Node global-route checks. |
| MP4/HLS, playlists, posters, player, delivery route, service worker or media manifests | Approved SHA256/audio inventory; decode, duration/streams; MP4 playback/seek and HEAD/206 ranges; native HLS including init/every segment and Safari/WebKit playback; release/edition scoping. Existing file-presence checks alone are insufficient. |
| Unknown/shared dependency, build/config/workflow change, unavailable or truncated changed-file list | Full conservative gate set; never interpret classification failure as no changes. |

Classify against the exact approved merge base and candidate SHA. Handle renames/deletions and transitive shared component/CSS changes. Always execute a stable required gate job that fails on missing reports or unavailable targets. Use scoped gates for PR feedback but a full immutable-staging suite for final release. Make promotion depend on all selected gate results and enforce equivalent provider domain assignment/branch protection before claiming a publication block. Keep screenshots/JSON on failure, zero retries/error suppression, and mutation tests proving each gate catches its intended defect. Human editorial/visual approval remains distinct from mechanical pass status.

## Validation, limits and rollback

Baseline Node suite: 131 passed. Candidate Node suite: **146 passed, zero failures/skips**, including 15 new release-safety tests. Those same 15 tests also passed while executing the actual script from the independently fetched sparse GitHub checkout, with all API calls mocked. Normal `npm run build` passed (Next compiler 1,557ms).

The complete local browser run at **http://127.0.0.1:3108** finished **74 passed, 1 failed, zero skipped/retried/flaky**. All six article-geometry cases and nine portrait-alignment cases passed. Desktop LOOG homepage image auditing exceeded the existing 120s timeout inside `inspectImages`/`page.evaluate`; no per-asset audit returned, and the captured JavaScript error array was empty. Root cause is not established, so this is not represented as a confirmed broken URL or application defect. Failure screenshot/trace and raw JSON remain outside Git in `/private/tmp/brief-release-velocity-evidence`. No rerun replaced this result. The app, helper, manifest and assertions are unchanged. This unresolved failure remains a review limitation.

All **2,264 tracked media files** retained their recorded SHA-256 checksums; both approved MP4 restoration checks passed. Summary results are in `validation.json`.

No native-HLS playback or subjective audio validation was claimed. No application/media source changed. Existing approved-media restoration checksum checks still run in the unchanged build. HTML reports, traces, generated media/images, credentials and machine configuration are excluded from the PR. Local build-generated assets are retained outside the checkout and original tracked bytes restored after verification.

Rollback is one reviewed revert of the two workflow hunks: remove sparse inputs and the early credential step; restore the previous route checkout ref. Scripts, exact-SHA and obsolete-build checks, domain verification, application and media remain unchanged. A full checkout then resumes. The exact review-branch deployment guard can remain or be removed independently without affecting main/staging. Reverting needs no asset upload, regeneration, data migration, provider mutation or history rewrite. A future new local script dependency must update sparse patterns and the dependency regression test together; otherwise CI fails rather than silently fetching unrelated media.

Demonstrated savings are checkout payload/local time only. Hosted end-to-end after timings require a separately authorized release with credentials configured. Provider subscription changes, object-storage migration, history rewriting, publication-gate settings and duplicate-build consolidation are deliberately left as proposals.
