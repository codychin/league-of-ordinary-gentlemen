# Capped shared Live Desk

Updated 2026-10-25 under standing Sunday authorization. This replaces the two independent paid editorial pipelines.

- One shared NFL post is merged into both existing feeds at read time. Old league-local posts remain isolated. New automated league-local stories are disabled until fresh league evidence and a scoped budgeted path are implemented.
- Polling scores does not itself call a model. The shared worker attempts at most one new scoring/final-game event every three minutes, only on Sunday from 10:30 through midnight America/Detroit. No repeat generation for the same event.
- At most two calls: draft and independent approval. No revision/retry loops. Rejected work consumes the reservation.
- Fixed gpt-5.4-mini at standard service tier, no billable tools. Maximum 48,000 UTF-8 bytes instructions+input and 3,000 output tokens. Published standard prices checked 2026-10-04: $0.75/M input, $4.50/M output (https://developers.openai.com/api/docs/models/gpt-5.4-mini).
- Each candidate atomically claims its event and reserves draft plus review ($0.20 total) before network access. Each $0.10 slot is single-use. Unused reviewer slots and rejected drafts remain charged to the reservation cap. At verified rates the conservative byte-to-token upper bound plus 2,048 framing tokens and full output is below $0.10. Reservations are never refunded, including timeout/unknown charges. Refresh these bounds before changing models, rates, request size, output limits, tools or service tier.
- Combined ceiling $10 per Friday-through-Thursday period, anchored to Friday midnight America/Detroit. No rollover. Starts with the new workflow; earlier unmetered usage is not included. Tax, hosting, other API applications and ChatGPT Work usage are outside this guard.
- Cumulative capacity: 70 calls/$7 before 16:00 Detroit, 86/$8.60 before 20:00, then 100/$10 until midnight. Both count and cents are enforced independently under the same budget-row lock. No new cron; existing minute cron and three-minute attempt spacing remain.
- RLS/service-role-only SQL reservation serializes concurrent calls. 100 requests max, often fewer than 50 approved stories. Actual input/output tokens and conservatively estimated USD (no cache discounts) recorded in brief_desk_usage.
- Pause: update brief_desk_control set enabled=false where id; also disable cron job brief-editorial-worker. An already submitted request can finish, but was reserved first.
- Usage: select period_start,sum(reserved_cents)/100.0 as reserved_usd,sum(estimated_usd) as estimated_actual_usd,count(*) as calls from brief_desk_usage group by period_start;
- Never reactivate the old worker imports or generation calls in brief-sunday-engine. Legacy files remain for history/tests only. The score engine does no editorial generation.

Verification: unit tests cover denial before HTTP, failed requests without retries/refunds, request bounds, event deduplication and disconnected legacy entrypoints. A rolled-back database test proves reservation 101 is denied.
