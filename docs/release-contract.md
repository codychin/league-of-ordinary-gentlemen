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
