# Change-aware staging checks

The initial independent-change lane applies only to pull-request validation. It
avoids the real-media preparation job for an explicit set of navigation, sitemap,
robots, and README inputs. It does not label media as tested: the aggregate
accepts a skipped media job only with a successful same-SHA/run/attempt/workflow
classification from this dependency graph and only on a pull request.

Unknown paths, shared modules, media, manifests, application content, dependency
or lockfile changes, workflow/classifier/test changes, deletions, renames, missing
bases and incomplete diffs run the existing full checks. All main pushes and
manual runs retain full media validation. There is no repository-wide filename
denylist pretending to prove transitive independence.

The allowlist is a media-preparation dependency boundary, not a UI exemption.
The integrity job still builds the actual application and runs existing unit and
browser checks. Branch protection, production promotion, exact-SHA checks,
serialization, credentials, and rollback behavior are not changed.

## Pilot and limits

Changing this policy runs full validation. Once it is reviewed, an independent
navigation/sitemap change can exercise the skip path. The selector's local tests
also exercise independent changes, mixed media changes, unknown shared
dependencies, malformed diffs, deleted/renamed files, and non-PR events. Aggregate
tests reject missing/stale selection evidence, unsuccessful dependencies and
production skips.

This is a bounded first improvement, not a claim that staging is now fast.
The integrity job still checks out media and runs broad browser coverage; its
pretest/build scripts currently require historical media reconstruction. Reducing
that checkout needs a separately verified source/media split, not silent removal
of assets. Representative hosted timings and preview readiness must be recorded
before claiming an end-to-end improvement. Production promotion remains subject
to the owner's UI validation; do not merge a pilot just to trigger auto-promotion.

## Discovery-only source lane

A PR changing only app/sitemap.js, app/robots.js and/or lib/public-sitemap.mjs
uses a source-only checkout and compiled actual route contracts. The esbuild
test imports the real sitemap and robots exports against canonical article data,
and verifies inventory/exclusions, canonical origin, duplicates and robots.
It rejects unexpected external runtime dependencies. Tests execute directly,
not through npm test and its unrelated historical-media pretest.

This lane deliberately does not build a local stripped-media application or
claim to have tested media playback or the UI. The ordinary Vercel preview build
is unchanged and retains all assets; its completion is independent of these
source-contract checks. Navigation, article copy, unknown changes, main pushes
and manual runs still retain full application/browser validation. Do not promote
until the owner has reviewed the complete preview.
