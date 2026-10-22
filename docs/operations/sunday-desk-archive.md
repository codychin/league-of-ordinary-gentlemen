# Sunday Desk archive (draft implementation)

This change is passive and read-only. It does not alter the approved October 18 live window, activate workers, change budgets, finalize records, roll fantasy weeks, or delete posts. The existing homepage window ends at October 19 2026 00:00 America/New_York. Client navigation changes from the live anchor to the archive after that cutoff.

## Routes and contract

- LOOG: `/live-desk`
- Sunday Crew: `/sunday-crew/live-desk`
- DOGE4: `/doge/live-desk`
- Read endpoint: `brief-live-desk?action=archive&date=2026-10-18`, with `edition=sunday-crew` or `edition=doge` when applicable.

The date is an Eastern Sunday, not a fantasy week. Empty dates return an explicit empty archive. The default is the most recent Eastern Sunday. Each page contains up to 25 published notes drawn from the existing global published table and only the correct league-local table/status. Cursors bind the date, edition, initial read time and separate timestamp/ID keysets. Timestamps retain PostgreSQL microsecond ordering. This avoids the live endpoint's 100-post ceiling and prevents duplicate timestamps from dropping notes. A read-time bound excludes newly published notes during pagination; later editorial edits/withdrawals remain authoritative, not an immutable historical snapshot.

## Release requirements

Deploy the read-only edge-function change before the website. No database migrations or record changes are required. Do not promote either from this draft without normal release authorization and checks. Existing live/editor endpoints are unchanged.

Before release, verify real endpoint rows and pages against all three editions, including an older Sunday with over 100 notes if available; no draft/hold/killed or wrong-league text may appear. Verify malformed cursors, empty Sundays, DST bounds and source links. Inspect desktop 1440px, mobile 390/360px and installed-PWA-sized archive screens and return navigation. Verify after cutoff that normal homepage layout and scores/Monday coverage remain, archive links work and no paid worker starts. A successful local build is not staging or production verification.
