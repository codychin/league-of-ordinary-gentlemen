# Private voice newsroom preview

Branch: codex/private-voice-newsroom. Production and any other branch return404 for both the room and API. No ordinarybrief.com release is intended.

Entry: /manage/newsroom after signing into the existing owner account through /manage. All room, status and static UI requests repeat the verified owner gate. Vercel deployment protection stays enabled as an additional layer; it is not a substitute for owner authorization.

## Activation gates

The exact preview branch needs two server-only variables: NEWSROOM_OPENAI_API_KEY and NEWSROOM_COST_POLICY. The key is entered by the owner directly in the existing Vercel project's secure environment-variable settings. Select Preview only and branch codex/private-voice-newsroom. Do not choose Production or all branches, do not use NEXT_PUBLIC, and never paste the key into chat. The owner explicitly approved this dedicated connection configuration on2026-10-19; no existing production key was read or reused.

NEWSROOM_COST_POLICY is a reviewed JSON cost policy with totalTestCapUSD:20, verifiedAt and quotes for stt/reason/tts. Each quote has sourceURL, expiry, maximumMicroUSD and upper bounds. Reasoning additionally binds the precise model (currently gpt-4.1-mini), maxInputBytes and maxOutputTokens200; STT bounds maxAudioBytes960044 and maxSeconds30; TTS bounds maxInputBytes. Unknown/expired bounds disable calls. No policy with invented prices is supplied.

The fixed lifetime ledger is in docs/voice-newsroom-schema.sql, an UNAPPLIED draft. It must receive database/security review, migration preparation using the existing workflow, actual concurrency/RLS tests and explicit scoped application authorization before paid activation. Do not deploy a secret and assume this applies the schema. Room state is owner-scoped; transactions lock room and budget rows. Reservations are never refunded/reset and do not cascade with deleted rooms. The application does not retain raw audio. Transcript expiry denies access immediately; physical row cleanup occurs on later room open/end, not an invented schedule. This retention detail needs review before activation.

## Verification

19 targeted unit/static tests pass. Eight repository release/routing tests and production-boundary assertion pass. Next16 production compile/build succeeds in the cloud workspace using existing installed dependencies. The schema has NOT been applied to any database, and SQL tests are static rather than actual Postgres transactions.

Provider requests are mocked in the original adapter suite. No live provider call, charge, mobile/AirPods test, successful Chromium browser smoke or private deployed login test is claimed. Chromium startup was blocked by workspace socket restrictions. Full source culture handoff and four whole-piece benchmarks are bundled; latest team-not-regiment direction is included.

Known first-prototype limitation: Cody selects the next participant explicitly; automatic independent requests-to-speak are not implemented. Rika does not manufacture all correspondents' replies. Each response uses its own persona context plus shared heard-only transcript. Interrupted partially played utterances are conservatively excluded from shared history.

Use short initial tests only after private access, active cost bounds, database enforcement and provider account setup are verified. No article publishing, external tools, recurring jobs, audio storage or public production release are attached.
