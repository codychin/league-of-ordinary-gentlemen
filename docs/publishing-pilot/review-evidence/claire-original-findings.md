# Review of original PR81 head faaa10f3b998382e919f6d731ca57a73319413b2

Claire found three material gaps after the first local proof:

1. Article masthead/navigation/return links dropped the pinned preview revision. Existing browser navigation tests used the active baseline, so they could not expose mixed preview/active navigation.
2. Publisher state and request ID were recreated on mount. Reload/interruption lost operation continuity, and status required a manual check that misleadingly displayed publishing while checking.
3. Preparation and verification were operator/harness steps, not a demonstrated complete one-decision hosted workflow. Verification/rollback trigger and owner were insufficiently explicit.

These findings remain part of the evidence; the original six-group browser result did not test those behaviors. External-media blocking also means full visual parity is unproven. Allowlisted scenarios establish fixture semantics only, not generalized publishing.

Original-head CI: Release integrity run 40049714627 and Article image release gate run 40049714623 both succeeded. Their successful steps include normal `npm run build`, not just the earlier local compile. Those results do not certify a later revised head.

Original automatic previews initially remained BUILDING. A raw GET to the staging-project preview was blocked before reaching Vercel by the execution environment proxy (CONNECT HTTP 403); no bypass/access configuration was created. Final deployment status is tracked separately.
