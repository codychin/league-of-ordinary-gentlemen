# Capped shared Live Desk

Pacing proposal updated 2026-10-26; not deployed. Existing operating contract was updated 2026-10-25 under standing Sunday authorization. This replaces the two independent paid editorial pipelines.

- One shared NFL post is merged into both existing feeds at read time. Old league-local posts remain isolated. New automated league-local stories are disabled until fresh league evidence and a scoped budgeted path are implemented.
- Polling scores does not itself call a model. The shared worker attempts at most one new scoring/final-game event every three minutes, only on Sunday from 10:30 through midnight America/Detroit. No repeat generation for the same event.
- At most two calls: draft and independent approval. No revision/retry loops. Rejected work consumes the reservation.
- Fixed gpt-5.4-mini at standard service tier, no billable tools. Maximum 48,000 UTF-8 bytes instructions+input and 3,000 output tokens. Published standard prices checked 2026-10-04: $0.75/M input, $4.50/M output (https://developers.openai.com/api/docs/models/gpt-5.4-mini).
- Each candidate atomically claims its event and reserves draft plus review ($0.20 total) before network access. Each $0.10 slot is single-use. Unused reviewer slots and rejected drafts remain charged to the reservation cap. At verified rates the conservative byte-to-token upper bound plus 2,048 framing tokens and full output is below $0.10. Reservations are never refunded, including timeout/unknown charges. Refresh these bounds before changing models, rates, request size, output limits, tools or service tier.
- Combined ceiling $10 per Friday-through-Thursday period, anchored to Friday midnight America/Detroit. No rollover. Starts with the new workflow; earlier unmetered usage is not included. Tax, hosting, other API applications and ChatGPT Work usage are outside this guard.
- Proposed cumulative capacity: 70 slots/$7 before 16:00 Detroit, 86/$8.60 until 20:30, then one draft/review pair (two slots/$0.20) every half hour through 23:30, reaching 100/$10. Unused capacity carries forward within the same budget period. Both count and cents are enforced independently under the same budget-row lock. No new cron; existing minute cron and three-minute attempt spacing remain.
- RLS/service-role-only SQL reservation serializes concurrent calls. 100 requests max, often fewer than 50 approved stories. Actual input/output tokens and conservatively estimated USD (no cache discounts) recorded in brief_desk_usage.
- Pause: update brief_desk_control set enabled=false where id; also disable cron job brief-editorial-worker. An already submitted request can finish, but was reserved first.
- Usage: select period_start,sum(reserved_cents)/100.0 as reserved_usd,sum(estimated_usd) as estimated_actual_usd,count(*) as calls from brief_desk_usage group by period_start;
- Never reactivate the old worker imports or generation calls in brief-sunday-engine. Legacy files remain for history/tests only. The score engine does no editorial generation.

Verification: unit tests cover denial before HTTP, failed requests without retries/refunds, request bounds, event deduplication and disconnected legacy entrypoints. A rolled-back database test proves reservation 101 is denied.


## Evening pacing proposal (draft; no production application)

The October 25 scorecard reports 100 reserved slots, ten published posts and exhaustion
by 20:22 Detroit. These are reservations, not 100 completed calls or a $10 invoice.
The former 20:00 step exposed all fourteen remaining slots to seven consecutive
candidate attempts. With three-minute spacing, an evening burst could consume all
seven pairs in roughly 21 minutes, including declines and rejected drafts.

The focused change in `docs/sql/brief-desk-daypart-reservations.sql` retains the
existing function, row lock, pair reservation and two independent ceilings. Only
the cumulative evening release times change:

| Detroit local time | Cumulative reserved slots | Reservation allowance |
| --- | ---: | ---: |
| Sunday 10:30–15:59 | 70 | $7.00 |
| 16:00–20:29 | 86 | $8.60 |
| 20:30–20:59 | 88 | $8.80 |
| 21:00–21:29 | 90 | $9.00 |
| 21:30–21:59 | 92 | $9.20 |
| 22:00–22:29 | 94 | $9.40 |
| 22:30–22:59 | 96 | $9.60 |
| 23:00–23:29 | 98 | $9.80 |
| 23:30–23:59 | 100 | $10.00 |

Outside the existing Sunday 10:30–midnight window, reservation is refused. The
last pair becomes available with thirty minutes remaining, leaving several
existing cron opportunities without opening generation after midnight. There is
no new timer, persistent pacing table, backfill queue, refund, retry or quota.
Denied reservations do not consume event keys; each later tick evaluates current
evidence using the unchanged selector and editorial checks. Review slots
are already reserved with their drafts, so pacing cannot strand a draft awaiting
new review capacity. A clock check can still stop it at midnight as before.

This protects the *opportunity* to evaluate later developments. It does not
promise more posts or a higher approval rate: one night's result is insufficient
to diagnose editorial rejection causes. A burst at 20:00 cannot touch the fourteen
protected slots; even under continual eligible demand, two remain until 23:30.
Earlier unused slots remain available during bursts. Tradeoffs are deferral of
some early-evening news, possible unused allowance on quiet nights, and no
protection against a weak candidate consuming the newly released pair. Quiet
periods must not trigger manufactured stories or spending merely to use capacity.
The 70/86 daytime policy stays unchanged to keep this experiment focused.

After a separately authorized activation, assess useful coverage using existing
usage/event/decision records: reservation time and status, actual provider calls
and token estimates, independent-review rejection reasons, approved novel stories,
and hours with evidence but no capacity. Compare availability and approved
late-game coverage with the October 25 baseline, not just post count. Do not infer
invoice cost from reservation totals or relax editorial checks to improve yield.

## Offline verification and activation boundary

The deployed function was inspected read-only on October 26 and matched the old
checked-in SQL. This PR changes that existing operational SQL artifact; it is not
a new migration or an automatic deployment. Applying it later requires a separate
release decision, after PR87/88 verification. Preserve owner/ACL and existing data;
`CREATE OR REPLACE FUNCTION` changes no counters, events or dispatches. Existing
reservations above the new interim ceiling stay charged and block new work until
capacity catches up. Website deployment alone does not install this function.

Reproduce without production credentials or generation (Node 24 used locally):

```sh
npm ci --cache /tmp/npm-cache --no-audit --no-fund
npm test
npm run build
npm install --cache /tmp/npm-cache --prefix /tmp/desk-test-tools --no-audit --no-fund @electric-sql/pglite@0.3.14 pg@8.16.3 embedded-postgres@18.1.0-beta.15
PGLITE_MODULE=/tmp/desk-test-tools/node_modules/@electric-sql/pglite/dist/index.js node scripts/operations/verify-desk-reservations.mjs
EMBEDDED_PG_MODULE=/tmp/desk-test-tools/node_modules/embedded-postgres/dist/index.js PG_MODULE=/tmp/desk-test-tools/node_modules/pg/lib/index.js node scripts/operations/verify-desk-pacing-postgres.mjs
```

The PGlite harness compiles the exact SQL, then substitutes only the clock in an
isolated fixture: 56 window/daypart exhaustion cases, every evening boundary on
summer/fall-back/spring-forward Sundays, duplicate-event refusal, transactional
rollback, independent count/cents caps, disabled control and queued requests.
The native PostgreSQL harness adds actual independent-session contention (two
12-client races), nonrefundable declined/rejected/unknown work, burst demand,
carry-forward without forced work, a full server restart, a reservation blocked
on a row lock across midnight, existing above-ceiling usage and weekly rollover.
It creates a temporary localhost-only cluster and accepts no remote database URL.
Test dependencies are external to application dependencies and lockfile.

Limitations: native fixtures use PostgreSQL 18.1, while the inspected hosted
instance is 17.6. Neither fixture reproduces hosted load/network failures. The
existing worker tests use fake HTTP and verify denial before model access, no
retry, single-use slots, disabled control and midnight checks. No paid generation,
live write, production function installation, cron change, secret change or
published dispatch mutation is part of this proposal.
