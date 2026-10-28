# Prepare completed renders before release approval

`prepare-media.mjs` is an operator-invoked extension of the existing release
receipt workflow. Invoke it as each **existing** generation becomes complete;
other renders need not finish first. It does not start renders, spend credits,
write the publication registry, alter the public shelf, upload, merge, or promote.
No new schedule, service, credentials, DB schema or locking system is introduced.
The existing HLS workflow and all release checks remain unchanged.

## Before a batch

Read `docs/release-contract.md`, current `brief_rules` (both active and locked),
canonical correspondent records and exact script/spend grants. The registry is
`brief_publication_articles` in existing project `dnzdbqycuuoonewcowis`.
Read current main, serving commit and active writers. Retain the actual capability
and transport evidence, not merely a list of available tools.

Run:

```sh
node scripts/operations/prepare-media.mjs preflight snapshot.json
```

The input extends the existing version-1 `release-preflight.mjs` snapshot with:

- `reviewCapability.auditory` and `.fullMotion`: each contains `status:
  "demonstrated"`, a real `reviewer`, `evidence` reference, `canarySha256` and
  `observedAt`. Evidence must demonstrate complete listening/continuous-motion
  inspection on a canary with this executor/reviewer. Tool discovery, sampled
  frames, ASR, decode and boolean flags alone are insufficient.
- `ingestCanaries.small` and `.connectorExpandedOver16MiB`: each contains `status:
  "verified"`, exact `durableCommit`, `sha256`, `bytes`, `expandedBytes`, `readbackEvidence`, `observedAt`.
  The evidence must include the original size and expanded connector size.

Snapshots expire after five minutes and reject future timestamps. This offline
checker validates supplied evidence, not the truth of attestations. Missing
review capability blocks starting a future batch; it is not repaired by copying
Week 7's informed owner exception. Authorized technical preparation of already
existing artifacts can proceed independently, with review still outstanding.
There is intentionally no `--skip-review` or fake pass option.

## Per-render preparation

Use a separate candidate directory and the existing durable receipt/handoff
location, outside application/public data. Re-read the registry export at each
stage; the CLI opens `current-registry.json` anew each time. Its contents are
`{observedAt, row}`. An external operator must refresh it from the registry;
refreshing only the timestamp is not a source read.

```sh
node scripts/operations/prepare-media.mjs prepare \
  request.json current-registry.json /durable/candidate /durable/receipts
```

`request.json` contains:

- `row`: the existing script registry `{id, metadata}`. Required metadata is
  `edition`, `season`, `week`, `kind` (`preview` or `recap`), `matchupTeamIds`,
  exact `matchupKey`, `sourcePackageSha256`, `scriptRevision`, `scriptSha256`,
  `scriptApproved: true`, `approvalStatus: "exact_script_approved"`, and
  `videoGeneration: {status: "completed", videoId}`. If `videoGenerationId` is
  also present it must match. Preserve `writer_slug`, canonical `voiceId`, avatar
  identity and supplied-audio hash when present; assembly requires exact writer
  and voice provenance. Pending/failed renders are blocked, never recreated.
- `identity`: `{bytes, sha256, gitBlobSha}` of the original, from the existing
  receipt/registry and `release-preflight.mjs hash`. It is separate from HLS hashes.
- `preparationApproval`: `{status: "approved", binding, evidence, expiresAt}`.
  `binding` is `preparationBinding(binding(row, identity))`, exported by the module.
  This records the real grant for this exact revision; it is not spending or
  publication authority. The fixture generator's test grant is never real approval.
- `source`: normally `{kind: "file", path}` for an already authorized durable
  artifact, or `{kind: "git", repository, commit, path}` for an exact already
  fetched immutable Git commit and original `public/reels/<videoId>.mp4` path.
- Optional `existingPackage`: `{path, videoId, sourceSha256, files: [{name, identity}]}`
  backed by exact existing package hashes. Otherwise the canonical
  `package-missing-hls.mjs` packages this single original in isolation.

