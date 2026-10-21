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
automatic retries conceal intermittent defects. Existing Node tests and GitHub
workflows remain independent and unchanged.
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

## Keeping expectations synchronized

Use `npm run editorial:publish` with an explicit approved editorial change and an
authored placement candidate. The command previews by default; `--write` updates
the placement, this manifest and approval history together. `editorial:check`,
Node tests and existing build checks fail on drift. See
[`docs/APPROVED-EDITORIAL-PUBLISHING.md`](../docs/APPROVED-EDITORIAL-PUBLISHING.md)
for approval fields, chronology, destinations and the non-mutating Marnie fixture.
