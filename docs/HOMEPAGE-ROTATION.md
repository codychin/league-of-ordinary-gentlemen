# Homepage rotation

Editor-approved rule, October 6, 2026:

- Keep the carousel directly below the lead at exactly three stories.
- Preserve newest-to-oldest editorial order down the entire homepage, respecting explicit editor placement overrides.
- A new lead pushes the previous lead into the three-card row. Overflow from that row continues below it; do not archive a newer story just because it is the fourth card.
- Drop the oldest story at the bottom of the full homepage selection: to Culture if applicable, otherwise archive. Preserve its URL and approved copy.
- Apply shared story order across all three editions without moving league-local content between leagues.
- Historical October 6 editor override: archive Arch Manning, retain Watson below Tee Higgins and above Jameis. Keep Mixon lead and Bryce, Tomlin, corgi in the three-card row.

## Approved Phase One baseline — recorded October 21, 2026

Cody Chin explicitly approved the current Conrad lead and ordered three-card row
for staging integration. This supersedes the October 6 named placements for the
lead and three-card row; the historical instruction above remains recorded.

- Lead: Conrad, “The Medical Clearance Industrial Complex”.
- Card 1: Hollis, “West Virginia's Medical Assistance Raises Some Questions”.
- Card 2: Hollis, “The Rams Have Lost 89 Pounds at Kicker”.
- Card 3: Maude, “The NFC East Declines to Name a Winner”.

`qa/editorial-release.json` records these expectations for LOOG, Sunday Crew and
DOGE. Approval does not reorder source or staging content. The standing three-card,
overflow, chronology and edition-scope rules still apply. Staging differences must
be reported rather than corrected by the QA suite. Full overflow chronology is
outside Phase One automated coverage.


## October 21 staging-only Marnie review

Cody explicitly approved Marnie’s “The Delicate Etiquette of a Sporting Pat” as
the staging headline, Conrad → Rams kicker → NFC East as the three-card row,
and West Virginia directly to the archive. The archived article remains routable.
Cody subsequently requested updating the QA manifest to those reviewed changes.
This staging manifest supersedes only the prior lead/card expectations here;
main’s Conrad baseline and the historical records above remain unchanged. No
production publication is authorized by the staging approval.

## October 21 Jay-Z staging review

Cody approved “Allow Me to Reintroduce Myself” with “Finding someone equal to the
occasion is easier when you consider yourself the occasion.” for staging only
(message Sentinel_0c03c8a164c88191a2d770735b12f0ad). The new shared lead pushes
Marnie’s Sporting Pat into the first card, followed by Conrad’s medical-clearance
column and the Rams kicker. NFC East continues immediately below the row rather
than being prematurely archived. West Virginia retains its explicit archive-only
override. All article URLs and prior approved copy remain intact. Production is
not authorized by this review.
