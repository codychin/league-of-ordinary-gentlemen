# Week 8 LOOG data rollover — October 29, 2026

Scope: routine provider-backed score/lineup consumer and corrected standings/history. No editorial publication or database mutation.

Source: existing authenticated Flaim evidence read through Supabase, league 310731, season 2026. `brief_league_snapshots` IDs 208 (standings, retrieved 12:03:16.560Z), 209 (matchups, 12:03:15.221Z), 210 (all 12 Week 8 rosters, 12:03:34.102Z–12:03:36.591Z). `brief_live_score_state` ID 76 contains corrected Week 7 finals retrieved 12:04:23.529Z. These are retrieval observations; no upstream refresh timestamp is claimed.

`data/week8-loog-verified.json` retains the relevant provider selections and corrected final source. Roster season stats are intentionally not mapped to Week 8 points. The route requires season 2026 and week 8 before selecting these rows, reports retrieval time, and shows unknown player points.

Team 1 (Chat GPT's Chosen Ones, stable slug kupp-doubs) changed from 135.92 to 136.42. PF is 990.20; opponent Pollard Greens PA is 938.94. Winners, all records, and Weeks 1–6 remain unchanged. The exact original Week 7 league/score snapshots remain in `data/week7-loog-snapshot.json` and `data/week7-loog-scores-original.json`. Historical closeout tests now exercise those immutable fixtures; rollover tests reconcile corrected current data independently.

The supplied correction identifies a team total, not a player or position. Historical player rows and position totals remain intact. `unattributedScoreCorrection: 0.5` explicitly reconciles the difference, with a reader-facing note on the affected team page. Existing editorial prose, videos, generation IDs and order are untouched.

Release follows docs/release-contract.md and the existing Release integrity / Article image release gate / Promote verified production workflows. A draft PR, successful build or READY preview is not live verification. No formal PR review approval is submitted by this worker.

## Release QA recovery

Integrity runs 40872449383 and 40873468143 failed four LOOG document-navigation cases at `qa/tests/pwa-reading-navigation.spec.mjs:90`: the test required a published column over 300 characters, but Week 8 correctly rendered its 209-character awaiting-publication state. The test now validates the selected published headline/body when available (retaining the length requirement), or the exact awaiting-publication headline/body and paragraph count otherwise. The original >500px scrollable-height, navigation, viewport, reading-position and all other geometry assertions remain unchanged. No draft content was published and no gate was skipped. The recovered LOOG navigation cases pass locally at 390px and 360px using system Chromium; hosted pinned WebKit/Chromium gates remain authoritative.

Yahoo shared individual matchup labels now use their existing pregame calculation, matching the scorecard's zero-actual-score pregame presentation. Explicit provider finality and pending-closeout precedence remain unchanged; zero scores never imply a final result. The provider snapshot is timestamped pregame evidence, not a real-time freshness claim.

Hosted QA caught a second source-contract issue: `brief-sunday-engine?action=scores` returns only ok/source/week/updatedAt/matchups and drops the stored payload's season. A newer live envelope therefore displaced the complete local fallback and failed the roster season guard. `selectLoogScores` now retains the committed canonical LOOG season for that legacy seasonless envelope, while still rejecting an explicitly conflicting season. A regression test uses the exact endpoint envelope shape and newer timestamp; offline-only fallback validation did not cover this previously.
