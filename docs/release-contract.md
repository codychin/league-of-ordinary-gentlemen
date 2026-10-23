# The Brief — Release contract (mandatory)

## A release is not a commit
A successful commit, CI run, Vercel READY state, and successful promotion are four separate facts. **Never tell the editor that a change is live until the exact intended commit is verified on the actual requested domain and the changed feature is checked.** A status response must disclose which gate has actually passed.

## Change workflow
1. Identify the exact page, edition, affected device/viewports, current production commit, requested acceptance criteria, and the existing design/editorial invariants. Read current code before modifying it.
2. Limit edits to the identified defect. No adjacent redesign or unrequested reordering. Preserve three-card carousel and chronological overflow, and separation between league-local and global canon.
3. For appearance fixes, define measurable invariants (image visible edges, object-fit, baseline alignment, header no-wrap, padding) and test at desktop, mobile web, and installed-PWA-sized viewports. Do not claim visual verification on the basis of a 200 HTTP response or unit test. Require screenshots or an actual visual inspection.
4. Run focused tests and the full build. A build that fails is a failed change, not an update to announce as finished.
5. Deploy staging first for editorial/media/design changes. Inspect the deployed staging artifact and exact changed route, **including all imagery and video playback**, not merely a local preview. Do not begin a second competing deploy while the first is unresolved.
6. Promote only the approved exact SHA. Wait for Vercel READY and domain alias pointing to that SHA; verify the live page and every relevant edition. Ensure deployment and page IDs match that release. If the release is superseded, stop rather than promoting stale output.
7. Report in one concise message: change, staging/prod URL, exact commit SHA, build status, alias status, feature-specific verification, remaining limitations. **Never say “fixed” while verification is pending.**
8. If a tool cannot verify a property, explicitly say so, and never substitute a guess for a pass.

## Regression matrix
- Global homepage + Culture page; all editions wherever scope requires
- Desktop 1440px; mobile 390px and 360px; viewport/safe-area PWA layout
- Hero and inline image completeness, focal point/crop, borders, source loads
- Media carousel: exactly three top items, correct chronology, overflow shifted down, no stories prematurely archived
- No overlapping headers, clipped thumbnails, wrapped week numbers, or portrait baseline regressions
- Video poster, aspect ratio, mobile crop, sound, subtitles/overlays, final second, fallback link, and playback
- Copy/metadata match the approved revision; no stray markup or duplicate language
- Cache: verify fresh-session and return-navigation experience, not only warm cache

## Handling incidents
On first failed validation, stop changing unrelated features, identify the exact serving SHA, isolate reproduction, and add a regression check for the failure class. Do not pile more commits on an unverified deployment. Preserve last-known-good release and make rollback decision explicit.

## Video feedback flywheel
Use docs/brief-video-performance-guide.md and docs/video-first-pass-qa.md as binding production constraints. Every correction is categorized (fact, script, voice, pronunciation, visual continuity, edit, aspect/crop, placement) and must update the relevant reusable rule or individual exception before the next batch. Each render stores script, voice/avatar settings, environment prompt, source evidence, pronunciation dictionary version, asset URL, and QA disposition. Track first-pass approval rate and render/revision counts; don't turn subjective quality into fake automated certainty. Human approval remains required for new styles, contested facts, or unusual scenes until a representative validated track record supports reduced review.

## Media release preflight and resumability

Before paid generation, establish the complete supported path from an existing or authorized canary artifact to protected preview and eventual promotion. Verify repository/branch access, an existing promotion route, the available artifact-transfer path, current main and serving SHA, and active workflows that can write the same files or ref. A missing credential is a blocker to that route, not permission to create credentials. Do not claim a preflight from tool availability alone. Record budget and scope separately from access evidence.

For each asset, record source identity and packaged identity separately: relative path, byte count, SHA-256, deterministic Git blob SHA, target repository/branch, and the returned remote result. Persist the receipt immediately after each confirmed operation and keep it in the release handoff artifact, not solely an in-memory tool store or disposable executor. Before resuming, re-read uncertain remote outcomes and compare the exact bytes' hashes. Matching filenames are insufficient; missing receipts are not evidence that a write failed. Never rerender merely to replace a missing receipt.

Approval requests have distinct states: requested/pending, executed with a verifiable result, denied, and uncertain. An accepted request is not an executed upload or proof of a visible approval card. After denial, retry at most once, only with materially new relevant evidence and a known non-executed outcome. Read uncertain outcomes first. Carry authorization evidence in the handoff, not as text inserted into tool arguments. A prior “Always Allow” interaction is not a blanket rule for later work.

Before merge or promotion, re-read main and active writers. Do not race a legacy run that may replace validated media or push a different tree. Assign one owner to reconcile the run's terminal result; changing a workflow does not cancel an already-running copy. Preserve historical assets and the existing CI, preview, exact-SHA, and domain-verification gates. An unchanged or pending job is not a terminal outcome.

## Isolated engineering handoff

Every release/recovery worker receives a short self-contained contract:

- Task type and purpose: engineering release/recovery, not a scheduled newsroom publication task.
- Exact repository, current observed base SHA, target branch, media manifest/receipt locations, and intended immutable build.
- Requested actions and their current authorization, with source/timestamp; explicit exclusions (paid generation, new credentials, schedule/security changes, unrelated publication as applicable).
- Active competing workflows and their owners; no overlapping main writes; reread main before mutations.
- Acceptance criteria, tests, preview/live verification requirements, rollback reference, and stopping condition.
- Completed, denied, pending, and uncertain operations, including exact target and evidence needed next.

Resolve contradictory scope with the parent before dependent writes. This contract documents task isolation; it cannot override safety policy, grant permissions, force approval UI delivery, or control platform review classification.

The release owner owns monitoring and recovery within authorization until completion or a specific blocker requiring user action. Send useful findings and exact blockers without asking the editor to poll jobs or assemble a multipart manual deployment. Consult `docs/week7-release-incident-2026-10-23.md` for the failure cases. Distinguish enforced code from operator procedure and platform limitations in every completion report.
