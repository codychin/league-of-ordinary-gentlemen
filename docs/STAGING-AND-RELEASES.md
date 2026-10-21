# Staging and releases

## Reconciled baseline: October 21, 2026

- Production source: `7e84ccd2fb4e5ba3ab8fdac0dd73a9e06c70fb67`, verified on `www.ordinarybrief.com` at deployment `dpl_C7Yi3gsoixmdZVqU5oUTeuGuRrx4`.
- Prior staging, including the unpromoted desktop scroll navigation, is preserved unchanged at `backup/staging-before-production-reconcile-20261019` (`a7b6ecccf6c3d4aa1ef53e3bb7c6db4656b0e994`). No history was force-reset.
- Application content, layouts, routing, public assets, and release guards come from that production source. The only source overlay is QA isolation, environment labeling, a read-only release-health endpoint, frozen public data, and tests/documentation for those differences. No new navigation or other unfinished feature is included.
- The previous reconciled staging baseline is also preserved at `backup/staging-before-production-reconcile-20261021` (`47773ebbb8884bb6a03f11b6c8cf9040b95bd1dd`). Current production includes the approved Week 6 long-form recaps, homepage video shelves, and corrected text-only matchup layout.
- Public edition data, article lists, canonical player assets, score and detail responses were captured again on October 21. `data/staging-capture-manifest.json` records exact sources, capture times, and SHA-256 hashes. Upstream provider timestamps are retained; capture does not trigger refresh, ticks, or syncs.
- Comments, reactions, notifications, management/authentication and publishing remain disabled. Frozen scores do not continue updating; this environment is a safe source/content/layout baseline, not a live-backend replica.
- Keep new experiments on feature branches. Reconcile against the exact served production SHA before reviewing or promoting an individual feature; do not merge the preserved legacy staging branch wholesale.

## Staging-only editorial review: October 21, 2026

After the production-parity baseline, Cody approved staging “The Delicate Etiquette of a Sporting Pat” by Marnie Kells as the shared headline and moving West Virginia directly to the archive. This is an intentional staging-only editorial difference, not a production release.

- Shared headline: Marnie, “The Delicate Etiquette of a Sporting Pat”.
- Exact three-card row: Conrad’s medical-clearance column, Rams kicker, NFC East.
- West Virginia is absent from the shared homepage but remains in each edition archive at its unchanged article URL and with unchanged copy.
- New article URL in each edition: `/articles/marnie-delicate-etiquette-sporting-pat` with the applicable edition prefix.
- All other published league content, Week 6 video shelves, text-only matchup recaps and production source remain unchanged from the verified baseline. QA guards remain in place.
- PR58’s separate Conrad-lead browser manifest is not included or modified. Candidate-local regression tests assert this newly approved staging expectation explicitly; a pass against the older manifest is not expected for this editorial review.

## Environments

- Live project: `league-of-ordinary-gentlemen` (`prj_h89MCmxn3Mr3O0wRpnwstM917E0l`). Domains: ordinarybrief.com and www.ordinarybrief.com. Main branch.
- QA project: `ordinary-brief-staging` (`prj_7rg8CkADuyPW5Um3H2Ubu008X13G`). Domain: staging.ordinarybrief.com, assigned to the staging branch. Vercel Authentication protects ALL deployments including the custom domain.
- Team: `team_hU7RX1oX9Ea0W2U9ieHwNxzL`.
- QA URLs: `/`, `/sunday-crew`, `/doge`; add `?app-preview=1` for the app layout, or install the QA-named PWA from Safari.

## Current QA scope

Staging is a frozen, read-only frontend environment. LOOG content and completed scores are versioned in the repository; Sunday Crew and DOGE public edition payloads are captured in `data/staging-snapshot.json`. Existing published media remains read-only at its existing URLs. No production credentials are copied to the staging project.

Staging blocks mutations, management, onboarding, OAuth, media publishing, push sending, and score-engine ticks. Browser connections are restricted to the same origin. A server fetch guard rejects access to the production database, authentication, and functions. The staging banner and QA PWA names identify the environment. The staging origin isolates cookies, service workers, and caches from live apps.

Login, persisted comments/reactions, editorial writes, provider syncs, and live automation are NOT covered by this environment. Add a separate test database and test identities before testing these flows. Do not point staging at production to make them work. No paid generation or scheduled worker is provisioned here.

Refresh snapshots deliberately from the public edition read RPCs only, preserving the recorded capture timestamp. Never include provider tokens, credentials, auth users, notification subscriptions, or private tables in the repository. Freeze a snapshot for the duration of a QA review. Production-only database editorial updates remain a separate publishing path and are not gated by Vercel.

## Release procedure

1. Make software changes on staging or a feature branch. Run `npm test` and the staging build. Publish to the staging project and record the exact Git SHA and deployment ID.
2. Send Cody the relevant QA links and a short list of changes. Check all three editions, mobile web and app navigation, scores, teams, article media and archive. Never promote without explicit approval of that release.
3. Reconcile main changes before approval; if code changes after review, run QA again. Merge the approved source into main only when authorized. The production project has automatic custom-domain assignment disabled as of October 6, 2026.
4. Build a production candidate in the LIVE project without assigning domains (`vercel deploy --prod --skip-domain`). Verify its source SHA and production configuration, then smoke-test the candidate. Do not move a staging build to the live domain: it contains frozen data and disabled functionality. Separate environment configurations require a production build; the source release is the same, the compiled artifact is not.
5. Explicitly promote the verified production candidate after approval. Record previous and new deployment IDs, then verify live domains. Promotion may restore automatic assignment; set `autoAssignCustomDomains: false` again after each promotion so subsequent pushes cannot silently go live.
6. Roll back to the recorded previous deployment if needed; do not reset database content as part of a software rollback.

Never run a production promotion as an incidental step of staging setup or QA. A standing instruction to update staging is not authorization to release to live readers.

### Sporting Pat headline framing correction (October 21, 2026)

The homepage lead reuses the established `tourHero` / `sabinePackage` layout,
including the existing desktop grid and 520px minimum image/copy height. No
article-specific grid, square aspect ratio or smaller-width override remains.
The thumbnail is a faithful frame from approximately 6.333529 seconds of the
same CBS interview embedded in the article, not a photograph from another game:
https://x.com/NFL_DovKleiman/status/2112173112100069629 . The clean video-area
capture was 765×700 pixels; cropping 20 pixels from its top gives the 765×680
thumbnail. No synthesis, repositioning of people or retouching was performed.
CBS Sports broadcast credit remains on the article's original hero, which is
unchanged. Reuse rights have not independently been established.

Centered cover-crop simulations at 649×520 (lead), 337×170 (desktop card), and
280×150 (small card) retain both faces; the wider card intentionally trims the
upper cap. The article-specific image theme is shortened to “GOOD INTENTIONS”
so its caption-position simulation clears both faces even at the minimum 280px
small-card width. The title, subtitle and article body are unchanged. These are
crop simulations, not a claim that the story is already published in the carousel.
The three-card order, approved text and unlinked Oregon quotation are unchanged.
