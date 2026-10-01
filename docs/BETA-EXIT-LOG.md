# The Brief Product Beta Exit Log

Last updated: 2026-09-30

This file records deliberate beta shortcuts for the second-league pilot and the work required before The Brief can support self-serve leagues reliably.

## Product principle

**The newsroom is shared. The world it covers is personal.**

Brief canon is global: correspondent identity, voice, history, editorial standards, canonical media, and global journalism.

League context is private and tenant-scoped: managers, teams, standings, rosters, transactions, rivalries, jokes, preferences, and league history.

## Pilot architecture

### Data ingestion
**Beta approach:** Use Flaim Fantasy through the connected ChatGPT integration as the ingestion bridge for ESPN / Yahoo / Sleeper. Import normalized league data into The Brief's tenant tables manually or through editor-assisted workflows.

**Why:** Flaim already normalizes the three providers and avoids maintaining provider-specific integrations during product discovery.

**Known limitation:** Flaim's public remote MCP uses OAuth 2.1 + PKCE, but its current documentation states that remote OAuth callbacks must belong to supported AI apps. The Brief web app cannot currently run a generic production OAuth callback against Flaim without explicit Flaim support / callback approval.

**Exit beta when:** One of the following is true:
1. Flaim supports The Brief as an approved remote OAuth client / partner integration; or
2. Flaim exposes a server-to-server / delegated API suitable for our multi-tenant production app; or
3. We replace the bridge with first-party provider adapters (Yahoo OAuth, ESPN, Sleeper).

### Yahoo pilot
**Beta approach:** League owner connects Yahoo to Flaim at flaim.app. Editorial/product operator imports that connected league into The Brief.

**Exit beta when:** Yahoo league connection and refresh can be completed entirely inside The Brief onboarding without operator intervention.

### League refresh
**Beta approach:** Refreshes can be manually initiated during editorial/product operations and persisted into canonical Brief league tables.

**Exit beta when:** Each active tenant has scheduled, idempotent refresh jobs with retries, freshness monitoring, and provider-specific failure states.

## Multi-tenant data

Created:
- brief_tenants
- brief_leagues
- brief_provider_connections
- brief_league_members
- brief_league_teams
- brief_league_memory
- brief_publication_articles

The existing League of Ordinary Gentlemen is Tenant #1.

**Beta shortcut:** Current production homepage/articles still use existing hard-coded publication paths in several places.

**Exit beta when:** Public pages resolve content and league data through tenant-aware database records without requiring code commits for editorial changes.

## Editorial canon

Existing global sources:
- brief_correspondents
- brief_canonical_assets
- global editorial memory / newsroom guidance

**Beta approach:** Canon remains centrally controlled by The Brief. League-specific memory augments but does not overwrite correspondent canon.

**Exit beta when:** Generation workers deterministically compose:
1. correspondent canon
2. global editorial context
3. current-event packet
4. league memory
5. assignment

and preserve provenance for each layer.

## Articles and homepage

**Beta approach:** Existing LOOG articles may continue living in app/articles/data.js while second-league product flows are tested.

**Exit beta when:**
- articles are database-backed;
- scope is explicit: global / league / network;
- global stories can be referenced across tenant editions;
- homepage placement is data-driven;
- promoting a story to lead does not require a Git commit.

## Authentication and roles

**Beta approach:** Pilot can be operator-assisted; no need for polished multi-user auth before testing editorial value.

**Exit beta when:**
- tenant owner/editor/member roles are enforced;
- commissioner/editor access is authenticated;
- provider tokens are never visible to clients;
- tenant data isolation has tested RLS policies.

## Security

RLS is enabled on the new multi-tenant tables, with no public policies during beta.

**Beta shortcut:** Server-side service access will be used for controlled operator workflows.

**Exit beta when:** Tenant-aware authorization policies exist and have automated isolation tests.

## Onboarding

Target pilot flow:
1. Create league bureau
2. Connect league via Flaim-assisted setup
3. Select league
4. Confirm manager/team identity
5. Import current league facts
6. Capture league lore
7. Generate first edition
8. Editor reviews and publishes

**Exit beta when:** A commissioner unfamiliar with the codebase can complete this flow without operator intervention.

## Observability

**Beta approach:** Use Supabase/Vercel logs plus this debt log.

**Exit beta when:** Studio exposes:
- last successful provider sync
- data freshness
- failed jobs
- generation status
- publishing status
- retry controls
- per-tenant cost / usage

## Economics

**Beta approach:** Do not optimize prematurely. Track expensive generation workflows and manual interventions.

**Exit beta when:** We know:
- average ingestion cost per league/week
- average generation cost per league/week
- video/media cost separately
- operator minutes per league/week
- reasonable plan limits

## Pilot success criteria

The Yahoo pilot is successful if:
- League #2 imports accurately.
- The same Brief newsroom feels recognizably canonical.
- League-specific journalism feels native to that group's history.
- Global Brief articles can coexist naturally with local league stories.
- Weekly recurring surfaces can be produced without corrupting Tenant #1.
- The second manager can meaningfully edit / shape their bureau without touching production code for routine work.

## Current open decisions

- Whether Flaim can support The Brief directly as an approved production OAuth/MCP client.
- How much historical Yahoo data should be imported for initial lore generation.
- What minimum League Editor / Studio UI is needed for pilot partner #2.
- Whether pilot editions share ordinarybrief.com routing or use a separate beta path/subdomain.
