# Edition Parity Rules

These rules are mandatory when adding any league edition after the Sunday Crew pilot.

## 1. Reuse before recreation
If The Brief already has a component, CSS treatment, responsive rule, or interaction pattern, a new edition must consume the same implementation. Do not build a visually similar league-specific copy.

Examples:
- Scoreboards use the canonical scoreboard markup and classes.
- Transaction wires use the shared Schefter treatment.
- Franchise directories and dossiers use the canonical directory/team-page geometry.
- Site and app navigation must be edition-aware, not hard-coded to League #1.

## 2. Content scope is explicit
Editorial content has two scopes:
- global: intentionally shared across all editions.
- local: belongs only to one league.

Global is allowlisted. Local is the default. New stories must never propagate to another league unless explicitly classified global.

## 3. Shared people, separate histories
Correspondent identity, voice, methods, visual canon, and editorial growth are global.
Manager relationships, grudges, recurring jokes, receipts, favorites, antagonists, and league-specific referents are stored as league-local correspondent memory.

A writer must never inherit another league's people by default.

## 4. Missing local content gets an honest empty state
Never fill a missing Autopsy, Start/Sit, Reel, dossier biography, local article, or historical module with another league's content.
Use an intentional backfill/empty state until local material exists.

## 5. Live data is tenant-scoped
Scores, standings, rosters, transactions, matchup state, FAAB, draft/keeper context, and dossiers must resolve from the active league edition only.

No route, component, PWA tab, anchor, or fallback may silently return League #1 data.

## 6. Web and installed app must share layout rules
Responsive spacing, padding, card geometry, and typography should be common by default.
PWA-only overrides are reserved for actual app-shell concerns such as safe areas, fixed tab bars, and app navigation.

A layout correction should not be scoped to standalone mode unless the geometry truly differs there.

## 7. Native web navigation stays native
Ordinary mobile web should use normal route/hash behavior.
Custom tab-state and anchor interception belongs to the installed PWA shell only.

## 8. League #3 test
A third league is a successful portability test only if it can be added without:
- forking an existing presentation component,
- copying global articles,
- hard-coding league names or IDs into shared UI,
- leaking people/history from another league,
- introducing league-specific spacing or navigation patches.

If League #3 exposes a divergence, fix the shared abstraction rather than patching League #3 alone.
