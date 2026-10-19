# Private newsroom recovery / activation gates

NOT READY. No deployed Edge function or applied schema. Existing remote preview uses superseded key architecture.

## Intended connection
Owner-authenticated Vercel preview forwards the verified owner's existing Supabase session to a separate owner-only Supabase voice function. OPENAI_API_KEY stays in Supabase; no copy or new key is needed. No current Live Desk/worker endpoint or budget is used.
Edge performs its own Auth getUser and explicit owner RPC checks. Whole turn orchestration and bundled canonical guidance live server-side. Browser cannot submit model/persona/canon/speech payloads to a standalone generation endpoint.

## Local changes after recovery review
- Removed standalone reason/speech Edge actions. Turn claiming, canonical context, staging and streaming occur in Edge.
- Explicit abort controller plus current-turn polling aborts reasoning/speech after interrupt or cancellation.
- Lifecycle end/interrupt/heard does not depend on model readiness or remaining budget. End also handles expired rooms.
- Read-only status requires healthy voice ledger and complete current max-size pricing quotes.
- Every model quote binds model ID; normalized speech input is priced.
- SQL reservations/start now require live owner room and matching optional turn. No cascading foreign keys can erase ledger history. Busy claims reject rather than silently replacing the floor.

## SQL revision and authorization reconciliation
Original exact SQL is docs/voice-newsroom-schema-original-approved.sql (SHA256 1f3719a19d9e78b8fbb8d3942f4e8bafd37f6e269516ac59eca4bbc4a8816c2b).
The revised docs/voice-newsroom-schema.sql remains UNAPPLIED and needs parent reconciliation before execution. Differences: new read-only status action; room_id/turn_id on operation records; room/turn validation on reserve/start; occupied-floor rejection. No additional grants or credential access.
Do not send revised bytes as if identical to the previous approval artifact.

## Remaining gates
- Functional approval/execution path. Three same-operation requests ended expired; delayed form attachment is a plausible cause, not an established service fault. Scope approval exists; do not request the same permission blindly.
- Independent re-review and full repository Next build (this recovery package is partial).
- Actual SQL authorization and concurrency tests; no fabricated owner identity or bypass.
- Reviewed cost policy with defensible worst-case billing limits, including audio generation after cancellation. The $20 reservation ledger alone is NOT proof of a $20 invoice ceiling.
- Deno runtime/import verification and authenticated Edge deployment tests.
- Real owner login, microphone/playback/interruption and iOS AirPods test.

No provider charges, raw recordings, publishing, new recurring schedules or production website promotion are authorized by this document. No physical 20-minute deletion guarantee: read access expires; row deletion occurs on End or subsequent open.

## Verified activation progress, 2026-10-19 17:38 UTC
The revised schema was applied by the parent at17:35 UTC. Real rollback-only PostgreSQL tests passed for owner/nonowner claims, private-table denial, room lifecycle, occupied/stale turns, replay, cap, expiry and no-refund deletion. Final retained state was0 rooms,0 operations,$0 reserved. These tests are not a signed browser login, and attempted multi-session lock testing did not overlap, so concurrency remains unverified.

The revised Edge entrypoint bundles the nonsecret reviewed policy and TEST_ENABLED=false. No new environment secret is required. An owner-only readiness action checks fixed model metadata endpoints without generation; model existence is not account tariff proof. Enabling remains a separate reviewed code deployment after account tariff applicability is verified. No fallback model or expired-price refresh is automatic.
