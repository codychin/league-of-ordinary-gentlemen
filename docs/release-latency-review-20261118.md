# Release latency review: 18 November 2026

## Measured evidence

GitHub run 44217163137, jobs 134509763014 and 134510154304:

| Stage | UTC interval | Elapsed |
| --- | --- | --- |
| Media job | 01:37:06–01:37:56 | ~50s |
| Media dependency installation | 01:37:10–01:37:32 | ~22s |
| Integrity checkout | 01:38:40–01:43:37 | ~4m57s |
| npm ci | 01:43:39–01:43:46 | ~7s |
| Unit suite | 01:43:46–01:44:14 | ~28s |
| Production build | 01:44:14–01:44:32 | ~18s |
| Unmocked image suite | 01:44:33–01:45:16 | ~43s |
| Scored browser suite until failure | 01:45:17–01:49:32 | ~4m15s |

The failure was a missing Crates link on the actual Sunday Crew desktop home renderer, not slow tests. Earlier attempts separately failed at media installation and at a stale Culture navigation expectation. Optimizing installation alone cannot fix incomplete surface coverage.

## Isolated change

Run media preparation and integrity concurrently. The required article-image-qa aggregate job depends on both and explicitly requires each result to be success, plus the existing SHA/run/attempt/workflow identity. No test invocation, browser project, retry policy, credentials, promotion rule, or main verification is removed.

This removes media preparation from the integrity start dependency. It does not make checkout faster. On the measured run the theoretical overlap is about 50 seconds (runner availability permitting), not a promised multi-minute saving. On a slow package mirror it prevents that delay from blocking all unrelated UI feedback. Total Actions compute is not reduced and failed media may now overlap with integrity work.

Executable tests run the actual gate shell with failed, cancelled, skipped, missing and pending media results; each refuses otherwise-valid integrity evidence. Existing identity mismatch tests remain.

## Next changes, deliberately not bundled into the in-flight release

1. Measure current tracked media footprint and required build inputs before changing checkout. Do not blindly exclude media or rely on external restoration to preserve coverage.
2. Keep the new Crates surface contract from the navigation fix in the mandatory browser selection; cover global and edition home/newsroom, desktop/mobile and PWA.
3. Add a small first browser pass for changed navigation surfaces before the long general suite, without dropping the general suite. Keep the exact same built artifact.
4. Replace duplicated edition/global navigation definitions with a shared semantic definition in a separate UI-reviewed change.
5. Remove historical branch-name exceptions through separately reviewed tests and release-authority migration, not opportunistically during an incident.
6. Report stage durations and the exact failing surface in release status, rather than describing every delay as deployment.

Rollout: keep this change separate until the approved sitemap/navigation release completes. Rebase onto its final main commit, preserve the new Crates test selection, and run full hosted checks. Do not claim the optimization is live or a hosted speedup until that run completes.
