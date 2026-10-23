# Week 7 release incident — 23 October 2026

## Outcome and accountability

The release consumed an unacceptable all-day effort and required the owner to become the progress monitor. Delivering the videos eventually does not erase that failure.

At 21:45 UTC, the verified live release was `213e900f7ed9da9fe0348dff4fea7bb8b7ab32c9` (PR #70), with 18 videos across three editions on `www.ordinarybrief.com`. This is a historical checkpoint, not an assertion about the current head or domain. The legacy **Transcode reels to HLS** run `40027334542` was still being monitored separately at the start of this recovery work; its outcome must be read before any merge or promotion.

The owner's assessment at 21:46:10 UTC was: “we need to learn from that that was absolutley not acceptable”. The assistant acknowledged: “The failures were concrete: I didn’t verify the release path before spending credits, mistook accepted approval messages for visible buttons, mixed newsroom restrictions into deployment work, and let you become the progress monitor.”

## Factual failure cases

| Failure | Evidence and impact | Required prevention |
| --- | --- | --- |
| Paid work preceded release-path verification | All 18 videos used 184 existing HeyGen credits, within the approved 272-credit cap, before the complete access and publication path was verified. | Before another paid batch, establish a tested artifact-to-preview path, available publication/promotion route, durable receipts, and explicit scope/budget. An authorized non-publishing canary is preferable to discovering access problems after rendering. |
| Approval delivery was confused with execution | Upload tools returned accepted approval messages, while the owner reported no visible cards. Idempotent resends returned old cards; cancellation/reissue did not establish visibility. Uploads proceeded after the owner's 21:12 “Always Allow” action. | Track requested, pending, executed, denied, and uncertain separately. Tool acceptance does not prove UI visibility, permission grant, or remote mutation. Never turn that action into a blanket custom rule or bypass future checks. |
| Unrelated task context contaminated deployment | A worker inherited scheduled newsroom no-publication text; review misclassified the direct release despite the owner's 17:34 render/publication approval and 20:57 explicit separation of deployment from newsroom scope. | Use a self-contained engineering handoff carrying current scope and grants, while retaining all applicable safety restrictions. A repository contract cannot control platform reviewer classification. |
| Upload receipts were ephemeral | Environment resets lost in-memory receipt state. Recovery used deterministic Git blob SHAs and remote reads; all 18 original download hashes matched, avoiding rerenders. | Persist each file's receipt immediately, not at batch end. Keep source and packaged hashes distinct: HLS bytes changed during repackaging even where filenames did not. Recover uncertain outcomes by reading the remote before another write. |
| A legacy workflow competed with validated media | The existing HLS workflow deletes `public/reels-hls`, transcodes all MP4 history, and pushes to main. The release triggered it even though the new media was already packaged and QA checked. No supported cancellation API was available and the cloud GitHub browser was signed out. | Detect conflicting writers before release. Preserve historical media and skip only packages whose expected source/output identities are verified. Do not merely disable the workflow or assume an active older run adopts new code. |
| Promotion mechanisms were not preflighted | GitHub auto-promotion lacked `VERCEL_TOKEN`. The connected promotion route was used only after actual CI, exact READY/current-main checks, and protected-preview playback of all 18 videos; the actual domain was then verified. | Verify an existing supported promotion route before spending credits. Do not create credentials to work around the missing secret. Preserve independent commit, CI, READY, promotion, and actual-domain gates. |
| The owner carried operational burden | The owner had to chase progress and repeatedly handle approval delivery problems; a manual multipart ZIP deployment was not an acceptable operating model. | The release owner monitors active work through its terminal state, reports meaningful changes, and asks only for a specific required decision or authorization. Never substitute an eleven-part manual deployment for the supported release path. |

## Verification limits

All 18 audio tracks received independent free ASR and technical checks; visual QA was sampled. This is **not** a claim that a human listened to all audio, nor that ASR establishes subjective voice quality. Protected-preview playback and production verification are separate evidence from those source checks.

The code and tests in the recovery change can enforce only their stated local/workflow boundaries. Passing a locally supplied preflight snapshot does not establish that a remote service is currently accessible, that an approval button is visible, that permissions have been granted, or that a deployment is live. Operator evidence must be current and source-linked. Platform approval UI and reviewer behavior remain external limitations.

## Acceptance of the recovery change

- Regression tests must reproduce the old unsafe behavior and demonstrate the fix; a written checklist is not a test.
- No paid generation, new credentials, security permission changes, schedule changes, or unrelated editorial publication are part of recovery.
- Preserve Week 6 and other existing media; do not re-render or repackage already verified assets just to prove the process.
- Open a reviewable draft PR; coordinate with the owner of run `40027334542`, reread main, and review the exact diff before any separately authorized merge.
- Report implemented checks, passed/failed/not-run tests, operator-only procedures, and external limitations separately. Do not describe a draft PR as a deployed fix.
