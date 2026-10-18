# Engagement analytics v1: staged, not activated

## Scope and activation gates

This change adds a dependency-free, explicit PostHog capture client. It uses PostHog's documented public event capture endpoint; it does not install/load the SDK or remotely downloaded code. Autocapture, session recording, feature flags, heatmaps, exception recording and person profiles are therefore not initialized. No website or account setup is implied by this document.

Activation requires the correct owner-controlled PostHog project, verified region/token, free-tier billing/limits checked in that account, approved privacy notice and production release approval. Do not generate personal API keys to complete this setup without required approval. A public ingest token is not an owner API credential. This change does not touch PR50, generation limits, Live Desk, schedules or editorial publication.

Set only on the authorized production build:
- NEXT_PUBLIC_BRIEF_ANALYTICS_ENABLED=true (absent/false is the kill switch)
- NEXT_PUBLIC_VERCEL_ENV=production (Vercel system environment, verified at build)
- NEXT_PUBLIC_POSTHOG_KEY=the project's public phc_ ingest token
- NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com OR https://eu.i.posthog.com for the actual project region

Preview/staging/local hosts never send, even if the enable flag is set. Tests use an injected mock transport, not live ingestion. Do not enable billing, add a card or expand paid services. A browser-side event limit is not a provider billing guarantee; verify account-side controls before activation. Keep the owner dashboard private; do not enable public sharing.

## Privacy and exclusion

Collection is OFF until the reader explicitly allows optional analytics through inline preferences at the foot of the page. Decline/withdraw removes the random local browser identifier and stops further capture. Earlier events are not retroactively deleted. DNT, Global Privacy Control, browser automation, preview query flags and staff/test exclusion are respected. Visiting /manage automatically marks that browser internal. Staff who do not use /manage must use the exclusion button on each browser before QA. This cannot identify every staff member across devices; document that operational step rather than claim perfect filtering.

Returning-browser measurement uses a random first-party localStorage identifier only after opt-in. No authentication/member ID, email, person name, page title, article text, click text, raw pathname/query/hash, referrer or media URL is sent. Global article identifiers are opaque, deterministic SHA-256-derived IDs; league-local article identifiers use the database UUID. Neither emits potentially identifying article slugs. An owner-side content lookup can translate IDs back to titles. Known correspondent and edition labels are allowlisted. Page categories replace team/matchup path details. GeoIP enrichment and person-profile processing are disabled; PostHog still receives the connection IP at the network layer. This is pseudonymous, not guaranteed anonymous.

The inline notice describes these choices. It requires owner review; it is not a legal opinion or a substitute for a reviewed site-wide privacy policy. Consent applies to this feature only, not existing external embeds.

## Event definitions

- page_view: one eligible, foreground page entry for non-article supported public routes. SPA pathname changes count; query/hash changes and React StrictMode remounts do not create a second view. A return through another route is a new visit.
- article_view: same rule for rendered article routes; not an additional page_view. Properties article_id, correspondent, league, page_type and visit_id. Unknown/missing local article IDs fail closed.
- article_read_time: additive active_seconds deltas (not cumulative values). Sampled every 5 seconds; only visible, focused, body-in-viewport time within 30 seconds of interaction, emitted at ~15 seconds and on hide/exit. A proxy for engaged foreground time, not proof of reading/comprehension. Last seconds may be lost when mobile processes are killed.
- article_scroll: each of 25/50/75/100 once per page visit, based on the article body bounds, not hero/comments/footer. This indicates exposure, not reading completion. Initial above-fold exposure is not counted until a scroll event.
- carousel_click: deliberate clicks on the three recent-story cards and roundup/also reel cards. Placement plus article_id or reel_id; does not establish card CTR without impressions, which v1 does not capture.
- reel_start: actual playing event on the visible, active reel element, once per mounted viewing; not poster click or preload. Muted autoplay still counts, so call this playback rather than intentional consumption.
- reel_complete: ended event after a captured start, once per mounted viewing. Seeking can reach the end; do not claim full watch-time completion. Hidden playback may finish after starting; account for that when interpreting.

All events have schema_version=1 and pseudonymous browser distinct_id. No SDK session property is invented. Native PostHog web-analytics dashboards may expect $pageview; use the custom-event dashboard/query definitions rather than interpreting empty default charts as no traffic.

## Owner evidence, not another dashboard obligation

Cody prefers Rika to explain what is performing and what is not. The private dashboard is a backing view for those explanations. No new recurring report or schedule is created here.

Each readout should give date window/time zone, article/edition, eligible views, distinct browsers, median active seconds per article visit (including zero-time views), 75% body exposure count/rate, return-browser counts, and a concrete observation. Compare like format/placement/age, not a 28-second reel against a long article. Show denominators. Under 20 article views, say sparse evidence rather than rank a winner; 20 is a caution threshold, not a significance test. Do not turn analytics into a mandate to imitate clickbait or flatten correspondent voices.

Consent, blocked requests, staff exclusions, cleared storage, multiple devices and mobile termination create missing data. These are opted-in browsers, not all readers or known people. Return-browser counts are observed on more than one date, not retention of identified members. Query time is not the same as page publication time. Article ID-to-title metadata can be joined inside owner tooling from the site's content using lib/analytics-metadata.js, not sent in visitor payloads.

## Acceptance and rollout

1. Focused tests, complete repo tests and Release integrity checks pass on exact head.
2. Full Next build passes. Inspect staging article controls at mobile/PWA/desktop widths; validate SPA navigation, back/forward, consent withdrawal, missing storage, privacy flags, foreground/hidden read time, per-body scroll, carousel and active/preload media separation using a mock collector. Staging must make zero actual PostHog requests.
3. Verify project access, free-tier spending limits, owner-only dashboard, and approval for configuration/release. Do not claim dashboard creation from the JSON definition alone.
4. After exact approved production release, use a designated QA browser with a tightly bounded approved test, inspect events in PostHog, then remove/exclude test data from reporting. A 200 HTTP response alone is not ingestion proof. Verify all three edition labels independently.
5. Turn enable flag off to stop future ingestion if needed; redeploy under existing release rules. No changes to generated content or score state.

Sources inspected: https://posthog.com/docs/api ; https://posthog.com/docs/getting-started/install ; https://posthog.com/docs/data/anonymous-vs-identified-events . Current account pricing/limits must still be verified before activation.