The command verifies the original before atomic installation; validates/hashes
all HLS files; independently decodes original and HLS video/audio; then writes an
unpublished shelf candidate bound to edition/season/week/kind/pair and revision.
It fsyncs installed data and creates immutable receipts. Successful stages survive
restart. Original and package hashes are rechecked before reusing a technical
checkpoint. Changed bytes or revisions stop rather than replacing history.
A complete asset is a no-op for media writes, packaging and decoding.

Checkpoint files are `binding.json`, `ingest.json`, `package.json`,
`technical.json`, and `shelf.json` under the binding hash in the existing receipt
directory. Per-attempt event files distinguish `incomplete`, `failed`, and
`blocked`, with the exact stage/reason/time. An interruption can leave an
`incomplete` event; reconcile installed bytes first. Never interpret missing
success receipts as permission to regenerate or repeat a remote write. Retain
this directory through the existing Git/artifact handoff before discarding an
executor. Local fsync alone does not survive loss of the executor.

Use the existing single release owner and workflow concurrency. The module
rechecks revisions before stages and before installation, and atomically refuses
conflicting checkpoints for the same video ID. This is **not a distributed lock**:
independent stale exports can conceal a remote revision change; simultaneous
same-revision workers may duplicate CPU work before reconciling. Do not launch
competing preparers for one asset. Re-read the authoritative registry and current
main immediately before assembling/releasing the candidate.

## Transport and reconciliation

Prefer one ordinary Git/artifact batch containing the prepared originals, HLS and
receipts. Fetch its immutable commit without switching the consumer's branch;
compare every path/blob and original SHA-256. Use existing `recordReceipt` for
confirmed remote blob reads and additionally verify the immutable commit tree.
A git-blob-only receipt is not a committed/staged/live file. Do not put the
internal `preparation-source.json` marker or private registry exports on the
public shelf; copy only manifest-listed public media and the sanitized shelf
fields when assembling an authorized candidate.

The command also accepts explicit recovery sources:

- `connector-recovery`: `{kind, path}` to a local `{encoding:"base64",content}`
  connector envelope; strict base64 and exact original hashes are checked.
- `chunk-recovery`: `{kind, chunks:[{path,identity},...]}` in original order;
  each chunk and the reconstructed full original are checked.

These support the proven native Git/unreferenced transport-commit fallback.
They are not the normal speed target and do not bypass CONNECT403 or failed
Library transfer. No network downloader or credential fallback is added.
`deliveryDecision` uses the existing `resumeDecision` with exact original hash
and expiring approval evidence: uncertain/stale reads require reconciliation;
matching remote bytes skip; mismatches stop; only confirmed absence plus current
exact authorization can be eligible. It does not upload or override denial rules.

## Release boundary

`league-gate` takes `{expected, prepared, currentBindings, reviews, approval}`.
`expected` contains six current `binding(row,identity)` objects from the exact
provider pair set; `prepared` contains the six shelf candidates. `reviews` must
bind to each asset and contain real reviewer/evidence plus explicit full auditory,
full-motion and performance approval. `approval` requires all six exact binding
hashes, real evidence, approved status and unexpired `expiresAt`. No cross-league,
preview/recap, partial set or stale revision passes. It returns only
`eligible-for-existing-staging-gates`, never publication.

Then use the existing staged six-route/browser/media inspection, manifest upgrade,
protected PR checks, exact-SHA promotion and custom-domain verification. The
optional `verifyDeliveryProof` evidence checker rejects READY, alias-only,
rendered, partial route evidence and wrong-SHA results. It requires the existing
workflow's `verified` receipt, matching fresh domain/deployment identity and all
six exact route/media/playback evidence records. It neither fetches those facts
nor produces review evidence. The release operator still owns gathering them.

## Reproducible no-spend verification

