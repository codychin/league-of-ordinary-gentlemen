# Autonomous matchup release gate

## Authorized sequence

Generate → staging → validation → manifest upgrade → production. The release is **not complete** until the exact production commit and every matchup route are verified. No user review of individual routine clips is required when quality gates pass. Financial authorization remains separately bounded; do not incur new unspecified rendering charges.

## Manifest states

For each edition, season, week and unordered team pair store `source_revision`, `script_revision`, `voice_id`, `video_id`, `render_status`, `qa_status`, `staging_url`, `staging_commit`, `production_commit`, `production_url`, `verified_at`, and `exceptions`. Keep an append-only transition history; never silently overwrite an approved revision.

Allowed transitions: `draft` → `source_verified` → `script_qa_passed` → `rendering` → `rendered` → `media_qa_passed` → `staged` → `staging_qa_passed` → `manifest_upgraded` → `production_verified`. A failure enters `blocked` with a specific reason and retry policy.

## Hard gates

1. Verify all six pairings per league against authenticated current-week provider snapshots. Do not treat projections as actual scores or Thursday selected lineups as locked.
2. Script QA: league isolation, correct week, history and scoring, source support, no invented manager motives, editorial repetition and distinct correspondent voice. Apply locked names and pronunciations.
3. Media QA: transcript/pronunciation, nonempty audio, duration, aspect/crop, correct avatar, playable video, no black ending. Never substitute an unrelated video.
4. Stage a complete league batch and verify all six matchup pages with browser tests on desktop and mobile, including correct headline, paragraph layout, media playback and no cross-league leakage.
5. Upgrade the manifest only for tested assets, retaining previous versions and source evidence.
6. Promote the tested commit/build through existing release checks. Verify the production alias serves that exact commit and all six routes per edition. A commit, READY build or render completion alone is not publication.

## Exceptions and delivery

Publish a league only when its entire six-matchup set passes. Other leagues may advance independently. Stop and notify the editor for unsupported facts, failed QA, provider inconsistency, render-budget overrun or unverified deployment. Send a single completion report with live routes, commit, counts and exceptions. Track first-pass QA, rework and post-publication corrections as regression fixtures for future runs.
