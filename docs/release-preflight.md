# Offline release preflight and per-file resume receipts

This helper checks supplied evidence; it does not contact providers, grant permission,
start renders, upload, publish, or promote. It cannot prove an approval card was visible,
control reviewer context, establish account access, or guarantee future service availability.
It is not automatically wired into external tools: operators must run it before those actions.

## Before paid work and again before release writes

Run `node scripts/operations/release-preflight.mjs check snapshot.json` with a fresh
read-only snapshot (maximum five minutes old). Exit 1 blocks incomplete evidence,
main mismatch, contaminated task kind, or a pending writer. Re-read immediately before
the actual mutation; offline evidence cannot prevent a subsequent race.

```json
{
  "version": 1,
  "observedAt": "2026-10-23T21:00:00Z",
  "taskKind": "engineering-release",
  "expectedMain": "213e900f7ed9da9fe0348dff4fea7bb8b7ab32c9",
  "currentMain": "213e900f7ed9da9fe0348dff4fea7bb8b7ab32c9",
  "releasePath": {
    "assetUpload": "verified",
    "previewVerification": "verified",
    "productionPromotion": "verified"
  },
  "workflowScanComplete": true,
  "workflows": [{"id": "40027334542", "status": "in_progress", "writesReleaseState": true}]
}
```

The example intentionally fails on the active writer. `verified` means the operator has
evidence that an existing supported access path works, not a promise or requested approval.
Inspect workflow definitions as well as all pages of active runs; classify unknown writers
as unknown (omit `writesReleaseState`) to block. Include any workflow that can write release
assets, main, or production aliases, including workflows outside this repository. This is
not a substitute for mandatory staging playback, exact SHA/READY, promotion authorization,
domain verification, or the existing release contract.

## Hash, record immediately, then resume by remote read

1. `node scripts/operations/release-preflight.mjs hash path/to/asset` produces byte size,
   SHA-256, and the deterministic Git blob SHA for those exact bytes. Repackaged HLS requires
   new hashes even when filenames are unchanged. Preserve original render hashes separately.
2. After **each** remote blob read confirms the expected SHA, create evidence containing
   `releaseId`, `repository`, intended `targetRef` (for example `refs/heads/week7`),
   relative repository `path`, `identity` from step 1, and
   `remote: {"status":"found", "sha":"…", "observedAt":"…"}`. Run
   `node scripts/operations/release-preflight.mjs record evidence.json /durable/receipt-directory`.
   It writes, fsyncs, atomically renames, and fsyncs the directory before returning. The caller
   must retain/back up that directory outside ephemeral session storage before the next asset.
   No local filesystem helper can guarantee survival of loss of the entire executor.
   Receipts explicitly have `scope: "git-blob-only"`: they prove only that the operator
   read matching blob bytes, not that a file is reachable at a branch, committed, deployed,
   or live. The target ref is intended destination metadata and separates receipt keys;
   after assembling the tree/commit, independently read the exact immutable commit's tree
   and compare every path/blob SHA before moving any branch. Retain that commit separately.
3. On resume, re-read the remote blob; do not trust a filename, old receipt, or approval card.
   Run `node scripts/operations/release-preflight.mjs resume evidence.json` with `identity`,
   fresh `remote`, and `approval`. Matching bytes return `already-present`; mismatched bytes
   stop; missing/stale/uncertain reads require a read first. Only a confirmed `not_found`
   plus `approval: "approved"` returns `eligible-for-authorized-upload`. This is not a grant
   of authority and does not override denial/retry limits. `accepted`, `pending`, and `visible`
   do not count as approval or execution. Tool success without a remote read is not a receipt.
   Blocked resume decisions exit 1; only already-present or eligible decisions exit 0.

Keep task scope, current owner grants, unresolved operations and ownership, exact commit,
per-file receipts, and remaining verification in the handoff. Do not inherit unrelated
scheduled-newsroom restrictions into deployment work or treat previous “Always Allow” as
a blanket custom rule. A denied call may be retried only once with materially new evidence
when known not executed; an uncertain result requires read-only reconciliation first.

## Automatic HLS workflow boundary

`package-missing-hls.mjs` is invoked by the existing HLS workflow on main only.
It validates existing VOD references/nonempty files and never rewrites an existing
package. Only MP4 paths changed in the triggering push and lacking a package are
transcoded, into temporary directories with rename after validation. Historical
MP4-only fallbacks are not backfilled. Manual dispatch validates but does not
regenerate history. Modified existing MP4 sources fail closed, even if a poster or package also changes: use a new immutable asset ID or a separately reviewed repair. New sources with prepackaged HLS are preserved.

This is a preservation and structural-integrity check, **not** an audiovisual QA
or provenance verifier. A replacement path in a diff is not proof that all bytes
are approved; the release manifest/hash checks, preview playback, and approval
contract still apply. Broken existing packages fail rather than being silently
repaired. Existing CI/release gates are unchanged. The workflow refuses a stale
main and uses an ordinary fast-forward push, never rebasing media over a newer
release. Its concurrency group cannot stop a legacy run already executing old
workflow code; that run must be reconciled separately before merging this fix.

The packaging job has a 30-minute timeout and its conditional ffmpeg installation
has a 5-minute timeout. An installation/generation failure cannot reach the commit
step. These bounds do not change or stop an already-running legacy job.
