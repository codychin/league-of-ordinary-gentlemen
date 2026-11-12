# The Brief editions

One shared newsroom, explicitly scoped league records. Never copy another league's scores, player totals, manager lore, recaps or videos.

| Edition | Route | Provider key | League UUID | Flaim connection |
| --- | --- | --- | --- | --- |
| LOOG | / | ESPN 310731 | 65c573a0-535d-4edf-8332-2522ee13872f | Flaim Fantasy |
| Sunday Crew | /sunday-crew | Yahoo 470.l.197826 | 1146fb6b-b5ea-4981-93c2-790be3b993ab | Home |
| DOGE4 | /doge | Yahoo 470.l.226614 | 33707500-ac22-489e-ae65-0c11e2880ffc | Home |

All are season 2026. DOGE publication: The DOGE Dispatch.

## Shared implementation

- `lib/editions.js`: public route/identity registry; never credentials.
- `lib/edition-content.js`: local editorial configuration, approved reels and franchise notes.
- `app/components/editions`: shared Yahoo Home, Teams, Team, Matchup, Archive, Article and Newsroom renderers. Explicit route wrappers supply config.
- `MatchupCardGrid`: shared responsive scorecard with red actual scores.
- `StartSitOfWeek`: global retrospective block, updated once. Label origin league for examples.
- `SharedEditorialFront`, `CultureDesk`, `AlsoShelf`: shared global content. Global articles are allowlisted by `lib/editorial-scope.js` and rendered through edition-scoped URLs; other league stories return 404.
- PWA identity, navigation, install prompt and article return links stay inside each edition.
- DOGE has no approved recap video yet. Keep its reel list empty until script approval, generation and final video approval. Existing global article videos are shared.

## Data refresh

Use Flaim session context, then league info, then the correct league's standings, weekly matchups and each team's historical roster. Matchup week is distinct from current league week. Never use projected points as final scores. Reconcile lineup sums, W/L and cumulative PF/PA.

Yahoo public pages use `get_public_brief_edition(slug)` and the latest `brief_league_snapshots` per snapshot_type. Snapshot data is the provider envelope `{success:true,data:...}`. Types: info, standings, matchups, rosters (data is a 12-team array), transactions, history (data is `{weeks:[matchupPayload,...]}`). Append snapshots; retain history. Update `brief_leagues.settings.currentWeek/completedWeek` separately. Never replace current rosters with another league's rosters.

DOGE launch evidence: `data/doge-week4-verified.json`. Local Autopsy: `data/doge-autopsy.json`; franchise notes are in `lib/edition-content.js`. Sunday Crew's approved Autopsy remains its existing component. Refresh each explicitly during closeout. LOOG retains its established `app/teams/league-data.js`, `app/teams/data.js` and completed score snapshot; update all together until migrated separately.

Transactions: completed only. Preserve Yahoo dates; Yahoo does not return matchup-week attribution. Do not label the entire 14-day result as one week. Handle drop-only rows explicitly. Outbid claims are context, not separate posts.

## Existing bounded schedules (America/New_York)

- Sunday 11:45 p.m.: authenticated scores refresh across three editions; games can still be pending.
- Monday 11:30 p.m.: eighteen matchup recap scripts (six per league), persisted as league-scoped drafts for Cody's approval. Refresh verified completed-week data; conditional drafts if games remain open.
- Tuesday 8 a.m.: one global Start/Sit update, plus completed-week records and local Autopsy closeout.
- Wednesday 8 a.m.: each league's transaction feed.

Reuse these jobs. Do not create extra polling, enable live workers, generate paid media or send member notifications without the applicable authorization. Spoken-name rule: Tet McMillan. Keep existing pronunciation and voice canon.

## Push isolation

`brief-push?edition=doge` (or sunday-crew) scopes subscription, history and authorized send. Omitted edition preserves LOOG. Subscriptions/deliveries have edition_slug with existing subscriptions defaulted to LOOG. Each Yahoo edition registers its own scoped service worker, so enabling DOGE doesn't subscribe to LOOG. Sending still requires the existing private media key and article/image/homepage preflight. No sends occurred during onboarding. Delivery IDs are edition-prefixed. Never broadcast to all subscriptions for a local release.

## Onboarding another edition

Add registry/config and thin route wrappers, tenant/league records, verified snapshots, scoped PWA worker/manifest, and push allowlist/URL constraint. Backfill local evidence and write original local findings. Include it in existing schedules. Verify all routes, data reconciliation, other-edition article rejection, draft exclusion and notifications before launch. Never expose provider credentials in snapshots or client config.

## Week 5 closeout, October 13

`data/week5-closeout.json` preserves the final authenticated Week 5 matchups, all 36 reconciled lineups and provider standings. ESPN and Yahoo finalized every Week 5 matchup before the Tuesday closeout; all three tables now cover five games. `data/latest-loog-scores.json` and `data/completed-loog-scores.json` are the same verified Week 5 final. `data/week5-autopsies.json` feeds the three league-local Autopsies with final language, and the global `StartSitOfWeek` component contains the shared LOOG retrospective.

Yahoo closeout snapshots are append-only: info, standings, final matchups, twelve historical Week 5 rosters and a history payload retaining Weeks 1–5. League settings now read `currentWeek: 6` and `completedWeek: 5`. LOOG static records, PF/PA, history, roster aggregates and final score fallbacks advance together. Preserve this evidence when Week 6 begins; never infer a final from a Yahoo leader before `status: final` or from ESPN before a non-`UNDECIDED` winner.

## Week 9 closeout, November 10

`data/week9-loog-final-evidence.json` preserves the authenticated final Week 9 scores, standings and all twelve exact-week lineups from the shared closeout run `tuesday-closeout-20261110-week9`. `league-data.js`, both score fallbacks and `week9-loog-rosters.json` use that snapshot. `data.js` derives current records, totals and latest results directly from `leagueSnapshot`; its editorial franchise history is unchanged. The prior completed snapshot and corrected scores are retained in `week8-loog-snapshot.json` and `week8-loog-scores.json`.

The provider calendar has advanced to Week 10, but the completed Week 9 view remains selected through Wednesday, November 11 in America/New_York (until November 12 at 05:00 UTC). Historical team results, cumulative PF/PA, starter/bench totals and position totals include Week 9 exactly once. Individual player starts and points while rostered remain explicitly labeled through Week 5 because later full roster histories are not yet verified; do not derive those values from ESPN's season-stat aggregates. Team 11 now uses its provider name, New Team Name, while retaining the `lloyd-rings` franchise route and historical records.

## Week 10 rollover, November 12

`latest-loog-scores.json` advances to the authenticated Week 10 pairings and actual zeros. `completed-loog-scores.json` and `league-data.js` remain the complete Week 9 record, so cumulative totals, historical results and verified final player totals do not get relabeled as Week 10. `week10-loog-selected-lineups.json` supplies the separately labeled selected Week 10 roster; no individual score is inferred from season stats. The matchup page can now request current exact-week details beyond Week 9.

Both Yahoo Week 9 final snapshots are preserved in `week9-edition-archives.json`, alongside the unchanged Week 8 archive. Exact-week matchup links use those corresponding scores, standings and rosters rather than the newly rolled-over current data. No editorial or media approvals are changed by this data rollover.
