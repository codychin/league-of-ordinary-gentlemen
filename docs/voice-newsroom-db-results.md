# Private voice database verification

Verified 2026-10-19 17:36–17:38 UTC, project dnzdbqycuuoonewcowis. No migration or persistent write performed. No provider calls. Tests executed inside explicit transactions and rolled back.

PASS: private schema exists; all three tables have RLS and only postgres table privileges; authenticated lacks private schema usage. Public RPC has SECURITY DEFINER and empty search_path. Anon lacks execute; authenticated has execute.

PASS: actual anon-role RPC invocation denied, authenticated-role direct private table and helper-function access denied.

PASS: actual authenticated-role RPC denies missing claims and nonowner UUID. Existing verified owner UUID selected internally, never returned; transaction-local claims simulated the database auth context. This does not establish signed JWT or browser login validity.

PASS: owner open/read/claim/stage/heard/end; occupied floor rejection; staged response absent from heard transcript; interruption discards pending response; stale interrupt cannot clear newer turn; stale reserve/start rejected; wrong-room start rejected; duplicate reservation/start/heard rejected; exactly $20 reservations accepted and further micro-dollar rejected; End preserves reservation total and operation history; expired room read denied and End allowed.

CONCURRENCY LIMITATION: two concurrent tool requests attempted an eight-second budget row lock and a 500ms competing lock. No overlap was observed, so the contention assertion returned INCONCLUSIVE, not a failure of the schema. Tool dispatch may serialize calls. Multi-session concurrent RPC execution remains unverified. Sequential occupancy/replay invariants were verified.

Final retained state: 0 rooms, 0 operations, 0 reserved microUSD. SQL fixture: rollback-invariants.sql. No signed session, browser, audio, provider billing or live Edge behavior tested.
