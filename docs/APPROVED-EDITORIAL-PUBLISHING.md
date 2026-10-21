# Approved editorial placement and QA manifest maintenance

Shared homepage placement changes must use the approval transaction below. The
publication command reads an explicit human-approved JSON change and an authored
JSX placement candidate. It validates them together, installs that placement,
updates `qa/editorial-release.json`, and appends the historical approval record in
one local change set. It does not generate editorial copy, infer approval from a
site, commit, push, publish, call a model, or deploy.

The authored candidate is required because the existing JSX contains reviewed
imagery, captions, crops, video and bylines. Selecting a slug must not fabricate
those presentation decisions. Author the candidate separately from the active
`SharedEditorialFront.js`; the command copies it into place only after validation.

Use the existing Node 22 CI runtime (22.18+), or Node 24.11+, for the parser tooling.

## Procedure

1. Author any approved article/catalog additions and global routing allowlist
   additions in the review branch. Preserve existing article slugs and copy.
   Prepare the candidate `SharedEditorialFront.js` in a separate file. If a story
   moves to Culture, prepare a candidate `CultureDesk.jsx` too when necessary.
2. Run `npm run editorial:inspect`. This checks the current approved baseline and
   returns SHA-256 preconditions for the current manifest, placement, Culture
   source, catalog metadata, scope allowlist and approval history. Copy the
   returned `expected` object into the approval input. These hashes prevent stale
   publication; they do not grant approval.
3. Record the editor's explicit approved selection, destination decisions and
   approval reference in the structured input. Never derive approval from
   matching rendered content, screenshots, a staging URL, or a successful test.
4. Preview without writing:

   ```sh
   npm run editorial:publish -- --change /path/approved-change.json --placement /path/SharedEditorialFront.candidate.js
   ```

   Add `--culture /path/CultureDesk.candidate.jsx` if needed. Dry run is the default.
5. After reviewing the plan, repeat that exact command with `--write`. It installs
   placement, manifest and history together; Culture source is included when
   supplied and changed. Include all those files, plus the separately authored
   article and scope additions, in the same reviewed Git commit/PR.
6. Run `npm run editorial:check`, `npm test`, the normal build and browser QA
   against the intended staging release. A local transaction is not a release.
   Follow `docs/release-contract.md` for existing approval/release steps.

`npm test` checks manifest/implementation/history agreement. The check is also
included in the existing build-blocking global-routing test file, so the current
build and CI fail on placement drift without changing production workflows or
release scripts. No automated CI publication or deployment is added.

## Structured input

```json
{
  "schemaVersion": 1,
  "id": "unique-approved-editorial-change-id",
  "approval": {
    "status": "approved",
    "approvedBy": "Editor name",
    "approvedAt": "2026-10-21",
    "reference": "Explicit approval reference or reviewed PR URL",
    "environment": "staging"
  },
  "editions": ["loog", "sunday-crew", "doge"],
  "lead": {"slug": "approved-lead", "title": "Exact catalog title"},
  "carousel": [
    {"slug": "first-card", "title": "Exact catalog title"},
    {"slug": "second-card", "title": "Exact catalog title"},
    {"slug": "third-card", "title": "Exact catalog title"}
  ],
  "destinations": [
    {"slug": "displaced-story", "title": "Exact catalog title", "destination": "archive"}
  ],
  "chronologyOverrides": [],
  "expected": {
    "manifestSha256": "COPY_FROM_EDITORIAL_INSPECT",
    "placementSha256": "COPY_FROM_EDITORIAL_INSPECT",
    "cultureSha256": "COPY_FROM_EDITORIAL_INSPECT",
    "catalogSha256": "COPY_FROM_EDITORIAL_INSPECT",
    "historySha256": "COPY_FROM_EDITORIAL_INSPECT",
    "globalScopeSha256": "COPY_FROM_EDITORIAL_INSPECT"
  }
}
```

`approvedAt` accepts an ISO date or UTC timestamp. `environment` records staging
or production editorial approval; neither value triggers any remote action. The
record is an audit trail, not a cryptographic identity/authorization mechanism.
Human review must establish that the stated approval reference is legitimate.

Every former lead/card omitted from the new top four needs an explicit destination.
Removing another overflow story also needs one. Destinations are `overflow`,
`culture`, or `archive`. The candidate must actually implement the destination:

- `overflow`: a single corresponding story remains below the row, with its exact
  catalog title and no separate Culture occurrence.
- `culture`: a Culture-classified article is present in Culture for all affected
  editions and absent from the shared editorial front.
- `archive`: the story is absent from the shared front and Culture. The existing
  archive derives all articles from the catalog, so its article and globally
  scoped routes must remain available in every edition.

This workflow manages the shared global front. All three editions must be explicitly
listed; partial-edition changes fail rather than silently changing other editions.
League-local placements remain outside this command and cannot be promoted into
shared slots without catalog and explicit global-scope registration.

New slugs must exist in the local article catalog, all new/reassigned titles must
match exactly, and lead/carousel order must match the candidate JSX. The parser
reads metadata and JSX statically; it never imports or executes application code.
Unsupported/dynamic markup is rejected rather than guessed.

Unchanged overflow stories keep their relative order and exact copy/media markup.
No new newest-to-oldest publication-date inversion is allowed without an explicit
`chronologyOverrides` entry `{ "before": "slug", "after": "slug", "reason": "Approved reason" }`.
Culture ordering is checked too, and its retained stories cannot be silently
reordered or rewritten. Explicit overrides remain in the approval history.

## History and adoption exceptions

`qa/editorial-approval-history.json` contains an append-only, SHA-256-linked record
of each approved release, displacement input, resulting placement and manifest.
The existing Phase One Conrad lead/card approval is retained verbatim as the
initial record. Existing historical rotation documentation is unchanged.

Workflow adoption preserves, without re-approving or correcting:

- Six existing homepage and two Culture publication-date inversions.
- Two overflow display-title variants: Watson and Jameis add final periods that
  are absent from their catalog titles. These frozen historical displays cannot
  be used as new lead/card titles or new displaced-overflow titles.
- The pre-existing uncatalogued `kraft-sheeran-roster-overhaul` Culture entry.
  It remains frozen; this global-catalog command cannot newly publish or move it.

These exceptions are explicit in the initial audit record. They do not authorize
new inconsistencies. Approval-history editing, title/slug drift, lost global
routes, unrecorded removals and manifest/implementation mismatches fail checks.

Writes use an exclusive local lock, prepare all replacement files first, recheck
preconditions, validate the result, and restore original bytes on replacement or
validation failure. A process or machine crash during multiple filesystem renames
is not a database transaction: run the check and restore/reapply the complete
reviewed change set before publishing. Never delete a live publisher's lock;
inspect an abandoned lock after a crash before recovering.

## Staged Marnie: non-mutating regression case

`tests/fixtures/editorial/staged-marnie.json` and `staged-marnie-front.jsx` record
PR #60's approved staging scenario at
`a89e1fb4a99b9150fc2a3c5fff4832697c6e8da7`: Marnie leads, Conrad/Rams/NFC East occupy
three cards, and West Virginia goes directly to archive.

Tests load only its catalog metadata and exact placement source into disposable
local copies, preview the change, and verify no managed file changes. The fixture
is marked `testOnly: true`; `--write` rejects it. Marnie is not added to the active
article catalog, homepage, QA manifest, staging branch or deployed site by this
work. Transactional write/rollback tests use a separate synthetic approval in a
disposable copy. No live staging content is an approval source.
