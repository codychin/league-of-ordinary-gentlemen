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
