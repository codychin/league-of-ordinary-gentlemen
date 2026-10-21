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


## October 21 approved production promotion

At 13:02 UTC Cody explicitly requested promoting the reviewed staging release
`dd97d613eef52a541a318f4b22ceef9e5486a560` to production. This subsequent
approval supersedes the staging-only restriction above and the Conrad baseline
for the current lead/card expectations; the historical records remain intact.

- Lead: Marnie, “The Delicate Etiquette of a Sporting Pat”.
- Exact cards: Conrad medical clearance → Rams kicker → NFC East.
- West Virginia goes directly to archive, retaining its URL and approved copy.
- The established headline template remains intact. Only its subtitle type scale
  is larger: 20px desktop and 18px at widths up to 760px, line-height 1.45.
- The thumbnail is the reviewed 765×680 crop from 6.333529 seconds of the same
  embedded CBS interview, labeled GOOD INTENTIONS. The original article hero,
  approved prose and plain-text Oregon quotation remain unchanged.
- All published league data, videos, backend behavior and unrelated main changes
  are preserved. Staging-only snapshots, QA labels and no-write gates are not
  promoted. PR #62 remains separate and unmerged.

Faithful future-card crop/label simulations at 337×170 and 280×150 retained both
faces. Those are simulations, not an already-published Marnie carousel card.
Prior desktop staging QA passed; mobile/PWA visual QA was not performed, and the
official Key & Peele embed loaded but buffered at 0:00 in the cloud browser.
