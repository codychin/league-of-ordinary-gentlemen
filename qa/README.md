# Phase One browser QA

Run an existing local server in one terminal (`npm run dev`), then explicitly
select its origin in another:

```sh
QA_BASE_URL=http://127.0.0.1:3000 npm run qa:browser
QA_BASE_URL=http://127.0.0.1:3000 npm run qa:browser -- --project=desktop
```

For staging, supply its HTTPS origin instead. No server, deployment, publishing
workflow or promotion is started by these tests. Production's known public
hostnames are rejected. Only target local/staging origins you control; aliases
cannot be classified automatically. A protected staging site needs access set up
separately; Phase One does not accept credentials or configure bypasses.

Prerequisites: `npm ci` and, if Chromium is absent,
`npx playwright install chromium`. No additional runtime dependency, API key,
paid service or model call is introduced. Existing public pages may fetch their
normal external data, images and embeds; asset verification needs network access.
The test suite performs navigation and asset reads, not editorial mutations.

## Coverage and expectations

`editorial-release.json` describes the shared lead and ordered three-card row for
LOOG, Sunday Crew and DOGE. Cody Chin approved this lead and card order for
staging integration; the approval and historical October 6 placements are recorded in
`docs/HOMEPAGE-ROTATION.md`. Future expectation changes require editorial approval.

The suite checks the lead/row order and adjacency, card reachability and document
overflow at 1440, 390 and 360 pixels. It visits all four manifested articles in
every edition, checks exact headings and substantive bodies, and rejects missing
story placeholders. Image audits cover displayed image elements (including lazy
ones triggered through native scrolling), computed CSS background layers including pseudo-elements,
video posters, and branded image fallback elements. Decode attempts have a 12s
bound; failed or pending assets fail the test. Hidden tab content is excluded.

Uncaught page exceptions and major console errors (hydration, React errors and
JavaScript exception types) fail every site test. Other console resource messages
are not automatically treated as major JavaScript errors. Framework specs inject
broken/pending images, CSS backgrounds, fallbacks and JS errors to validate the
detectors independently of live content.

## Reports

- `qa/reports/browser-html/index.html`: HTML report (`npx playwright show-report qa/reports/browser-html`).
- `qa/reports/browser-results.json`: machine-readable Playwright results.
- `qa/test-results/`: failure screenshots, traces and diagnostic attachments.

Image audits and JavaScript error arrays are attached to individual test results.
Generated reports are ignored by Git. Exit status is nonzero for failures; no
automatic retries conceal intermittent defects. The full Phase One suite remains
independent; the focused article-image release check is integrated as described below.
Machine-specific monitors and the earlier standalone diagnostics are not included.

Phase One does not automate editorial approval, complete overflow chronology,
all archive routes, video playback, visual crop quality, installed-PWA behavior,
Safari/Firefox, deployed SHA identity or production readiness. A local pass is
not a staging or production release verification.

## Integration branch deployment guard

`vercel.json` disables Git deployments only for `qa/phase-one-staging-integration`,
so publishing this review branch does not create a preview deployment. Main,
staging and all other branches keep their default behavior. No release workflow
is modified. Test existing immutable staging URLs rather than deploying this PR.

For protected staging verification, use separately managed temporary authentication;
never commit cookies, share URLs, private configuration or authentication state.
Disable traces when using such state so credentials cannot enter shared artifacts.


## October 21 approved production expectations

Cody approved promoting reviewed staging source
`dd97d613eef52a541a318f4b22ceef9e5486a560` to production at 13:02 UTC.
The existing v1 manifest now records Marnie as lead, Conrad/Rams/NFC East as the
ordered three-card row, and West Virginia as archive-only. Historical approvals
remain in `docs/HOMEPAGE-ROTATION.md`. PR #62 is not included or modified.

The unchanged Phase One browser framework remains explicitly targeted to local
or staging origins; its production-origin safety guard is not weakened.
`tests/editorial-release-manifest.test.mjs` asserts manifest/source agreement.
`tests/marnie-sporting-pat.test.mjs` asserts the reviewed image, normal headline
template, GOOD INTENTIONS label, original article hero, Oregon unlink and 20px
 desktop / 18px mobile lead subtitle. Image/typography fields are not added to the
placement-only manifest schema. Browser test discovery is not a browser pass.

## October 23 article-image production gate

Owner approved integrating the existing six article-image geometry cases into
Release integrity (Sentinel_3f3e0e6902b08191857daf5a7b5bc45b, 2026-10-23 16:49 UTC).
After unit tests and the build, that workflow starts its local app and runs
`qa/tests/article-image-framing.spec.mjs` at desktop 1440 and mobile 390/360 widths.
The Washington and Marvin Harrison heroes must load, preserve their natural
aspect ratios within the existing 2.5% tolerance, and not use `object-fit: cover`.
These assertions and the production-origin safety guard are unchanged.

The step is mandatory: startup timeout or any browser-test failure fails Release
integrity. Existing automatic promotion requires that exact main push workflow
to succeed. Reports upload even on failure. The separate article-image workflow
remains useful independent reporting, not the promotion prerequisite.
`tests/article-image-release-gate.test.mjs` checks the wiring and uses isolated
stub commands to prove browser-command failure propagates (no broken app deployed).

This is not a required-merge rule and does not constrain manual platform
promotion. Repository security settings are unchanged. Editorial placement
manifest values are unchanged because this update changes validation, not content.
A passing gate is not proof of production alias assignment or physical-device QA.
