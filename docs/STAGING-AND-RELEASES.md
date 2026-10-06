# Staging and releases

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
