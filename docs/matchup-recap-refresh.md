# Completed-week matchup writeups

Cody authorized automatic publication of text matchup recaps after Monday Night Football on October 14, 2026, for LOOG, Sunday Crew and DOGE4. This is separate from the video-script approval job.

## Publication contract

- Every completed pairing gets a developed, league-local correspondent recap on its individual matchup page. Revisit the original preview and preserve its correspondent when appropriate. Target 200–300 words in three to five real paragraphs; numbers support a specific human story. Never invent manager quotations, behavior, injuries or history.
- `data/matchup-recaps.json` is the append-preserving registry. Identity is `(season, edition, week, unordered teamIds)`. Store `kind: "recap"`, writer, headline, body separated by two newlines, editorialVersion and source evidence with final scores and capture time.
- `lib/select-matchup-column.mjs` chooses a recap only when provider finality is true, with exact edition/week/pair matching. Both the LOOG route and the shared Yahoo route use it. Missing final recaps show a pending message, never a prediction presented as a final account.
- Original previews remain in their existing source. Do not replace approved videos, move writeups onto the scores overview or change unrelated homepage sections.
- `app/matchups.css` supplies paragraph spacing for every league and screen size. Keep separate `<p>` elements.

## Scheduled execution

The ChatGPT automation **Publish matchup recaps** checks Tuesday at midnight and 1 AM America/New_York, with an 8 AM fallback for delayed provider finality. It is conditional: never finalize an active Monday game just because a scheduled time arrived. After a successful edition/week publication, later checks stop before generation. Do not create additional polling or media jobs.

Read the registry first, then establish the completed season/week and expected pairings. Reuse verified exact-week closeout evidence when available. Otherwise use Flaim session → league info → explicit-week matchups and player details (ESPN) or weekly rosters (Yahoo), plus resulting records. LOOG is ESPN 310731 on the Flaim Fantasy connection; Sunday Crew is Yahoo 470.l.197826 and DOGE4 is Yahoo 470.l.226614 on Home. Respect provider retry-after and report unresolved morning blockers. Never use projections as actuals or the next currentWeek as the completed matchupWeek.

Verify starter sums, scores, winners and league-local lore. Save evidence in a season/week-specific file and upsert only the relevant recap keys. Preserve previous weeks and approval history. Run applicable tests and build, publish through the existing main-branch release pipeline, then verify the production alias points to that exact commit and the actual matchup routes show the recap headings, final labels and paragraphs. A commit or READY unaliased deployment is not completion.

Week 5 uses the October 13 provider-final `data/week5-closeout.json`; all 36 starter sums reconcile. ESPN final scores were rechecked on October 14. Yahoo fresh reads on October 14 were rate-limited, so the saved final evidence was retained.