```sh
node --test tests/media-preparation.test.mjs
node scripts/operations/benchmark-media-preparation.mjs > benchmark.json
npm test
node --test qa/operations/media-preparation.test.mjs
npm run build
```

The benchmark uses only immutable Week 7 fixture artifacts from
`qa/week7-recap-assets.json`: 18 originals and 250 HLS files. It fully decodes
originals and HLS, restarts each, and runs one canonical ffmpeg package in a
temporary directory. It never approves the fixtures or rewrites their public
files. Tests also use the real 12,824,307-byte original whose base64 envelope
is 17,099,076 bytes (>16 MiB), plus a smaller original, Git object reads and
ordered-chunk reconstruction. This is existing-artifact rehearsal, not proof of
a newly completed provider render's normal ingest route or approval-to-live SLA.

## Actual shelf assembly and completion entry points

The npm entry points are `media:preflight`, `media:prepare`, and `media:assemble`.
Call `media:prepare` from the existing render owner's completion handling with
that completed generation's fresh registry export; no polling worker is added.
Do not continue treating the provider's `completed` response as delivery.

After the real full reviews and exact release approval, run:

```sh
npm run media:assemble -- assembly.json current-release.json
```

`assembly.json` contains `repository` (unchanged source checkout), `root` (isolated
prepared overlay), `receipts`, and `evidence` (the league-gate object plus
`expectedMain` and `baseManifestSha256`). `current-release.json` contains fresh
`observedAt`, `currentMain`, and `currentBindings` read from the existing registry.
The default consumer is the actual `lib/week7-reels.js` import of
`data/week7-approved-homepage-media.json`. Explicit `manifestPath`/`consumerPath`
are supported only when the existing module already imports that manifest. The
assembler refuses to change the existing shelf's week, kind, pair set or labels;
a future week's consumer/layout change requires its own normal reviewed update.

Assembly validates original/package/technical/shelf checkpoints again, preserves
other leagues and display ordering, strips any previous playback exception, and
writes an immutable candidate manifest. It returns `transportFiles`, the exact
public original/HLS/manifest path-and-hash list for one ordinary Git batch. These
are the only files to add from the overlay; internal source markers and receipts
are separate private handoff artifacts. No second main-push packaging is needed:
the existing `planPackages` must return `[]` before assembly succeeds. Existing
main-advanced/concurrency guards are untouched. Commit the listed paths on the
scoped candidate branch, run existing Release integrity/image gates, inspect the
staging build and use the existing approved production workflow only when later
authorized. This engineering upgrade does not perform that publication.

Use `prepare-media.mjs resume-delivery evidence.json RECEIPTS` after remote reads.
It records uncertain, blocked, confirmed or known-not-executed transport separately
and calls existing `recordReceipt` only for fresh matching blob reads. The command
never uploads. Missing/stale/uncertain evidence exits nonzero and requires a read
before any retry; denial remains subject to the existing once-with-new-evidence
rule. A matching blob still proves neither branch reachability nor publication.

The integration test invokes the actual preparation CLI for six existing DOGE
originals with real full decodes, assembles the actual consumer manifest in a
temporary overlay, loads `week7Reels` against it, and checks every shelf HEAD,
native-HLS playlist/segment and MP4 path over local HTTP. It proves no additional
HLS work is planned. Review/approval and final serving-receipt inputs in that test
are explicitly synthetic fixtures, never reports of actual listening or live
publication. Wrong main, partial league, stale/absent proof and reuse of the
Week 7 exception fail. Hosted playback remains a separate required gate.


Real ffmpeg/HTTP integration checks run as a prerequisite job inside the existing
Release integrity workflow, on its existing Ubuntu runner family. The pinned
Playwright browser job and its no-runtime-browser-install rule remain intact.
No generation credentials are used; missing ffmpeg/ffprobe fails explicitly.
The existing `integrity` job depends on this preparation job, so promotion cannot
admit a candidate whose preparation checks failed.
