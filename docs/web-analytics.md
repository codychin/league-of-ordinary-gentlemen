# Minimal pageview analytics

`@vercel/analytics` 2.0.1 is mounted once from the root layout, only for the live
project's production build. `VERCEL_ENV`, `VERCEL_PROJECT_ID` and `NODE_ENV` must
match; staging flags disable it. No environment values, credentials, dashboard
settings, or billing settings were changed by this implementation.

Only `/`, `/sunday-crew`, `/doge`, and their `/articles/<slug>` URLs pass
`beforeSend`. Each edition URL stays separate. The Next adapter owns navigation
tracking; `route` is the actual pathname so articles do not collapse into `[slug]`.
There is no second manual pageview call. Query-only and fragment-only navigation
do not count as new pages. Query strings and fragments are removed from event
URLs. Do not put names, tokens, emails or other secrets in public URL paths.
Management routes already use a no-referrer policy. This adds no custom events,
identifiers, cookies, funnels, PostHog, Speed Insights or paid add-on.

Vercel's ordinary dashboard supplies pageviews and estimated visitors, based on
its standard request-derived hash with a 24-hour lifespan, not persistent person
IDs. It cannot identify Cody or retroactively subtract his visits. Browser or
network blocking also affects counts. Leave dashboard sharing disabled; there is
no public stats endpoint or embedded dashboard.

## Cody's exclusion

Open `/analytics-preferences` on the actual domain, in each browser/profile/device
and from inside each installed PWA. Click **Exclude this browser** and verify the
status says excluded. This is an unlisted, noindex preference page, not a private
server-side account or an analytics dashboard. Its state is stored locally only.
It and other non-reading routes are not counted.

The key is `brief.analytics.opt-out`, value `1`. The preference is read before
every pageview, including in existing tabs. Each origin has its own storage;
www and non-www may differ unless redirects consolidate them. Profiles, devices
and private windows are independent. A PWA may share storage or use a separate
container: verify it inside the app rather than assuming. Clearing storage resets
it. A storage-read failure suppresses pageviews; a storage-write failure is shown
instead of falsely claiming the preference saved.

## Release and activation handoff

1. Recheck current main and preserve the merged PR95 article. This branch began
   at `f6d694e80f2da58c4d4c4fd3e68b3618a58a8050`. No article content changed.
2. Use the normal isolated PR/release checks. No formal PR approval review is
   authorized by this task. Preview builds intentionally send no analytics.
3. In Vercel, select The Brief live project
   `prj_h89MCmxn3Mr3O0wRpnwstM917E0l`, open **Analytics**, and click **Enable**.
   Do not select Web Analytics Plus or Speed Insights. Keep dashboard sharing off.
4. Deploy the reviewed main commit through the existing production process.
   Vercel creates analytics intake routes on the next deployment. No new secret
   or client API key is required. Verify Vercel's system environment variables
   are present: otherwise this integration intentionally remains off.
5. In a non-excluded browser, verify one intake pageview for homepage → article →
   back, with actual article paths and no query/fragment data. In each of Cody's
   excluded browsers/PWAs, verify no pageview intake requests on initial load,
   reload, and SPA transitions. Script download alone is not a pageview.
   SDK 2 may use Vercel's generated resilient-intake URLs, so inspect script data
   attributes/network requests rather than checking only `/_vercel/insights`.
6. Confirm the private Analytics dashboard shows distinct article URLs and homes,
   pageviews and visitors. Local tests do not prove production receipt or dashboard
   aggregation. No production or installed-device verification is claimed yet.

## Cost and notification

Latest owner instruction: $5/month is a notification threshold, **not a cap**;
collection should continue above it. Pro is $0.03 per 1,000 events before shared
credits. Approximately 166,667 events corresponds to $5 of gross analytics usage;
credits and billing rounding affect the actual bill. Do not pause the site or
configure a teamwide hard stop. No recurring monitoring job was created.

The release coordinator must verify a supported existing billing/monitoring route
for notifying Cody. A team-wide Spend Management alert is not an analytics-only
threshold and must not be represented as one. No analytics-specific $5 alert has
been configured or verified by this patch. If the available UI/tools cannot
create it, report that limitation and seek approval before adding a recurring job.

## Local verification

- `npm test` includes production/preview/staging gating, SSR, event allowlisting,
  query/hash removal, opt-out changes, malformed URLs and blocked storage.
- `npm run build` validates the entire existing production build pipeline.
- To simulate collection locally, build and start with `VERCEL_ENV=production`,
  `VERCEL_PROJECT_ID=prj_h89MCmxn3Mr3O0wRpnwstM917E0l`, and
  `VERCEL_GIT_COMMIT_REF=main` (the latter satisfies the existing build guard).
  These are command-local test inputs, not a remote deployment or changed branch.
- Run `QA_BASE_URL=http://127.0.0.1:3100 QA_ANALYTICS_ENABLED=1 npx playwright test
  --config qa/analytics.config.mjs`. The local-only test uses installed Chromium
  (`QA_CHROMIUM_PATH` can override `/usr/bin/chromium`). It intercepts the intake
  script with a small test double, exercising the real SDK's queued callbacks
  and pageviews. All external browser requests are blocked. It verifies SDK
  auto-tracking is disabled (preventing manual/automatic duplicates), SPA/back
  navigation, URL-specific routes, independent browser contexts, reloads and tabs.
- Build with `VERCEL_ENV=preview`, start locally, and run the same command without
  `QA_ANALYTICS_ENABLED`. The exclusion test verifies no analytics script mounts.

Official docs checked October 29, 2026:
- https://vercel.com/docs/analytics/quickstart
- https://vercel.com/docs/analytics/package
- https://vercel.com/docs/analytics/redacting-sensitive-data#disabling-tracking
- https://vercel.com/docs/analytics/privacy-policy
- https://vercel.com/docs/analytics/limits-and-pricing

Recorded checks for this branch: 279 Node tests passed; full production build
passed; two production-simulated Chromium tests passed. The optional complete
league-homepage test is gated by `QA_EDITION_DATA_READY=1`: attempting it here
failed because the existing edition data service was unreachable
(`dnzdbqycuuoonewcowis.supabase.co`, DNS/connect timeout). No credentials or
network settings were changed to work around that. URL filtering for all three
editions is covered by the passing unit tests. Actual installed PWA storage
behavior still requires checking on Cody's devices.

The full preview build also passed. The local preview browser check passed after
hydrating the preference control and navigating home: no analytics script was
mounted. Production-only tests were intentionally skipped in that preview run.
