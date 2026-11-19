# Change-aware staging checks

These lanes apply only to PRs. Main pushes, manual runs, incomplete diffs,
deletions/renames, unknown/shared/dependency/media changes and changes to this
policy retain full validation. The allowlist is intentionally narrow.

## Lanes

- Discovery: only sitemap/robots/public-sitemap inputs. Small source checkout,
  compiled real route contracts against canonical inventory, no stripped-media
  application build or UI claim. Unexpected runtime dependencies fail contracts.
- Navigation: explicit SiteNav, EditionSiteNav, useCompactMobileNav and
  reader-navigation CSS inputs, optionally discovery inputs. Sparse source plus
  verified complete media, normal build, relevant real browser contracts.
- Audited copy: modified newsroom-ai-apology JSON article, optionally discovery.
  Parse old/new without execution. Only existing title/dek/plain paragraph text
  may change; body shape, metadata, embeds, media and signatures are fixed.
  Complete-media build and actual article browser layout across editions,
  viewports and color schemes.
- README: may skip independent media preparation, retains full integrity.
- Everything else: full integrity and media preparation.

Required aggregate accepts skipped media only with explicit successful same-SHA,
run, attempt and workflow classification/integrity evidence, and only on a PR.
Failed/cancelled/missing/stale evidence fails closed. Failed-only reruns cannot
reuse successful evidence from another attempt: rerun all dependencies together
or start a complete new run. Do not weaken this safeguard.

## Media cache

Cache only tracked public/reels, public/reels-hls and media-sources inputs. Key
uses exact three Git tree IDs, object format and schema version. No partial key,
Git directory, credentials, dependencies or generated build output. Verify every
file against its Git blob identity; reject missing/extra files, unsafe paths,
modes, links and corruption before candidate application code executes.

Miss/corruption clears only fixed owned media paths, hydrates exact Git checkout
and verifies again. Unsafe parent symlink fails closed without deleting target.
Restore/verify/save is serialized before npm/build. Immutable keys plus byte
verification, not cache hits, establish identity. Concurrent saves are harmless.

Main uses lookup-only and NEVER restores PR archives. It verifies full checkout
before potentially seeding default-branch cache. Branch isolation is retained.
That seed path has not run on main yet; cross-PR performance is not promised.
Eviction/misses fall back to verified Git hydration. No quota/billing changes.
Observed usage after pilot: 4,426,193,474 bytes/two entries, previously
144,478,330 bytes/one entry.

## Hosted pilots, 2026-11-18

| Lane | Total through aggregate | Run |
| --- | ---: | --- |
| Discovery | 86s | 44357209363 |
| Navigation cold | 13m08s | 44362258963 |
| Navigation warm, same PR | 7m50s | 44364741438 |
| Audited copy warm, same PR | 2m18s | 44367095002 |

All passed; pilot PRs178/179 closed unmerged. Cold hydration/verification took
5m21s and save22s; warm restore30s plus verification5s. Navigation browser suites
remain about5m40s. Copy build16s plus18 real browser cases13s. These are observed
samples, not guarantees that all staging changes are fast.

First copy pilot caught formatting-dependent mutation fixtures and failed closed.
Fixtures now canonicalize their own JSON; actual source is independently tested.
All74 copy canaries pass with compact/two-space/four-space formatting. Cache
corruption/miss/unsafe-parent fallback has deterministic local fixture tests;
real cold hydration and warm4.3GB restore were exercised on GitHub.

## Preview/release boundary

Vercel independently builds a complete-media preview, observed around7min, not
86s/138s. No assets omitted to make preview fast. HTTP validation does not imply
native playback or owner UI acceptance. Canonical staging ignores pilot branches
and was not promoted. Production workflow, branch protections, SHA gates and
protected-preview authentication remain unchanged. Owner UI review precedes
merge/promotion.

Full-policy run44362718284 passed. At bd12af25, full application/unit/build/browser
integrity passed in44367051488 but Ubuntu FFmpeg install timed out before media
tests, correctly failing aggregate. Exact complete Vercel preview READY in6m53s;
authenticated sitemap/archive/article/current-HLS-manifest returned200. Bootstrap
reliability follow-up must be verified; that failure is not a media-test pass.
